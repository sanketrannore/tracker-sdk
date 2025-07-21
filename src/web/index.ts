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

import { isBrowser, assertBrowserEnv } from '../common/environment';
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
let isInitialized = false;

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
  assertBrowserEnv();
  if (isInitialized) {
    sdkLog(debug, '[Cruxstack] SDK already initialized. Skipping re-initialization.');
    return;
  }
  isInitialized = true;
  debug = options.debugLog === true;
  sdkLog(debug, '🚀 [Cruxstack] Initializing SDK with config:', options);
  config = options;
  await initEmitter(options.appId, debug);
  if (options.userId) {
    const { setUserId } = await import('@snowplow/browser-tracker');
    setUserId(options.userId);
  }
  isEnabled = options.autoCapture !== false;
  if (isEnabled) {
    await initializeAutocapture(options, isEnabled, debug);
  } else {
    sdkLog(debug, '❌ [Cruxstack] AutoCapture disabled');
  }
  initCustomEvents(debug, options.appId);
  sdkLog(debug, '🎉 [Cruxstack] SDK initialization complete');
}

import { stopClickTracking } from '../plugins/trackers/click-tracker';
import { stopPageTracking } from '../plugins/trackers/page-tracker';

export function stopCruxstack(): void {
  if (!isInitialized) {
    sdkLog(debug, '[Cruxstack] SDK is not initialized. Nothing to stop.');
    return;
  }
  isEnabled = false;
  stopClickTracking();
  stopPageTracking();
  isInitialized = false;
  sdkLog(debug, '[Cruxstack] SDK stopped and cleaned up.');
}

export const cruxstack = {
  init: initCruxstack,
  trackCustom: cruxCustom,
  stop: stopCruxstack
};

export { CruxstackConfig }
