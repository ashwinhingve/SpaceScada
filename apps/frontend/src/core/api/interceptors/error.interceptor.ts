/**
 * Error Interceptor
 * Handles API errors globally
 */

import { ApiError, type Interceptor } from '../client';

/**
 * Create error logging interceptor
 */
export function createErrorInterceptor(): Interceptor {
  return {
    onError: async (error: ApiError) => {
      // Log error to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[API Error]', {
          message: error.message,
          statusCode: error.statusCode,
          endpoint: error.endpoint,
          response: error.response,
        });
      }

      // Handle specific error codes
      if (error.isStatus(401)) {
        // Unauthorized - could redirect to login
        console.warn('Unauthorized request - user may need to log in');
      } else if (error.isStatus(403)) {
        // Forbidden - user doesn't have permission
        console.warn('Forbidden - user lacks permission');
      } else if (error.isStatus(404)) {
        // Not found
        console.warn('Resource not found');
      } else if (error.isServerError()) {
        // Server error (5xx)
        console.error('Server error occurred');
      } else if (error.isNetworkError()) {
        // Network error
        console.error('Network error - check connection');
      }

      // Could send to error tracking service here
      // e.g., Sentry, LogRocket, etc.
    },
  };
}
