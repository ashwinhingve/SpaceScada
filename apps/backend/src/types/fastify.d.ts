import { Pool } from 'pg';
import { Server as SocketIOServer } from 'socket.io';

import { BluetoothService } from '../services/bluetooth.service';
import { ESP32Service } from '../services/esp32.service';
import { GSMService } from '../services/gsm.service';
import { LogsService } from '../services/logs.service';
import { TelemetryService } from '../services/telemetry.service';
import { WiFiService } from '../services/wifi.service';

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
    io: SocketIOServer;
    gsmService: GSMService;
    esp32Service: ESP32Service;
    wifiService: WiFiService;
    bluetoothService: BluetoothService;
    telemetryService: TelemetryService;
    logsService: LogsService;
  }
}
