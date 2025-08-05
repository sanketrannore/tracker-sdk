export { init, flushEvents, getSessionInfo, isInitialized, getConfig, resetSession, cleanup, getQueueStatus, clearQueue } from './core/init';
export { cruxCustom } from './trackers/customEvents';

// Export types for TypeScript users
export type { CruxstackConfig } from './common/types';
