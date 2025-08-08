import { Event } from '../common/types';

const BATCH_SIZE = 10;
const QUEUE_KEY = 'cruxstack';
const MAX_QUEUE_SIZE = 1000; // Maximum events to store

export class EventQueue {
  private queue: Event[] = [];

  constructor() {
    this.loadFromStorage();
  }

  add(event: Event): void {
    // Prevent queue from growing too large
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift(); // Remove oldest event
    }
    
    this.queue.push(event);
    this.saveToStorage();
  }

  getBatch(): Event[] {
    const batch = this.queue.splice(0, BATCH_SIZE);
    this.saveToStorage();
    return batch;
  }

  remove(eventId: string): void {
    this.queue = this.queue.filter(e => e.id !== eventId);
    this.saveToStorage();
  }

  // Debug method to check queue status
  getQueueStatus(): { length: number; events: Event[] } {
    return {
      length: this.queue.length,
      events: this.queue
    };
  }

  // Debug method to clear queue
  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      // Only persist events that need to be sent
      const queueData = JSON.stringify(this.queue);
      localStorage.setItem(QUEUE_KEY, queueData);
    } catch (e) {
      console.error('EventQueue: Storage failed:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        // Handle storage full error by rotating oldest events
        this.queue = this.queue.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
        this.saveToStorage();
      } else {
        console.error('Queue storage failed', e);
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('EventQueue: Load failed:', e);
      this.queue = [];
    }
  }
}