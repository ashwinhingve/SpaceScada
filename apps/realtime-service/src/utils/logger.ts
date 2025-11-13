import pino from 'pino';
import { config } from '../config';

const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  level: config.logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'realtime-service',
    env: config.nodeEnv,
  },
});

// Helper functions for structured logging
export const logInfo = (message: string, meta?: object) => {
  logger.info(meta, message);
};

export const logError = (message: string, error?: Error | unknown, meta?: object) => {
  if (error instanceof Error) {
    logger.error({ ...meta, error: { message: error.message, stack: error.stack } }, message);
  } else {
    logger.error({ ...meta, error }, message);
  }
};

export const logWarn = (message: string, meta?: object) => {
  logger.warn(meta, message);
};

export const logDebug = (message: string, meta?: object) => {
  logger.debug(meta, message);
};
