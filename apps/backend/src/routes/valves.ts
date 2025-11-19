/**
 * Valve Control API Routes
 * Provides endpoints for valve control and monitoring
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { mqttValveService } from '../services/mqtt-valve.service';
import { influxTimeSeriesService } from '../services/influx-timeseries.service';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'ValveRoutes' });

interface ValveControlBody {
  valve_number: number;
  state: boolean;
}

interface TimeRangeQuery {
  start_time?: string;
  end_time?: string;
  device_id?: string;
}

export async function valveRoutes(fastify: FastifyInstance) {
  // Control valve
  fastify.post<{ Body: ValveControlBody }>(
    '/valves/control',
    {
      schema: {
        body: {
          type: 'object',
          required: ['valve_number', 'state'],
          properties: {
            valve_number: { type: 'integer', minimum: 1, maximum: 4 },
            state: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ValveControlBody }>, reply: FastifyReply) => {
      try {
        const { valve_number, state } = request.body;
        const username = (request as any).user?.username || 'system';

        // Validate valve number
        if (valve_number < 1 || valve_number > 4) {
          return reply.status(400).send({
            success: false,
            message: 'Valve number must be between 1 and 4',
          });
        }

        // Check MQTT connection
        if (!mqttValveService.isConnected()) {
          return reply.status(503).send({
            success: false,
            message: 'MQTT service not available',
          });
        }

        // Publish command
        await mqttValveService.publishValveCommand(valve_number, state, username);

        logger.info(`Valve ${valve_number} command: ${state ? 'ON' : 'OFF'} by ${username}`);

        return reply.send({
          success: true,
          message: `Valve ${valve_number} command sent: ${state ? 'ON' : 'OFF'}`,
          data: {
            valve_number,
            state,
            commanded_by: username,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        logger.error('Error controlling valve:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to control valve',
          error: error.message,
        });
      }
    }
  );

  // Get current sensor readings
  fastify.get(
    '/valves/current-readings',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!influxTimeSeriesService.isInitialized()) {
          return reply.status(503).send({
            success: false,
            message: 'Time-series database not available',
          });
        }

        const deviceId = mqttValveService.getDeviceId();
        const [pressure, flow] = await Promise.all([
          influxTimeSeriesService.getLatestPressure(deviceId),
          influxTimeSeriesService.getLatestFlow(deviceId),
        ]);

        return reply.send({
          success: true,
          data: {
            pressure: pressure
              ? {
                  value: pressure.value,
                  unit: 'kg/cm²',
                  timestamp: pressure.timestamp,
                }
              : null,
            flow: flow
              ? {
                  value: flow.value,
                  unit: 'LPS',
                  timestamp: flow.timestamp,
                }
              : null,
            device_id: deviceId,
          },
        });
      } catch (error: any) {
        logger.error('Error getting current readings:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to get current readings',
          error: error.message,
        });
      }
    }
  );

  // Get historical pressure data
  fastify.get<{ Querystring: TimeRangeQuery }>(
    '/valves/pressure-history',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            device_id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) => {
      try {
        const { start_time, end_time, device_id } = request.query;

        if (!start_time || !end_time) {
          return reply.status(400).send({
            success: false,
            message: 'start_time and end_time are required (ISO format)',
          });
        }

        if (!influxTimeSeriesService.isInitialized()) {
          return reply.status(503).send({
            success: false,
            message: 'Time-series database not available',
          });
        }

        const data = await influxTimeSeriesService.queryPressureData(
          start_time,
          end_time,
          device_id || mqttValveService.getDeviceId()
        );

        return reply.send({
          success: true,
          data,
          count: data.length,
        });
      } catch (error: any) {
        logger.error('Error getting pressure history:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to get pressure history',
          error: error.message,
        });
      }
    }
  );

  // Get historical flow data
  fastify.get<{ Querystring: TimeRangeQuery }>(
    '/valves/flow-history',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            start_time: { type: 'string' },
            end_time: { type: 'string' },
            device_id: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: TimeRangeQuery }>, reply: FastifyReply) => {
      try {
        const { start_time, end_time, device_id } = request.query;

        if (!start_time || !end_time) {
          return reply.status(400).send({
            success: false,
            message: 'start_time and end_time are required (ISO format)',
          });
        }

        if (!influxTimeSeriesService.isInitialized()) {
          return reply.status(503).send({
            success: false,
            message: 'Time-series database not available',
          });
        }

        const data = await influxTimeSeriesService.queryFlowData(
          start_time,
          end_time,
          device_id || mqttValveService.getDeviceId()
        );

        return reply.send({
          success: true,
          data,
          count: data.length,
        });
      } catch (error: any) {
        logger.error('Error getting flow history:', error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to get flow history',
          error: error.message,
        });
      }
    }
  );

  // Health check for valve control system
  fastify.get('/valves/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        mqtt_connected: mqttValveService.isConnected(),
        influx_initialized: influxTimeSeriesService.isInitialized(),
        device_id: mqttValveService.getDeviceId(),
        timestamp: new Date().toISOString(),
      },
    });
  });
}
