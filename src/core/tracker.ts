import { Event } from '../common/types';
import { ApiClient } from './api';
import { EventQueue } from './queue';
import { SessionManager } from './session';

export class EventTracker {
  private apiClient: ApiClient;
  private eventQueue: EventQueue;
  private sessionManager: SessionManager;
  private clientId: string;
  private customerId?: string;

  constructor(apiClient: ApiClient, eventQueue: EventQueue, sessionManager: SessionManager, clientId: string, customerId?: string) {
    this.apiClient = apiClient;
    this.eventQueue = eventQueue;
    this.sessionManager = sessionManager;
    this.clientId = clientId;
    this.customerId = customerId;
  }

  async track(eventData: Omit<Event, 'sessionId' | 'userId' | 'timestamp'>): Promise<void> {
    // Create complete event with session data
    const event: Event = {
      ...eventData,
      clientId: this.clientId,
      customerId: this.customerId,
      sessionId: this.sessionManager.getSessionId(),
      userId: this.sessionManager.getUserId(),
      timestamp: Date.now()
    };

    try {
      // First attempt to send immediately
      const success = await this.apiClient.sendEvent(event);
      
      if (!success) {
        // 400 errors are handled and logged in sendEvent
        return;
      }
    } catch (error) {
      // Only queue for retry on non-400 errors
      this.eventQueue.add(event);
    }
  }

  // Method to manually flush the queue
  async flushQueue(): Promise<void> {
    const batch = this.eventQueue.getBatch();
    
    if (batch.length === 0) {
      return;
    }

    const failedEvents: Event[] = [];

    for (const event of batch) {
      try {
        const success = await this.apiClient.sendEvent(event);
        if (!success) {
          // If it's a 400 error, don't re-queue (permanent failure)
        } else {
          // Event was successfully sent, no need to re-queue
        }
      } catch (error) {
        // For any error (404, network, etc.), add to failed events to re-queue
        failedEvents.push(event);
      }
    }

    // Re-queue all failed events
    if (failedEvents.length > 0) {
      for (const event of failedEvents) {
        this.eventQueue.add(event);
      }
    }
  }

  // Debug method to check queue status
  getQueueStatus(): { length: number; events: Event[] } {
    return this.eventQueue.getQueueStatus();
  }

  // Debug method to clear queue
  clearQueue(): void {
    this.eventQueue.clearQueue();
  }
}