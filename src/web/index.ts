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
 * - Custom event tracking with categories
 * 
 * @example
 * ```typescript
 * import { initCruxstack, trackCustom } from 'cruxstack-sdk';
 * 
 * initCruxstack({
 *   appId: 'your-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * 
 * // Send custom events
 * trackCustom('purchase', {
 *   productId: '123',
 *   amount: 99.99
 * });
 * ```
 */

import {
  setUserId
} from '@snowplow/browser-tracker';

import { isBrowser } from '../common/environment';
import type { AutocaptureConfig, CruxstackConfig } from '../common/types';
import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';

import { initEmitter } from '../libraries/emitter';
import { initializeAutocapture } from '../plugins/trackers/autoCapture';

// Import custom tracking
import { 
  initCustomEvents,
  cruxCustom
} from '../plugins/custom/customTrack';

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
 * await cruxstack.init({
 *   appId: 'my-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * ```
 */
export async function initCruxstack(options: CruxstackConfig): Promise<void> {
  debug = options.debugLog === true;
  sdkLog(debug, '🚀 [Cruxstack] Initializing SDK with config:', options);
  
  // // Check if we're in a browser environment
  // if (!isBrowser()) {
  //   sdkLog(debug, '❌ [Cruxstack] Browser environment required');
  //   throw new CruxSDKError('Browser environment required', 'general', { details: { message: 'Browser environment required' } });
  // }
  
  // Assign the options to the global config for autocapture
  config = options;

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
    sdkLog(debug, '✅ [Cruxstack] AutoCapture enabled - initializing browser trackers');
    // Pass actual options instead of empty config
    await initializeAutocapture(options, isEnabled, debug);
  } else {
    sdkLog(debug, '❌ [Cruxstack] AutoCapture disabled - no tracking will occur');
  }
  
  // Initialize custom events
  initCustomEvents(debug, options.appId);
  
  sdkLog(debug, '🎉 [Cruxstack] SDK initialization complete');
}


export const cruxstack = {
  init: initCruxstack,
  trackCustom: cruxCustom
};

export { CruxstackConfig }
