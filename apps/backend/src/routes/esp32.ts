import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  ESP32Device,
  ESP32ControlCommand,
  ESP32SensorConfig,
  DeviceType,
  DeviceStatus,
  ProtocolType,
  ESP32SensorType,
} from '@webscada/shared-types';
import { ESP32Service } from '../services/esp32.service';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'ESP32Routes' });

interface RegisterDeviceBody {
  name: string;
  deviceId?: string;
  sensorType: ESP32SensorType;
  mqttClientId?: string;
  mqttTopic?: string;
  mqttBroker?: string;
  mqttPort?: number;
  mqttUsername?: string;
  mqttPassword?: string;
  wifiSSID?: string;
  publishInterval?: number;
  heartbeatInterval?: number;
  sensors?: ESP32SensorConfig[];
  gpioConfig?: {
    dataPin?: number;
    ledPin?: number;
    relayPins?: number[];
    inputPins?: number[];
    outputPins?: number[];
  };
}

interface SendCommandBody {
  command: ESP32ControlCommand;
}

interface GetHistoryQuery {
  startTime?: string;
  endTime?: string;
  limit?: string;
}

export const esp32Routes = async (server: FastifyInstance) => {
  const esp32Service = (server as any).esp32Service as ESP32Service;

  if (!esp32Service) {
    logger.error('ESP32 service not initialized');
    throw new Error('ESP32 service not initialized');
  }

  /**
   * List all ESP32 devices
   * GET /api/esp32/devices
   */
  server.get('/devices', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const devices = await esp32Service.listDevices();

      return reply.send({
        success: true,
        data: devices,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Failed to list ESP32 devices:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'LIST_DEVICES_ERROR',
          message: error.message || 'Failed to list devices',
        },
        timestamp: new Date(),
      });
    }
  });

  /**
   * Get a specific ESP32 device
   * GET /api/esp32/devices/:deviceId
   */
  server.get(
    '/devices/:deviceId',
    async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
      try {
        const { deviceId } = request.params;
        const device = await esp32Service.getDevice(deviceId);

        if (!device) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'DEVICE_NOT_FOUND',
              message: `Device ${deviceId} not found`,
            },
            timestamp: new Date(),
          });
        }

        return reply.send({
          success: true,
          data: device,
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to get ESP32 device:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_DEVICE_ERROR',
            message: error.message || 'Failed to get device',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Register a new ESP32 device
   * POST /api/esp32/devices
   */
  server.post(
    '/devices',
    async (request: FastifyRequest<{ Body: RegisterDeviceBody }>, reply: FastifyReply) => {
      try {
        const body = request.body;

        // Generate device ID
        const deviceId = `esp32-${Math.random().toString(36).substring(2, 11)}`;

        // Create device object
        const device: ESP32Device = {
          id: deviceId,
          device_id: deviceId,
          name: body.name,
          type: DeviceType.SENSOR,
          status: DeviceStatus.OFFLINE,
          protocol: ProtocolType.MQTT,
          config: {
            mqttClientId: body.mqttClientId || `esp32_${Date.now()}`,
            mqttTopic: body.mqttTopic || `esp32/${body.deviceId || 'default'}`,
            publishInterval: body.publishInterval || 5000,
            sensors: body.sensors || [],
          },
          connectionConfig: {
            host: body.mqttBroker || 'localhost',
            port: body.mqttPort || 1883,
          },
          tags: [],
          esp32Config: {
            mqttClientId: body.mqttClientId || `esp32_${Date.now()}`,
            mqttTopic: body.mqttTopic || `esp32/${body.deviceId || 'default'}`,
            mqttBroker: body.mqttBroker || 'localhost',
            mqttPort: body.mqttPort || 1883,
            mqttUsername: body.mqttUsername,
            mqttPassword: body.mqttPassword,
            wifiSSID: body.wifiSSID,
            publishInterval: body.publishInterval || 5000,
            heartbeatInterval: body.heartbeatInterval || 15000,
            sensorType: body.sensorType,
            sensors: body.sensors || [],
            gpioConfig: body.gpioConfig,
          },
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Register device
        const registeredDevice = await esp32Service.registerDevice(device);

        return reply.status(201).send({
          success: true,
          data: registeredDevice,
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to register ESP32 device:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'REGISTER_DEVICE_ERROR',
            message: error.message || 'Failed to register device',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Update an ESP32 device
   * PUT /api/esp32/devices/:deviceId
   */
  server.put(
    '/devices/:deviceId',
    async (
      request: FastifyRequest<{ Params: { deviceId: string }; Body: Partial<RegisterDeviceBody> }>,
      reply: FastifyReply
    ) => {
      try {
        const { deviceId } = request.params;
        const body = request.body;

        const existingDevice = await esp32Service.getDevice(deviceId);
        if (!existingDevice) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'DEVICE_NOT_FOUND',
              message: `Device ${deviceId} not found`,
            },
            timestamp: new Date(),
          });
        }

        // Update device configuration
        const existingConfig: any = existingDevice.esp32Config || existingDevice.config;
        const updatedDevice: ESP32Device = {
          ...existingDevice,
          name: body.name || existingDevice.name,
          esp32Config: {
            mqttClientId: body.mqttClientId || existingConfig?.mqttClientId || `esp32_${Date.now()}`,
            mqttTopic: body.mqttTopic || existingConfig?.mqttTopic || `esp32/${existingDevice.device_id}`,
            mqttBroker: body.mqttBroker || existingConfig?.mqttBroker || 'localhost',
            mqttPort: body.mqttPort || existingConfig?.mqttPort || 1883,
            mqttUsername: body.mqttUsername || existingConfig?.mqttUsername,
            mqttPassword: body.mqttPassword || existingConfig?.mqttPassword,
            wifiSSID: body.wifiSSID || existingConfig?.wifiSSID,
            publishInterval: body.publishInterval || existingConfig?.publishInterval || 5000,
            heartbeatInterval:
              body.heartbeatInterval || existingConfig?.heartbeatInterval || 15000,
            sensorType: body.sensorType || existingConfig?.sensorType,
            sensors: body.sensors || existingConfig?.sensors || [],
            gpioConfig: body.gpioConfig || existingConfig?.gpioConfig,
          },
          updated_at: new Date(),
        };

        // Re-register device with updated config
        await esp32Service.registerDevice(updatedDevice);

        return reply.send({
          success: true,
          data: updatedDevice,
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to update ESP32 device:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'UPDATE_DEVICE_ERROR',
            message: error.message || 'Failed to update device',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Delete an ESP32 device
   * DELETE /api/esp32/devices/:deviceId
   */
  server.delete(
    '/devices/:deviceId',
    async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
      try {
        const { deviceId } = request.params;

        await esp32Service.unregisterDevice(deviceId);

        return reply.send({
          success: true,
          data: { deviceId },
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to delete ESP32 device:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'DELETE_DEVICE_ERROR',
            message: error.message || 'Failed to delete device',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Get latest sensor data for a device
   * GET /api/esp32/devices/:deviceId/sensor-data
   */
  server.get(
    '/devices/:deviceId/sensor-data',
    async (request: FastifyRequest<{ Params: { deviceId: string } }>, reply: FastifyReply) => {
      try {
        const { deviceId } = request.params;
        const sensorData = await esp32Service.getDeviceSensorData(deviceId);

        if (!sensorData) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'NO_SENSOR_DATA',
              message: `No sensor data found for device ${deviceId}`,
            },
            timestamp: new Date(),
          });
        }

        return reply.send({
          success: true,
          data: sensorData,
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to get sensor data:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SENSOR_DATA_ERROR',
            message: error.message || 'Failed to get sensor data',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Get sensor data history for a device
   * GET /api/esp32/devices/:deviceId/sensor-data/history
   */
  server.get(
    '/devices/:deviceId/sensor-data/history',
    async (
      request: FastifyRequest<{ Params: { deviceId: string }; Querystring: GetHistoryQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const { deviceId } = request.params;
        const { startTime, endTime, limit } = request.query;

        const start = startTime ? new Date(startTime) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const end = endTime ? new Date(endTime) : new Date();
        const maxLimit = limit ? parseInt(limit, 10) : 1000;

        const history = await esp32Service.getDeviceSensorHistory(deviceId, start, end, maxLimit);

        return reply.send({
          success: true,
          data: {
            deviceId,
            history,
            count: history.length,
            startTime: start,
            endTime: end,
          },
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to get sensor history:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'GET_SENSOR_HISTORY_ERROR',
            message: error.message || 'Failed to get sensor history',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  /**
   * Send control command to a device
   * POST /api/esp32/devices/:deviceId/control
   */
  server.post(
    '/devices/:deviceId/control',
    async (
      request: FastifyRequest<{ Params: { deviceId: string }; Body: SendCommandBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { deviceId } = request.params;
        const { command } = request.body;

        await esp32Service.sendControlCommand(deviceId, command);

        return reply.send({
          success: true,
          data: {
            deviceId,
            command,
            status: 'sent',
          },
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Failed to send control command:', error);
        return reply.status(500).send({
          success: false,
          error: {
            code: 'SEND_COMMAND_ERROR',
            message: error.message || 'Failed to send control command',
          },
          timestamp: new Date(),
        });
      }
    }
  );

  logger.info('ESP32 routes registered');
};
