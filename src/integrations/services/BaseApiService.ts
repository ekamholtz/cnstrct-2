/**
 * BaseApiService
 * 
 * A foundation class for API integration services that handles common operations
 * like request making, error handling, and authentication management
 * using the unified CORS proxy.
 */

import axios, { AxiosRequestConfig } from 'axios';

// Base configuration type
export interface ApiServiceConfig {
  proxyUrl: string;
  serviceName: string;
  defaultHeaders?: Record<string, string>;
}

// Response type structure
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: Error;
}

export class BaseApiService {
  protected config: ApiServiceConfig;
  
  constructor(config: ApiServiceConfig) {
    this.config = {
      ...config,
      proxyUrl: config.proxyUrl.endsWith('/') 
        ? config.proxyUrl.slice(0, -1) 
        : config.proxyUrl
    };
  }
  
  /**
   * Make an API request through the CORS proxy
   * 
   * @param endpoint The API endpoint
   * @param method HTTP method (get, post, put, delete)
   * @param data Request data
   * @param headers Additional headers
   * @returns Promise with the API response
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      // Prepare the request configuration
      const requestConfig: AxiosRequestConfig = {
        headers: {
          ...this.config.defaultHeaders,
          ...headers
        },
        timeout: 15000 // 15 second timeout
      };
      
      // Create the proxy URL based on the service name
      let proxyUrl: string;
      
      if (this.config.serviceName === 'stripe') {
        proxyUrl = `${this.config.proxyUrl}/proxy/stripe`;
      } else if (this.config.serviceName === 'qbo') {
        proxyUrl = `${this.config.proxyUrl}/proxy/qbo/data-operation`;
      } else {
        throw new Error(`Unknown service name: ${this.config.serviceName}`);
      }
      
      // Make the request through the proxy
      const response = await axios.post(proxyUrl, {
        endpoint,
        method,
        data,
        headers: requestConfig.headers
      }, requestConfig);
      
      return {
        data: response.data,
        success: true
      };
    } catch (error: any) {
      console.error(`${this.config.serviceName} API error:`, error);
      
      // Handle and transform error for consistent error reporting
      return {
        data: null as unknown as T,
        success: false,
        error: new Error(
          error.response?.data?.error?.message || 
          error.response?.data?.error || 
          error.message || 
          `Error calling ${this.config.serviceName} API`
        )
      };
    }
  }
  
  /**
   * Validate that required parameters are present
   * 
   * @param params Object containing parameters to validate
   * @param requiredParams Array of required parameter names
   * @throws Error if any required parameters are missing
   */
  protected validateRequiredParams(
    params: Record<string, any>,
    requiredParams: string[]
  ): void {
    const missingParams = requiredParams.filter(param => !params[param]);
    
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
  }
}
