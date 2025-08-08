export interface CruxstackConfig {
  /** Client identifier (required) */
  clientId: string;
  /** Customer identifier (optional) */
  customerId?: string;
  /** Customer name (optional, used as cna) */
  customerName?: string;
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
  env?: EnvSnapshot;
}

// Event format for API
export interface ApiEvent {
  cid?: string; // customerId (optional)
  cna?: string; // customer name (optional)
  uid?: string; // userId (optional)
  eid: string;  // eventId
  dtm: number;  // datetime
  e: string;    // event type
  ev: Record<string, any>; // event data
  tv: string; // version
  sid: string; // sessionId
  tna: string; // tracker name (e.g., web)
  ua: string; // user agent
  sh: number; // screen height
  sw: number; // screen width
  l: string; // language
  tz: string; // timezone
  p: string; // platform
  an: boolean; // anonymous
  vh: number; // viewport height
  vw: number; // viewport width
  pt: string; // page title
  pu: string; // page url
  pp: string; // page path
  pd: string; // page domain
  pl: number | null; // page load time
  pr: string | null; // page referrer
  ip: string | null; // ip address
}

// Snapshot of environment/page context captured at event time
export interface EnvSnapshot {
  ua: string;
  sh: number;
  sw: number;
  l: string;
  tz: string;
  p: string;
  an: boolean;
  vh: number;
  vw: number;
  pt: string;
  pu: string;
  pp: string;
  pd: string;
  pl: number | null;
  pr: string | null;
  ip: string | null;
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