import { ApiEvent, Event } from '../common/types';

export class ApiClient {
  private endpoint: string;
  private debugLog: boolean;
  private clientId: string;
  private customerId?: string;
  private customerName?: string;
  private ipAddress: string | null = null;
  private ipFetchInFlight: Promise<void> | null = null;

  constructor(clientId: string, customerId?: string, customerName?: string, debugLog: boolean = false) {
    this.endpoint = 'https://dev-uii.portqii.com/api/v1';
    this.debugLog = debugLog;
    this.clientId = clientId;
    this.customerId = customerId;
    this.customerName = customerName;

    // Eagerly resolve IP address client-side (best-effort)
    this.fetchIpAddress();
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
    // Success path
    if (response.ok) {
      // 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Try to detect JSON by header
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      if (contentType.includes('application/json') || contentType.includes('json')) {
        try {
          const data = await response.json();
          return data as T;
        } catch {
          // Fall back to text if body is not valid JSON
          const text = await response.text();
          return (text as unknown) as T;
        }
      }

      // Non-JSON success bodies (e.g., plain "ok")
      const text = await response.text();
      return (text as unknown) as T;
    }

    // Error path
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const maybeJson = await response.json();
      if (maybeJson && (maybeJson.message || maybeJson.error)) {
        errorMessage = maybeJson.message || maybeJson.error;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
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

      if (!event.env) {
        throw new Error('Event missing env snapshot');
      }
      const env = event.env;

      const apiEvent: ApiEvent = {
        cid: event.customerId,
        cna: this.customerName,
        uid: event.userId, // may be undefined per requirement
        eid: event.id,
        dtm: event.timestamp,
        e: event.type,
        ev: event.data,
        tv: 'v1',
        sid: event.sessionId,
        tna: 'web',
        ...env
      };

      if (this.debugLog) {
        console.log('Cruxstack: Sending event', {events : [apiEvent]});
      }

      // Use the post method
      await this.post('events', {events : [apiEvent]});

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

  // Build flattened environment+page fields according to API schema
  private buildEnvironmentFields(event: Event): Omit<
    ApiEvent,
    'cid' | 'cna' | 'uid' | 'eid' | 'dtm' | 'e' | 'ev' | 'tv' | 'sid' | 'tna'
  > {
    const ua = navigator.userAgent;
    const screenHeight = typeof screen !== 'undefined' ? screen.height : 0;
    const screenWidth = typeof screen !== 'undefined' ? screen.width : 0;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const platform = navigator.platform;
    const anonymous = !event.userId;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const pageTitle = typeof document !== 'undefined' ? document.title : '';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageDomain = typeof window !== 'undefined' ? window.location.hostname : '';
    const pageReferrer = typeof document !== 'undefined' && document.referrer ? document.referrer : null;

    // Page load time (may be null if not available yet)
    let pageLoadtime: number | null = null;
    try {
      const timing = (performance && (performance as any).timing) || null;
      if (timing && timing.loadEventEnd > 0 && timing.navigationStart > 0) {
        pageLoadtime = timing.loadEventEnd - timing.navigationStart;
      }
    } catch {}

    // Ensure IP fetch kicked off (non-blocking)
    if (!this.ipAddress && !this.ipFetchInFlight) {
      this.fetchIpAddress();
    }

    return {
      ua: ua,
      sh: screenHeight,
      sw: screenWidth,
      l: language,
      tz: timezone,
      p: platform,
      an: anonymous,
      vh: viewportHeight,
      vw: viewportWidth,
      pt: pageTitle,
      pu: pageUrl,
      pp: pagePath,
      pd: pageDomain,
      pl: pageLoadtime,
      pr: pageReferrer,
      ip: this.ipAddress ?? null
    };
  }

  // Best-effort client-side IP fetch; cached for subsequent events
  private fetchIpAddress(): void {
    if (this.ipFetchInFlight) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    this.ipFetchInFlight = fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      credentials: 'omit'
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.ip === 'string') {
          this.ipAddress = data.ip;
        }
      })
      .catch(() => {})
      .finally(() => {
        this.ipFetchInFlight = null;
      });
  }

  // Expose cached IP for snapshotting at event time
  getCachedIp(): string | null {
    return this.ipAddress;
  }
}