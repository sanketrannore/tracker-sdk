import { newTracker, trackStructEvent, trackPageView, setUserId } from '@snowplow/browser-tracker';
import type { AutocaptureConfig, AutocaptureEvent } from './types/types';
import { EventType } from './types/types';
import {
  shouldSampleEvent,
  isEventLimitReached,
  debugLog,
  generateEventId
} from './utils';

// Import separate tracker modules
import { 
  initClickTracking, 
  stopClickTracking, 
  setClickEventDispatcher,
  isClickTrackingActive
} from './trackers/click-tracker';



import { 
  initPageTracking, 
  stopPageTracking, 
  setPageEventDispatcher,
  trackAutocapturePageView,
  trackCurrentPageTime,
  isPageTrackingActive
} from './trackers/page-tracker';

/**
 * Main Autocapture SDK
 * Coordinates all tracking modules and handles event processing
 */

export interface CruxstackConfig {
  collectorUrl: string;   // Mandatory
  appId: string;          // Mandatory
  userId?: string;        // Optional
  autoCapture?: boolean;  // Optional - defaults to true
}

// Global state
let isEnabled = false;
let config: AutocaptureConfig = {};
let eventCount = 0;

/**
 * Initialize autocapture with Snowplow integration
 * Sets up Snowplow tracker and initializes all tracking modules
 * @param options - Configuration options including Snowplow settings
 */
export async function initCruxstack(options: CruxstackConfig) {
  // Initialize Snowplow tracker
  newTracker('sp1', options.collectorUrl, {
    appId: options.appId,
    postPath: '/com.snowplowanalytics.snowplow/tp2',
    platform: 'web',
  });
  
  // Set user ID if provided
  if (options.userId) {
    setUserId(options.userId);
  }
  
  // Initialize autocapture only if autoCapture is enabled (defaults to true)
  const shouldAutoCapture = options.autoCapture !== false;
  
  if (shouldAutoCapture) {
    await initCruxstackConfig({
      clicks: true,
      pageViews: true,
      debug: false,
      samplingRate: 1,
      maxEventsPerSession: 1000
    });
  }
}

/**
 * Default event handler that sends events to Snowplow
 * Can be overridden with custom onEvent handler in config
 * @param event - Autocapture event to process
 */
function defaultOnEvent(event: AutocaptureEvent) {
  switch (event.type) {
    case EventType.PAGE_VIEW:
      // Send page view to Snowplow
      trackPageView({}, ['sp1']);
      if (config.debug) {
        debugLog('Sent PAGE_VIEW to Snowplow', config, event);
      }
      break;
      
    case EventType.PAGE_TIME:
      // Send page time as structured event
      trackStructEvent({
        category: 'autocapture',
        action: 'page_time',
        label: event.routeInfo?.pathname,
        property: `Time spent: ${Math.round((event.routeInfo?.timeSpent || 0) / 1000)}s`
      }, ['sp1']);
      if (config.debug) {
        debugLog('Sent PAGE_TIME to Snowplow', config, event);
      }
      break;
      
    case EventType.CLICK:
      // Send click as structured event
      trackStructEvent({
        category: 'autocapture',
        action: 'click',
        label: event.elementInfo?.tagName,
        property: event.elementInfo?.id || event.elementInfo?.className
      }, ['sp1']);
      if (config.debug) {
        debugLog('Sent CLICK to Snowplow', config, event);
      }
      break;
      
    
      
    default:
      debugLog(`Unknown event type: ${event.type}`, config);
  }
}

/**
 * Central event processing function
 * Handles event validation, sampling, limits, and dispatch
 * @param event - Autocapture event to process
 */
function createAndSendEvent(event: AutocaptureEvent) {
  // Early return if autocapture is disabled
  if (!isEnabled) return;
  
  // Check event limits
  if (isEventLimitReached(eventCount, config)) {
    debugLog('Event limit reached', config);
    return;
  }
  
  // Apply sampling
  if (!shouldSampleEvent(config)) {
    debugLog('Event sampled out', config);
    return;
  }
  
  // Add unique event ID
  const eventWithId = { 
    ...event, 
    id: generateEventId()
  };
  
  // Get event handler (custom or default)
  const handler = config.onEvent || defaultOnEvent;
  
  try {
    // Process the event
    handler(eventWithId);
  } catch (error) {
    debugLog('Error in event handler', config, error);
    if (config.onError) {
      config.onError(error as Error);
    }
  }
  
  // Log successful event capture
  debugLog('Event captured', config, eventWithId);
  eventCount++;
}

/**
 * Initialize all autocapture modules
 * Sets up click, form, and page tracking based on configuration
 * @param userConfig - User configuration object
 */
export async function initCruxstackConfig(userConfig: AutocaptureConfig = {}) {
  // Set default configuration
  config = {
    clicks: true,
    formInteractions: true,
    pageViews: true,
    routeChanges: true,
    samplingRate: 1,
    maxEventsPerSession: 1000,
    debug: false,
    ...userConfig // Client config overrides defaults
  };
  
  // Enable autocapture
  isEnabled = true;
  eventCount = 0;
  
  // Set up event dispatchers for each module
  setClickEventDispatcher(createAndSendEvent);
  setPageEventDispatcher(createAndSendEvent);
  
  // Initialize each tracking module based on configuration
  initClickTracking(config);
  initPageTracking(config);
  
  debugLog('Autocapture initialized with configuration:', config);
}

/**
 * Stop all autocapture modules and clean up
 * Removes event listeners and stops tracking
 */
export function stopCruxstack() {
  isEnabled = false;
  
  // Stop all tracking modules
  stopClickTracking();
  stopPageTracking();
  
  debugLog('Autocapture stopped', config);
}

/**
 * Re-export page tracking functions for external use
 * These are commonly used in React applications
 */
export { trackAutocapturePageView, trackCurrentPageTime };

/**
 * Get current autocapture status and statistics
 * Useful for debugging and monitoring
 * @returns Current autocapture state
 */
export function getCruxstackStatus() {
  return {
    isEnabled,
    eventCount,
    config,
    modules: {
      clicks: isClickTrackingActive(),
      pages: isPageTrackingActive()
    }
  };
}
