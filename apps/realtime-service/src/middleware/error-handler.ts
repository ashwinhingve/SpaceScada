import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logError } from '../utils/logger';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  logError('Request error', error, {
    url: request.url,
    method: request.method,
    statusCode: error.statusCode,
  });

  const statusCode = error.statusCode || 500;
  const response: ApiResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      details: error.validation || undefined,
    },
    timestamp: new Date(),
  };

  reply.status(statusCode).send(response);
};

export const createErrorResponse = (
  code: string,
  message: string,
  details?: unknown
): ApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date(),
  };
};

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data,
    timestamp: new Date(),
  };
};
