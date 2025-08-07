export interface CruxstackConfig {
  /** Client identifier (required) */
  clientId: string;
  /** Customer identifier (optional) */
  customerId?: string;
  /** User identifier (optional) */
  userId?: string;
  /** Enable/disable automatic event capture (optional, defaults to true) */
  autoCapture?: boolean;
  /** Enable debug logging to console (optional, defaults to false) */
  debugLog?: boolean;
} 


export interface Event {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId: string | undefined;
  clientId: string;
  customerId?: string;
}

// Add this for public event tracking
export type PublicEvent = Omit<Event, 'sessionId' | 'userId' | 'timestamp' | 'id'>;