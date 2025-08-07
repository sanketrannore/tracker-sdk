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

// Event format for API
export interface ApiEvent {
  cid?: string; // customerId (optional)
  uid?: string; // userId (optional)
  eid: string;  // eventId
  dtm: number;  // datetime
  e: string;    // event type
  ev: Record<string, any>; // event data
  tv: string; // version
  sid: string; // sessionId
  tna: string; // tracker version
}

// Session data interface
export interface SessionData {
  id: string;
  startTime: number;
  lastActivity: number;
}

// Storage interface for fallback support
export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}