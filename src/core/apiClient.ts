import { ApiEvent, Event } from '../common/types';

export class ApiClient {
  private endpoint: string;
  private debugLog: boolean;
  private clientId: string;
  private customerId?: string;

  constructor(clientId: string, customerId?: string, debugLog: boolean = false) {
    this.endpoint = 'https://dev-uii.portqii.com/api/v1';
    this.debugLog = debugLog;
    this.clientId = clientId;
    this.customerId = customerId;
  }

  // GET request method
  async get<T = any>(
    path: string, 
    params: Record<string, any> = {}, 
    options: { 
      userId?: string; 
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      // Build URL with query parameters
      let url = `${this.endpoint}/${path}`;
      
      if (Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        url += `?${searchParams.toString()}`;
      }

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        ...options.customHeaders
      };

      // Add customerId to headers if available
      if (this.customerId) {
        headers['x-customer-id'] = this.customerId;
      }

      // Add userId to headers if provided
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const requestOptions: RequestInit = {
        method: 'GET',
        headers,
        credentials: 'include'
      };

      if (this.debugLog) {
        console.log('Cruxstack: GET Request', {
          url,
          headers
        });
      }

      const response = await fetch(url, requestOptions);
      return await this.handleResponse<T>(response);

    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: GET Request Failed', {
          path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // POST request method
  async post<T = any>(
    path: string, 
    data: any = {}, 
    options: { 
      userId?: string; 
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const url = `${this.endpoint}/${path}`;

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        ...options.customHeaders
      };

      // Add customerId to headers if available
      if (this.customerId) {
        headers['x-customer-id'] = this.customerId;
      }

      // Add userId to headers if provided
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const requestOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      };

      if (this.debugLog) {
        console.log('Cruxstack: POST Request', {
          url,
          data,
          headers
        });
      }

      const response = await fetch(url, requestOptions);
      return await this.handleResponse<T>(response);

    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: POST Request Failed', {
          path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw new Error(`POST request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // PUT request method
  async put<T = any>(
    path: string, 
    data: any = {}, 
    options: { 
      userId?: string; 
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const url = `${this.endpoint}/${path}`;

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        ...options.customHeaders
      };

      // Add customerId to headers if available
      if (this.customerId) {
        headers['x-customer-id'] = this.customerId;
      }

      // Add userId to headers if provided
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const requestOptions: RequestInit = {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include'
      };

      if (this.debugLog) {
        console.log('Cruxstack: PUT Request', {
          url,
          data,
          headers
        });
      }

      const response = await fetch(url, requestOptions);
      return await this.handleResponse<T>(response);

    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: PUT Request Failed', {
          path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw new Error(`PUT request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // DELETE request method
  async delete<T = any>(
    path: string, 
    options: { 
      userId?: string; 
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const url = `${this.endpoint}/${path}`;

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client-id': this.clientId,
        ...options.customHeaders
      };

      // Add customerId to headers if available
      if (this.customerId) {
        headers['x-customer-id'] = this.customerId;
      }

      // Add userId to headers if provided
      if (options.userId) {
        headers['x-user-id'] = options.userId;
      }

      const requestOptions: RequestInit = {
        method: 'DELETE',
        headers,
        credentials: 'include'
      };

      if (this.debugLog) {
        console.log('Cruxstack: DELETE Request', {
          url,
          headers
        });
      }

      const response = await fetch(url, requestOptions);
      return await this.handleResponse<T>(response);

    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: DELETE Request Failed', {
          path,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw new Error(`DELETE request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Handle API response with proper error handling
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        console.error('Cruxstack: Failed to parse error response');
      }

      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      return data as T;
    } catch (error) {
      throw new Error('Failed to parse API response');
    }
  }

  // Specific method for user traits
  async getUserTraits(userId: string): Promise<any> {
    return this.get(`/users/${userId}/traits`);
  }

  // Send events to backend
  async sendEvent(event: Event): Promise<boolean> {
    try {
      // Don't use sendBeacon for queued events during unload
      if (this.isUnloadScenario()) {
        throw new Error('Unload scenario detected');
      }

      const apiEvent: ApiEvent = {
        aid: event.clientId,
        cid: event.customerId,
        uid: event.userId,
        eid: event.id,
        dtm: event.timestamp,
        e: event.type,
        ev: event.data,
        tv: "v1"
      };

      if (this.debugLog) {
        console.log('Cruxstack: Sending event', apiEvent);
      }

      // Use the post method
      await this.post('events', apiEvent);

      if (this.debugLog) {
        console.log('Cruxstack: Event sent successfully');
      }

      return true;
    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: Failed to send event', error);
      }
      throw error;
    }
  }

  private isUnloadScenario(): boolean {
    return document.visibilityState === 'hidden' || 
           navigator.onLine === false ||
           'sendBeacon' in navigator === false;
  }
}