import { Event } from '../common/types';

interface ApiEvent {
  aid: string;  // clientId
  uid: string;  // userId
  eid: string;  // eventId
  dtm: number;  // datetime
  e: string;    // event type
  ev: Record<string, any>; // event data
}

export class ApiClient {
  private endpoint: string;
  private debugLog: boolean;
  private clientId: string;

  constructor(debugLog: boolean = false, clientId: string) {
    this.endpoint = 'https://dev-uii.portqii.com/api/v1/events';
    this.debugLog = debugLog;
    this.clientId = clientId;
  }

  async sendEvent(event: Event): Promise<boolean> {
    try {
      // Don't use sendBeacon for queued events during unload
      // We want to preserve the queue for retry, not send and forget
      if (this.isUnloadScenario()) {
        // For unload scenarios with queued events, we'll throw an error
        // so they get re-queued and retried on next page load
        throw new Error('Unload scenario - preserving events for retry');
      }
      
      const apiEvent: ApiEvent = {
        aid: event.clientId,
        uid: event.userId,
        eid: event.id,
        dtm: event.timestamp,
        e: event.type,
        ev: event.data
      };
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': this.clientId },
        body: JSON.stringify(apiEvent),
        keepalive: true
      });
      
      if (!response.ok) {
        if (response.status === 400) {
          console.error(`ApiClient: Event rejected (400): ${event.id}`, apiEvent);
          return false; // Don't retry 400 errors
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.warn(`ApiClient: Event send failed (will retry): ${event.id}`, error);
      throw error;
    }
  }

  // Check if we're in an unload scenario (page is being closed)
  private isUnloadScenario(): boolean {
    return document.visibilityState === 'hidden';
  }

  // Batch sending method for queue flushing
  async sendEvents(events: Event[]): Promise<boolean> {
    if (events.length === 0) return true;
    
    // For batch sending, we'll send them individually
    // This allows better error handling per event
    let allSuccessful = true;
    
    for (const event of events) {
      try {
        const success = await this.sendEvent(event);
        if (!success) {
          allSuccessful = false;
        }
      } catch (error) {
        allSuccessful = false;
        if (this.debugLog) {
          console.error(`Cruxstack: Batch send failed for event ${event.id}:`, error);
        }
      }
    }
    
    return allSuccessful;
  }
}