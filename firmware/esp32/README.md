# WebSCADA ESP32 Device Firmware

This firmware enables ESP32 microcontrollers to connect to the WebSCADA platform as IoT sensor devices. It supports temperature/humidity monitoring with DHT22 sensors and remote LED control via MQTT protocol.

## Hardware Requirements

### Required Components

- **ESP32 Development Board** (ESP32-WROOM-32, ESP32-DevKitC, or similar)
- **DHT22 Temperature/Humidity Sensor** (or DHT11)
- **USB Cable** (for programming and power)
- **Breadboard and Jumper Wires** (for prototyping)

### Optional Components

- External LED (if not using built-in LED)
- Resistors (220Ω for LED, 10kΩ pull-up for DHT22)
- Power supply (for standalone operation)

## Hardware Connections

### DHT22 Sensor Wiring

| DHT22 Pin | ESP32 Pin | Description  |
| --------- | --------- | ------------ |
| VCC       | 3.3V      | Power supply |
| DATA      | GPIO 4    | Data signal  |
| GND       | GND       | Ground       |

**Note:** A 10kΩ pull-up resistor between VCC and DATA is recommended (some DHT22 modules have it built-in).

### LED Wiring

| Component | ESP32 Pin | Description                       |
| --------- | --------- | --------------------------------- |
| LED (+)   | GPIO 2    | Built-in LED on most ESP32 boards |
| LED (-)   | GND       | Through 220Ω resistor             |

**Note:** Most ESP32 boards have a built-in LED on GPIO 2. If using an external LED, connect it through a 220Ω current-limiting resistor.

## Software Requirements

### Arduino IDE Setup

