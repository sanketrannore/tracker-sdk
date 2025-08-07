import { Event } from '../common/types';

// New event format for API
interface ApiEvent {
  aid: string;  // clientId
  cid?: string; // customerId (optional)
  uid?: string;  // userId
  eid: string;  // eventId
  dtm: number;  // datetime
  e: string;    // event type
  ev: Record<string, any>; // event data
  tv: string; // version
}

// User traits interface
interface UserTraits {
  userId: string;
  traits: Record<string, any>;
  lastUpdated?: string;
}

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

  // Generic API method for future endpoints
  async callApi<T = any>(
    method: string, 
    params: Record<string, any> = {}, 
    options: { 
      userId?: string; 
      customHeaders?: Record<string, string>;
    } = {}
  ): Promise<T> {
    try {
      const url = `${this.endpoint}/${method}`;
      
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

      // Add query parameters for GET requests
      if (Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const urlWithParams = `${url}?${searchParams.toString()}`;
        
        if (this.debugLog) {
          console.log('Cruxstack: API Request', {
            url: urlWithParams,
            method: 'GET',
            headers
          });
        }

        const response = await fetch(urlWithParams, requestOptions);
        return await this.handleApiResponse<T>(response);
      }

      const response = await fetch(url, requestOptions);
      return await this.handleApiResponse<T>(response);

    } catch (error) {
      if (this.debugLog) {
        console.error('Cruxstack: API Request Failed', {
          method,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      throw new Error(`API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Handle API response with proper error handling
  private async handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we can't parse error response, use default message
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
  async getUserTraits(userId?: string): Promise<UserTraits> {
    return this.callApi<UserTraits>(`/users/${userId}/traits`);
  }

  async sendEvent(event: Event): Promise<boolean> {
    try {
      // Don't use sendBeacon for queued events during unload
      // We want to preserve the queue for retry, not send and forget
      if (this.isUnloadScenario()) {
        // For unload scenarios with queued events, we'll throw an error
        // so they get queued instead of sent immediately
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

      const response = await fetch(this.endpoint + '/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId
        },
        body: JSON.stringify(apiEvent),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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