/**
 * Authentication Interceptor
 * Adds authentication headers to requests
 */

import type { Interceptor, RequestConfig } from '../client';

/**
 * Create auth interceptor
 * Adds Authorization header to requests if token is available
 */
export function createAuthInterceptor(): Interceptor {
  return {
    onRequest: async (config: RequestConfig) => {
      // Skip auth for public endpoints
      if (config.skipAuth) {
        return config;
      }

      // Get token from localStorage (or your auth state)
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      return config;
    },
  };
}
