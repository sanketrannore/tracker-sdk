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

import { isBrowser } from '../common/environment';
import type { AutocaptureConfig, CruxstackConfig } from '../common/types';
import { sdkLog } from '../common/utils';

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
let isBrowserEnvironment = false;

/**
 * Initialize Cruxstack SDK
 * 
 * Sets up tracker and initializes modules based on environment.
 * In browser environments: enables autocapture + custom events via Snowplow
 * In non-browser environments: enables custom events via direct endpoint only
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
  isBrowserEnvironment = isBrowser();
  
  sdkLog(debug, '🚀 [Cruxstack] Initializing SDK with config:', options);
  sdkLog(debug, `🌍 [Cruxstack] Environment: ${isBrowserEnvironment ? 'Browser' : 'Non-browser'}`);
  
  // Assign the options to the global config for autocapture
  config = options;

  if (isBrowserEnvironment) {
    // Browser environment: Full feature set
    sdkLog(debug, '🌐 [Cruxstack] Browser environment detected - enabling full feature set');
    
    // Initialize emitter (Snowplow tracker)
    await initEmitter(options.appId, debug);
    
    // Set user ID if provided (only works in browser with Snowplow)
    if (options.userId) {
      const { setUserId } = await import('@snowplow/browser-tracker');
      setUserId(options.userId);
      sdkLog(debug, '✅ [Cruxstack] User ID set:', options.userId);
    }
    
    // Initialize autocapture (defaults to enabled)
    isEnabled = options.autoCapture !== false;
    
    if (isEnabled) {
      sdkLog(debug, '✅ [Cruxstack] AutoCapture enabled - initializing browser trackers');
      await initializeAutocapture(options, isEnabled, debug);
    } else {
      sdkLog(debug, '❌ [Cruxstack] AutoCapture disabled');
    }
    
    // Initialize custom events (browser mode - uses Snowplow)
    initCustomEvents(debug, options.appId, undefined, true);
    
  } else {
    // Non-browser environment: Custom events only
    sdkLog(debug, '📱 [Cruxstack] Non-browser environment detected - enabling custom events only');
    
    // AutoCapture is not available in non-browser environments
    isEnabled = false;
    sdkLog(debug, '❌ [Cruxstack] AutoCapture not available in non-browser environment');
    
    if (options.userId) {
      sdkLog(debug, '⚠️ [Cruxstack] User ID setting not available in non-browser environment');
    }
    
    // Initialize custom events (non-browser mode - direct endpoint only)
    initCustomEvents(debug, options.appId, undefined, false);
  }
  
  sdkLog(debug, '🎉 [Cruxstack] SDK initialization complete');
}

export const cruxstack = {
  init: initCruxstack,
  trackCustom: cruxCustom
};

export { CruxstackConfig }
