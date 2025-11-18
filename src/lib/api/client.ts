/**
 * API Client
 * Base HTTP client with error handling, retries, and type safety
 */

import { API_CONFIG } from './config';
import type { ApiError } from '@/types/polymarket';

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseURL: string = API_CONFIG.baseURL,
    timeout: number = API_CONFIG.timeout
  ) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = API_CONFIG.headers;
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, endpoint: string): never {
    console.error(`API Error [${endpoint}]:`, error);
    
    const apiError: ApiError = {
      error: error.name || 'ApiError',
      message: error.message || 'An unknown error occurred',
      status: error.status,
    };
    
    throw apiError;
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildURL(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          name: 'ApiError',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw {
          name: 'TimeoutError',
          message: `Request timeout after ${this.timeout}ms`,
          status: 408,
        };
      }
      
      this.handleError(error, endpoint);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, params);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      params
    );
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();





