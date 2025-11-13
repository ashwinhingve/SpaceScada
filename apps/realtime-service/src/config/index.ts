import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

// Configuration schema
const configSchema = Joi.object({
  port: Joi.number().port().default(3002),
  host: Joi.string().default('0.0.0.0'),
  nodeEnv: Joi.string().valid('development', 'production', 'test').default('development'),
  corsOrigin: Joi.string().default('http://localhost:3000'),
  logLevel: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
    .default('info'),
  updateInterval: Joi.number().min(100).max(10000).default(1000),
  dataHistorySize: Joi.number().min(10).max(1000).default(100),
  heartbeatInterval: Joi.number().min(10000).default(30000),
  heartbeatTimeout: Joi.number().min(20000).default(60000),
  enableMetrics: Joi.boolean().default(true),
  redisUrl: Joi.string().optional(),
}).unknown(true);

// Parse and validate configuration
const { error, value: envVars } = configSchema.validate({
  port: process.env.PORT,
  host: process.env.HOST,
  nodeEnv: process.env.NODE_ENV,
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL,
  updateInterval: process.env.UPDATE_INTERVAL,
  dataHistorySize: process.env.DATA_HISTORY_SIZE,
  heartbeatInterval: process.env.HEARTBEAT_INTERVAL,
  heartbeatTimeout: process.env.HEARTBEAT_TIMEOUT,
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  redisUrl: process.env.REDIS_URL,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  updateInterval: number;
  dataHistorySize: number;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  enableMetrics: boolean;
  redisUrl?: string;
}

export const config: Config = {
  port: envVars.port,
  host: envVars.host,
  nodeEnv: envVars.nodeEnv,
  corsOrigin: envVars.corsOrigin,
  logLevel: envVars.logLevel,
  updateInterval: envVars.updateInterval,
  dataHistorySize: envVars.dataHistorySize,
  heartbeatInterval: envVars.heartbeatInterval,
  heartbeatTimeout: envVars.heartbeatTimeout,
  enableMetrics: envVars.enableMetrics,
  redisUrl: envVars.redisUrl,
};