1. **Install Arduino IDE**
   - Download from [arduino.cc](https://www.arduino.cc/en/software)
   - Install version 2.0 or later

2. **Add ESP32 Board Support**
   - Open Arduino IDE
   - Go to `File` → `Preferences`
   - In "Additional Boards Manager URLs", add:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to `Tools` → `Board` → `Boards Manager`
   - Search for "ESP32" and install "ESP32 by Espressif Systems"

3. **Select Your ESP32 Board**
   - Go to `Tools` → `Board` → `ESP32 Arduino`
   - Select your specific board (e.g., "ESP32 Dev Module")

### Required Libraries

Install the following libraries via `Tools` → `Manage Libraries` in Arduino IDE:

1. **PubSubClient** by Nick O'Leary
   - MQTT client library
   - Version 2.8 or later

2. **ArduinoJson** by Benoit Blanchon
   - JSON parsing library
   - Version 6.x (not 7.x)

3. **DHT sensor library** by Adafruit
   - DHT sensor interface
   - Version 1.4.0 or later

4. **Adafruit Unified Sensor** (dependency)
   - Required by DHT library
   - Install automatically when installing DHT library

## Configuration

### 1. Update WiFi Credentials

Edit `webscada-esp32.ino` and update these lines:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

**Important:** ESP32 only supports 2.4GHz WiFi networks. 5GHz networks will not work.

### 2. Configure MQTT Broker

Update the MQTT broker settings to point to your WebSCADA server:

```cpp
const char* MQTT_BROKER = "192.168.1.100";  // Your WebSCADA server IP
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "";  // Leave empty if no authentication
const char* MQTT_PASSWORD = "";
```

**How to find your server IP:**

- On Linux/Mac: Run `hostname -I` or `ip addr show`
- On Windows: Run `ipconfig` and look for IPv4 Address
- **Never use "localhost" or "127.0.0.1"** - the ESP32 needs the actual network IP

### 3. Set Device ID

Choose a unique identifier for your device:

```cpp
const char* DEVICE_ID = "esp32-01";  // Make this unique for each device
```

### 4. Adjust GPIO Pins (if needed)

If you've connected sensors to different pins, update:

```cpp
#define DHT_PIN 4       // DHT22 sensor data pin
#define LED_PIN 2       // LED control pin
#define DHT_TYPE DHT22  // Change to DHT11 if using DHT11 sensor
```

### 5. Adjust Timing Intervals (optional)

Customize how often data is sent:

```cpp
const unsigned long DATA_PUBLISH_INTERVAL = 5000;      // 5 seconds
const unsigned long HEARTBEAT_INTERVAL = 15000;        // 15 seconds
```

## Installation & Upload

1. **Open the Firmware**
   - Open `webscada-esp32.ino` in Arduino IDE

2. **Configure Board Settings**
   - `Tools` → `Board` → Select your ESP32 board
   - `Tools` → `Upload Speed` → 115200
   - `Tools` → `Flash Frequency` → 80MHz
   - `Tools` → `Partition Scheme` → "Default 4MB with spiffs"

3. **Connect ESP32**
   - Connect your ESP32 to computer via USB
   - `Tools` → `Port` → Select the COM port (Windows) or `/dev/ttyUSB*` (Linux/Mac)

4. **Compile & Upload**
   - Click the Upload button (→) or press `Ctrl+U`
   - Wait for compilation and upload to complete
   - You should see "Done uploading" when finished

5. **Monitor Serial Output**
   - Open Serial Monitor: `Tools` → `Serial Monitor`
   - Set baud rate to **115200**
   - You should see connection logs and sensor data

## Usage

### Startup Sequence

When the device boots, it will:

1. Initialize the DHT sensor
2. Connect to your WiFi network
3. Connect to the MQTT broker
4. Subscribe to control commands
5. Start publishing sensor data every 5 seconds
6. Send heartbeat messages every 15 seconds

### Serial Monitor Output

Normal operation shows:

```
=================================
WebSCADA ESP32 Device
=================================
DHT sensor initialized
Connecting to WiFi: YourNetwork
..
WiFi connected!
IP address: 192.168.1.50
Signal strength (RSSI): -45 dBm
Connecting to MQTT broker: 192.168.1.100:1883
MQTT connected!
Subscribed to: devices/esp32-01/control
Online status published: online
Sensor data published: {"deviceId":"esp32-01","temperature":23.50,"humidity":45.20,"ledState":false,"timestamp":5234}
```

### MQTT Topics

The device communicates using these topics:

| Topic                        | Direction | Purpose                                     | Retained |
| ---------------------------- | --------- | ------------------------------------------- | -------- |
| `devices/{deviceId}/data`    | Publish   | Sensor readings (temp, humidity, LED state) | No       |
| `devices/{deviceId}/online`  | Publish   | Heartbeat with device status                | Yes      |
| `devices/{deviceId}/status`  | Publish   | Control state updates                       | No       |
| `devices/{deviceId}/control` | Subscribe | Control commands from WebSCADA              | No       |

### Control Commands

Send JSON commands to `devices/{deviceId}/control`:

**Turn LED On:**

```json
{
  "action": "setLED",
  "ledState": true
}
```

**Turn LED Off:**

```json
{
  "action": "setLED",
  "ledState": false
}
```

**Toggle LED:**

```json
{
  "action": "toggleLED"
}
```

**Request Status:**

```json
{
  "action": "requestStatus"
}
```

**Reboot Device:**

```json
{
  "action": "reboot"
}
```

## Troubleshooting

### WiFi Connection Issues

**Problem:** Device doesn't connect to WiFi

**Solutions:**

- Verify SSID and password are correct
- Ensure using 2.4GHz network (not 5GHz)
- Check WiFi signal strength at device location
- Try moving closer to router
- Check if network has MAC filtering enabled

### MQTT Connection Issues

**Problem:** "MQTT connection failed, state: -2"

**Solutions:**

- Verify MQTT broker IP address is correct
- Check that MQTT broker is running on the server
- Ensure firewall allows port 1883
- Test with MQTT client tool (like MQTT Explorer)
- Check username/password if authentication is enabled

**Common MQTT Error Codes:**

- `-4`: Connection timeout (check IP/port)
- `-2`: Connection refused (broker not running)
- `-1`: Protocol version mismatch
- `5`: Authentication failed (check credentials)

### Sensor Reading Issues

**Problem:** "Failed to read from DHT sensor!"

**Solutions:**

- Check wiring connections (VCC, GND, DATA)
- Verify DHT_PIN matches your wiring
- Ensure DHT_TYPE matches your sensor (DHT11 vs DHT22)
- Add 10kΩ pull-up resistor if not present
- Try a different GPIO pin
- Replace sensor if faulty

### Upload Issues

**Problem:** Can't upload to ESP32

**Solutions:**

- Hold BOOT button while uploading
- Try different USB cable (data cable, not charge-only)
- Install/update USB drivers (CP2102 or CH340)
- Close Serial Monitor before uploading
- Try lower upload speed (e.g., 115200)

## Integration with WebSCADA

### Register Device in WebSCADA

1. Ensure your ESP32 is running and connected
2. In WebSCADA frontend, navigate to `/esp32`
3. Click "Add Device"
4. Fill in the form:
   - **Device ID**: Must match the `DEVICE_ID` in firmware
   - **Name**: Friendly name for the device
   - **Sensor Type**: DHT22
   - **MQTT Broker**: Should match your configuration
5. Click "Register"

The device should appear online within 15 seconds (heartbeat interval).

### View Sensor Data

- Real-time data appears in the ESP32 dashboard
- Temperature and humidity charts update automatically
- View historical data by selecting date range
- Export data as CSV for analysis

### Control Device

- Toggle LED using the control panel
- Send custom commands via the control interface
- View command history and status

## Advanced Configuration

### Multiple Devices

To run multiple ESP32 devices:

1. Give each device a unique `DEVICE_ID` (e.g., "esp32-01", "esp32-02")
2. Register each device separately in WebSCADA
3. All devices can connect to the same MQTT broker

### Custom Sensors

To add additional sensors:

1. Add sensor library to Arduino IDE
2. Initialize sensor in `setup()`
3. Read sensor values in `publishSensorData()`
4. Add values to JSON document
5. Update WebSCADA types to handle new fields

### Power Management

For battery-powered operation:

1. Use deep sleep mode between readings
2. Reduce publish intervals
3. Disable LED to save power
4. Use ESP32's ULP coprocessor for efficient sensing

## Specifications

- **WiFi:** 802.11 b/g/n (2.4GHz only)
- **MQTT Protocol:** Version 3.1.1
- **JSON Format:** Compatible with ArduinoJson v6
- **Sensor Reading Interval:** 5 seconds (configurable)
- **Heartbeat Interval:** 15 seconds (configurable)
- **Power Consumption:** ~160mA (WiFi active)

## Support

For issues and questions:

1. Check WebSCADA documentation
2. Review Serial Monitor output for error messages
3. Test MQTT connection with external tools
4. Verify hardware connections

## License

This firmware is part of the WebSCADA project and follows the same license.

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
**Compatible with:** WebSCADA v1.0+
