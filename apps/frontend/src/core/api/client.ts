/**
 * Core API Client
 * Centralized HTTP client with error handling, interceptors, and type safety
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// ============================================================================
// Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export interface Interceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: <T>(response: Response, data: T) => T | Promise<T>;
  onError?: (error: ApiError) => void | Promise<void>;
}

// ============================================================================
// API Error Class
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintain proper stack trace (only in V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return !this.statusCode;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }

  /**
   * Check if error is a specific status code
   */
  isStatus(code: number): boolean {
    return this.statusCode === code;
  }
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string;
  private interceptors: Interceptor[] = [];
  private defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Add an interceptor
   */
  addInterceptor(interceptor: Interceptor): () => void {
    this.interceptors.push(interceptor);

    // Return a function to remove the interceptor
    return () => {
      const index = this.interceptors.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.splice(index, 1);
      }
    };
  }

  /**
   * Set default headers
   */
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      [key]: value,
    };
  }

  /**
   * Remove a default header
   */
  removeDefaultHeader(key: string): void {
    const currentHeaders = this.defaultHeaders;
    const headers: Record<string, string> = 
      currentHeaders instanceof Headers
        ? Object.fromEntries(currentHeaders.entries())
        : Array.isArray(currentHeaders)
          ? Object.fromEntries(currentHeaders)
          : { ...currentHeaders };
    delete headers[key];
    this.defaultHeaders = headers;
  }

  /**
   * Core request method
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // Build URL with query params
    const url = this.buildUrl(endpoint, config.params);

    // Prepare request config
    let requestConfig: RequestConfig = {
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
      },
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        requestConfig = await interceptor.onRequest(requestConfig);
      }
    }

    try {
      // Make the request
      const response = await fetch(url, requestConfig);

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const error = new ApiError(
          data?.error || data?.message || `Request failed with status ${response.status}`,
          response.status,
          data,
          endpoint
        );

        // Apply error interceptors
        for (const interceptor of this.interceptors) {
          if (interceptor.onError) {
            await interceptor.onError(error);
          }
        }

        throw error;
      }

      // Apply response interceptors
      let result = data;
      for (const interceptor of this.interceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(response, result);
        }
      }

      return result;
    } catch (error) {
      // Handle network errors
      if (error instanceof ApiError) {
        throw error;
      }

      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        undefined,
        error,
        endpoint
      );

      // Apply error interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          await interceptor.onError(apiError);
        }
      }

      throw apiError;
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseURL}${endpoint}`;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    // Filter out undefined/null values
    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);

    const queryString = new URLSearchParams(filteredParams).toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;
