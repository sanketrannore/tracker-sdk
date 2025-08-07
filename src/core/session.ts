import { CruxstackConfig, StorageInterface, SessionData } from '../common/types';

// Session configuration
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes of inactivity
const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours maximum session
const SESSION_STORAGE_KEY = 'cruxstack_session';

// Memory storage fallback
class MemoryStorage implements StorageInterface {
  private data: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

// Storage detection with fallbacks
function getStorage(): StorageInterface {
  // Try sessionStorage first
  try {
    sessionStorage.setItem('test', '1');
    sessionStorage.removeItem('test');
    return sessionStorage;
  } catch (e) {
    // Fallback to memory storage
    return new MemoryStorage();
  }
}

export class SessionManager {
  private config: CruxstackConfig;
  private storage: StorageInterface;
  private debugLog: boolean;

  constructor(config: CruxstackConfig) {
    this.config = config;
    this.storage = getStorage();
    this.debugLog = config.debugLog || false;
    
    // Warn if using memory storage
    if (this.storage instanceof MemoryStorage && this.debugLog) {
      console.warn('Cruxstack: Using memory storage fallback. Sessions will not persist across page reloads.');
    }
  }

  getSessionId(): string {
    const sessionData = this.getSessionData();
    const now = Date.now();

    if (!sessionData || this.shouldExpireSession(sessionData, now)) {
      return this.createNewSession();
    }

    // Update last activity
    sessionData.lastActivity = now;
    this.saveSessionData(sessionData);
    
    return sessionData.id;
  }

  getUserId(): string | undefined {
    // Always use userId from config, never store it
    return this.config.userId;
  }

  resetSession(): void {
    this.storage.removeItem(SESSION_STORAGE_KEY);
    
    if (this.debugLog) {
      console.log('Cruxstack: Session reset successfully');
    }
  }

  private getSessionData(): SessionData | null {
    try {
      const data = this.storage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      if (this.debugLog) {
        console.error('Cruxstack: Error reading session data:', e);
      }
      return null;
    }
  }

  private saveSessionData(sessionData: SessionData): void {
    try {
      this.storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      if (this.debugLog) {
        console.error('Cruxstack: Error saving session data:', e);
      }
    }
  }

  private shouldExpireSession(sessionData: SessionData, now: number): boolean {
    const sessionAge = now - sessionData.startTime;
    const timeSinceLastActivity = now - sessionData.lastActivity;

    // Expire if session is too old OR user has been inactive
    return sessionAge > MAX_SESSION_DURATION || 
           timeSinceLastActivity > SESSION_DURATION;
  }

  private createNewSession(): string {
    const now = Date.now();
    const sessionData: SessionData = {
      id: this.generateId(),
      startTime: now,
      lastActivity: now
    };

    this.saveSessionData(sessionData);

    if (this.debugLog) {
      console.log('Cruxstack: New session created:', sessionData.id);
    }

    return sessionData.id;
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}