/**
 * Autocapture Event Processing Module
 * 
 * Handles all event processing, validation, and dispatching to collector.
 * This module coordinates between individual trackers and the emitter.
 */

import type { AutocaptureConfig, AutocaptureEvent } from '../../common/types';
import { generateEventId, sdkLog, shouldSampleEvent } from '../../common/utils';
import { initClickTracking, setClickEventDispatcher } from './click-tracker';
import { initPageTracking, setPageEventDispatcher } from './page-tracker';
import { sendEventToSnowplow } from '../../libraries/snowplowWrapper';
import { CruxSDKError } from '../../common/errors';

/**
 * Initialize autocapture modules with default configuration
 * 
 * Sets up event dispatchers and starts individual tracking modules.
 * This function is called by the main SDK initialization.
 * 
 * @param config - Autocapture configuration options
 * @param isEnabled - Whether autocapture is currently enabled
 * @param debug - Enable debug logging
 */
export async function initializeAutocapture(config: AutocaptureConfig, isEnabled: boolean, debug: boolean): Promise<void> {
  // Set sensible defaults for autocapture
  config = {
    samplingRate: 1,
    maxEventsPerSession: 1000,
    ...config
  };

  // Connect event handlers to the processing pipeline
  setClickEventDispatcher((event) => processAndSendEvent(event, isEnabled, config, debug));
  setPageEventDispatcher((event) => processAndSendEvent(event, isEnabled, config, debug));

  // Start individual tracking modules
  initClickTracking(config);
  initPageTracking(config);

  sdkLog(debug, '[Cruxstack] Autocapture initialized with configuration:', config);
}

/**
 * Process and send events to collector
 * 
 * Main event processing pipeline that handles validation, sampling, and dispatch.
 * This function is called by individual trackers when events are captured.
 * 
 * @param event - The captured event to process
 * @param isEnabled - Whether autocapture is currently enabled
 * @param config - Current autocapture configuration
 * @param debug - Enable debug logging
 */
export function processAndSendEvent(event: AutocaptureEvent, isEnabled: boolean, config: AutocaptureConfig, debug: boolean): void {
  // Early returns for disabled tracking
  if (!isEnabled) return;
  if (!shouldSampleEvent(config)) {
    sdkLog(debug, '[Cruxstack] Event sampled out', config);
    return;
  }

  // Add unique event ID
  const eventWithId = { ...event, id: generateEventId() };

  try {
    // Log event processing
    sdkLog(debug, '📤 [Cruxstack] Processing event:', event.type);
    
    // Send event to Snowplow via wrapper
    sendEventToSnowplow(eventWithId, debug);
    
    sdkLog(debug, '✅ [Cruxstack] Event sent to collector successfully');
  } catch (error) {
    sdkLog(debug, '[Cruxstack] Error sending event', config, error);
  }
}
