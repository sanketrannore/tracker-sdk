import { trackEvent } from '../core/init';

// Interface for custom event data
export interface CustomEventOptions {
  type: string;
  data: Record<string, any>;
}

// Convenience function for custom events with better developer experience
export function cruxCustom(eventName: string, properties: Record<string, any> = {}): void {
  if (!eventName || typeof eventName !== 'string') {
    throw new Error('Cruxstack: Event name is required and must be a string.');
  }
  
  if (eventName.trim() === '') {
    throw new Error('Cruxstack: Event name cannot be empty.');
  }
  
  trackEvent({
    type: eventName,
    data: properties
  });
}

export default cruxCustom; 