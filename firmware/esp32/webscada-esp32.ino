/**
 * WebSCADA ESP32 Device Firmware
 *
 * This firmware enables ESP32 devices to connect to the WebSCADA platform
 * via MQTT protocol. It supports DHT22 temperature/humidity sensors and
 * LED control capabilities.
 *
 * Hardware Requirements:
 * - ESP32 Development Board
 * - DHT22 Temperature/Humidity Sensor
 * - LED (built-in or external)
 *
 * Libraries Required:
 * - WiFi (built-in)
 * - PubSubClient (MQTT client)
 * - ArduinoJson
 * - DHT sensor library
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===== Configuration =====
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT broker settings
const char* MQTT_BROKER = "192.168.1.100";  // Your WebSCADA server IP
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "";  // Leave empty if no authentication
const char* MQTT_PASSWORD = "";

// Device configuration
const char* DEVICE_ID = "esp32-01";  // Unique device identifier

// GPIO pins
#define DHT_PIN 4       // DHT22 sensor data pin
#define LED_PIN 2       // Built-in LED pin (or external LED)
#define DHT_TYPE DHT22  // DHT sensor type

// Timing intervals (milliseconds)
const unsigned long DATA_PUBLISH_INTERVAL = 5000;      // 5 seconds
const unsigned long HEARTBEAT_INTERVAL = 15000;        // 15 seconds
const unsigned long WIFI_RECONNECT_INTERVAL = 5000;    // 5 seconds
const unsigned long MQTT_RECONNECT_INTERVAL = 5000;    // 5 seconds

// ===== Global Objects =====
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
DHT dht(DHT_PIN, DHT_TYPE);

// ===== State Variables =====
bool ledState = false;
unsigned long lastDataPublish = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastWiFiReconnect = 0;
unsigned long lastMqttReconnect = 0;
unsigned long deviceUptime = 0;

// MQTT Topics
String topicData;
String topicControl;
String topicOnline;
String topicStatus;

// ===== Setup Function =====
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=================================");
  Serial.println("WebSCADA ESP32 Device");
  Serial.println("=================================");

  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT sensor initialized");

  // Setup MQTT topics
  topicData = String("devices/") + DEVICE_ID + "/data";
  topicControl = String("devices/") + DEVICE_ID + "/control";
  topicOnline = String("devices/") + DEVICE_ID + "/online";
  topicStatus = String("devices/") + DEVICE_ID + "/status";

  // Connect to WiFi
  connectWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(60);

  // Connect to MQTT broker
  connectMQTT();

  Serial.println("Setup complete!");
  Serial.println("=================================\n");
}

// ===== Main Loop =====
void loop() {
  unsigned long currentMillis = millis();

  // Update uptime
  deviceUptime = currentMillis / 1000;

  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMillis - lastWiFiReconnect >= WIFI_RECONNECT_INTERVAL) {
      lastWiFiReconnect = currentMillis;
      connectWiFi();
    }
  }

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    if (currentMillis - lastMqttReconnect >= MQTT_RECONNECT_INTERVAL) {
      lastMqttReconnect = currentMillis;
      connectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // Publish sensor data
  if (currentMillis - lastDataPublish >= DATA_PUBLISH_INTERVAL) {
    lastDataPublish = currentMillis;
    publishSensorData();
  }

  // Publish heartbeat
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = currentMillis;
    publishHeartbeat();
  }
}

// ===== WiFi Connection =====
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ===== MQTT Connection =====
void connectMQTT() {
  Serial.print("Connecting to MQTT broker: ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  // Create client ID
  String clientId = String("webscada_") + DEVICE_ID;

  // Set Last Will and Testament (LWT)
  String lwtMessage = "{\"status\":\"offline\",\"deviceId\":\"" + String(DEVICE_ID) + "\"}";

  // Connect to broker
  bool connected = false;
  if (strlen(MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(
      clientId.c_str(),
      MQTT_USERNAME,
      MQTT_PASSWORD,
      topicOnline.c_str(),
      1,
      true,
      lwtMessage.c_str()
    );
  } else {
    connected = mqttClient.connect(
      clientId.c_str(),
      topicOnline.c_str(),
      1,
      true,
      lwtMessage.c_str()
    );
  }

  if (connected) {
    Serial.println("MQTT connected!");

    // Subscribe to control topic
    mqttClient.subscribe(topicControl.c_str(), 1);
    Serial.print("Subscribed to: ");
    Serial.println(topicControl);

    // Publish online status
    publishOnlineStatus(true);

    // Publish initial status
    publishStatus();
  } else {
    Serial.print("MQTT connection failed, state: ");
    Serial.println(mqttClient.state());
  }
}

// ===== MQTT Callback =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic: ");
  Serial.println(topic);

  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Print received command
  serializeJsonPretty(doc, Serial);
  Serial.println();

  // Handle control commands
  if (doc.containsKey("action")) {
    String action = doc["action"].as<String>();

    if (action == "setLED") {
      if (doc.containsKey("ledState")) {
        ledState = doc["ledState"].as<bool>();
        digitalWrite(LED_PIN, ledState ? HIGH : LOW);
        Serial.print("LED set to: ");
        Serial.println(ledState ? "ON" : "OFF");
        publishStatus();
      }
    }
    else if (action == "toggleLED") {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      Serial.print("LED toggled to: ");
      Serial.println(ledState ? "ON" : "OFF");
      publishStatus();
    }
    else if (action == "requestStatus") {
      publishStatus();
    }
    else if (action == "reboot") {
      Serial.println("Rebooting device...");
      delay(1000);
      ESP.restart();
    }
    else {
      Serial.print("Unknown action: ");
      Serial.println(action);
    }
  }
}

// ===== Publish Sensor Data =====
void publishSensorData() {
  if (!mqttClient.connected()) {
    return;
  }

  // Read sensor data
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Check if readings are valid
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = round(temperature * 100.0) / 100.0;
  doc["humidity"] = round(humidity * 100.0) / 100.0;
  doc["ledState"] = ledState;
  doc["timestamp"] = millis();

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  bool published = mqttClient.publish(topicData.c_str(), payload.c_str(), false);

  if (published) {
    Serial.print("Sensor data published: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish sensor data");
  }
}

// ===== Publish Heartbeat =====
void publishHeartbeat() {
  if (!mqttClient.connected()) {
    return;
  }

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "online";
  doc["uptime"] = deviceUptime;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["wifiRSSI"] = WiFi.RSSI();
  doc["timestamp"] = millis();

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT (retained message)
  bool published = mqttClient.publish(topicOnline.c_str(), payload.c_str(), true);

  if (published) {
    Serial.print("Heartbeat published: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish heartbeat");
  }
}

// ===== Publish Status =====
void publishStatus() {
  if (!mqttClient.connected()) {
    return;
  }

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["ledState"] = ledState;
  doc["timestamp"] = millis();

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  bool published = mqttClient.publish(topicStatus.c_str(), payload.c_str(), false);

  if (published) {
    Serial.print("Status published: ");
    Serial.println(payload);
  } else {
    Serial.println("Failed to publish status");
  }
}

// ===== Publish Online Status =====
void publishOnlineStatus(bool online) {
  if (!mqttClient.connected()) {
    return;
  }

  // Create JSON payload
  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = online ? "online" : "offline";
  doc["timestamp"] = millis();

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT (retained message)
  mqttClient.publish(topicOnline.c_str(), payload.c_str(), true);

  Serial.print("Online status published: ");
  Serial.println(online ? "online" : "offline");
}
