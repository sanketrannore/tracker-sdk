/**
 * Cruxstack Autocapture SDK
 * 
 * A comprehensive analytics SDK that automatically captures user interactions
 * and page views, sending rich data to collector.
 * 
 * Features:
 * - Automatic button click tracking with comprehensive data
 * - Page view tracking with performance metrics and time spent
 * - Browser, device, and environment information
 * - Configurable sampling and event limits
 * 
 * @example
 * ```typescript
 * import { initCruxstack } from 'cruxstack-sdk';
 * 
 * initCruxstack({
 *   appId: 'your-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * ```
 */

import {
  setUserId
} from '@snowplow/browser-tracker';

import { isBrowser, logEnvironmentInfo } from '../common/environment';
import type { AutocaptureConfig, CruxstackConfig } from '../common/types';
import { sdkLog } from '../common/utils';

// Import tracker modules
import {
  isClickTrackingActive,
  stopClickTracking
} from '../plugins/trackers/click-tracker';

import {
  isPageTrackingActive,
  stopPageTracking
} from '../plugins/trackers/page-tracker';

import { initEmitter } from '../libraries/emitter';
import { initializeAutocapture } from '../plugins/trackers/autoCapture';

// Global SDK state
let isEnabled = false;
let config: AutocaptureConfig = {};
let debug = false;

/**
 * Initialize Cruxstack SDK
 * 
 * Sets up tracker and initializes autocapture modules.
 * Call this once when your application loads.
 * 
 * @param options - SDK configuration options
 * 
 * @example
 * ```typescript
 * await initCruxstack({
 *   appId: 'my-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * ```
 */
export async function initCruxstack(options: CruxstackConfig): Promise<void> {
  debug = options.debugLog === true;
  sdkLog(debug, '🚀 [Cruxstack] Initializing SDK with config:', options);
  
  // Log environment information
  logEnvironmentInfo();
  
  // Initialize emitter
  await initEmitter(options.appId, debug);
  
  // Set user ID if provided
  if (options.userId) {
    setUserId(options.userId);
    sdkLog(debug, '✅ [Cruxstack] User ID set:', options.userId);
  }
  
  // Initialize autocapture (defaults to enabled)
  isEnabled = options.autoCapture !== false;
  
  if (isEnabled) {
    if (isBrowser()) {
      sdkLog(debug, '✅ [Cruxstack] AutoCapture enabled - initializing browser trackers');
      await initializeAutocapture(config, isEnabled, debug);
    } else {
      sdkLog(debug, '🟢 [Cruxstack] AutoCapture enabled in Node.js - limited tracking available');
      await initializeAutocapture(config, isEnabled, debug);
    }
  } else {
    sdkLog(debug, '❌ [Cruxstack] AutoCapture disabled - no tracking will occur');
  }
  
  sdkLog(debug, '🎉 [Cruxstack] SDK initialization complete');
}

/**
 * Stop all tracking and clean up resources
 * 
 * @example
 * ```typescript
 * stopCruxstack(); // Disable all tracking
 * ```
 */
export function stopCruxstack(): void {
  isEnabled = false;
  stopClickTracking();
  stopPageTracking();
  sdkLog(debug, 'Autocapture stopped', config);
}

/**
 * Get current SDK status and statistics
 * 
 * @returns Current state of the SDK
 * 
 * @example
 * ```typescript
 * const status = getCruxstackStatus();
 * console.log('Tracking active:', status.isEnabled);
 * console.log('Click tracking:', status.modules.clicks);
 * console.log('Page tracking:', status.modules.pages);
 * ```
 */
export function getCruxstackStatus() {
  return {
    isEnabled,
    config,
    modules: {
      clicks: isClickTrackingActive(),
      pages: isPageTrackingActive()
    }
  };
}


