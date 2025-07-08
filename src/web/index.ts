/**
 * Cruxstack Autocapture SDK
 * 
 * A comprehensive analytics SDK that automatically captures user interactions
 * and page views, sending rich data to Snowplow collectors.
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
 *   collectorUrl: 'https://your-collector.com',
 *   appId: 'your-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * ```
 */

import { 
  newTracker, 
  trackSelfDescribingEvent, 
  setUserId 
} from '@snowplow/browser-tracker';

import type { AutocaptureConfig, AutocaptureEvent } from '../common/types';
import { EventType } from '../common/types';
import { shouldSampleEvent, isEventLimitReached, debugLog, generateEventId } from '../common/utils';

// Import tracker modules
import { 
  initClickTracking, 
  stopClickTracking, 
  setClickEventDispatcher,
  isClickTrackingActive
} from '../plugins/trackers/click-tracker';

import { 
  initPageTracking, 
  stopPageTracking, 
  setPageEventDispatcher,
  trackAutocapturePageView,
  trackCurrentPageTime,
  isPageTrackingActive
} from '../plugins/trackers/page-tracker';

/**
 * Main SDK Configuration Interface
 */
export interface CruxstackConfig {
  /** Snowplow collector endpoint URL (required) */
  collectorUrl: string;
  /** Application identifier (required) */
  appId: string;
  /** User identifier (optional) */
  userId?: string;
  /** Enable/disable automatic event capture (optional, defaults to true) */
  autoCapture?: boolean;
}

// Global SDK state
let isEnabled = false;
let config: AutocaptureConfig = {};
let eventCount = 0;

/**
 * Initialize Cruxstack SDK
 * 
 * Sets up Snowplow tracker and initializes autocapture modules.
 * Call this once when your application loads.
 * 
 * @param options - SDK configuration options
 * 
 * @example
 * ```typescript
 * await initCruxstack({
 *   collectorUrl: 'https://collector.example.com',
 *   appId: 'my-app',
 *   userId: 'user123',
 *   autoCapture: true
 * });
 * ```
 */
export async function initCruxstack(options: CruxstackConfig): Promise<void> {
  console.log('🚀 [Cruxstack] Initializing SDK with config:', options);
  
  // Initialize Snowplow tracker
  newTracker('sp1', options.collectorUrl, {
    appId: options.appId,
    postPath: '/com.snowplowanalytics.snowplow/tp2',
    platform: 'web',
  });
  console.log('✅ [Cruxstack] Snowplow tracker initialized');
  
  // Set user ID if provided
  if (options.userId) {
    setUserId(options.userId);
    console.log('✅ [Cruxstack] User ID set:', options.userId);
  }
  
  // Initialize autocapture (defaults to enabled)
  const shouldAutoCapture = options.autoCapture !== false;
  
  if (shouldAutoCapture) {
    console.log('✅ [Cruxstack] AutoCapture enabled - initializing trackers');
    await initializeAutocapture();
  } else {
    console.log('❌ [Cruxstack] AutoCapture disabled - no tracking will occur');
  }
  
  console.log('🎉 [Cruxstack] SDK initialization complete');
}

/**
 * Initialize autocapture modules with default configuration
 * @private
 */
async function initializeAutocapture(): Promise<void> {
  // Set sensible defaults for autocapture
  config = {
    clicks: true,
    pageViews: true,
    debug: false,
    samplingRate: 1,
    maxEventsPerSession: 1000
  };
  
  // Enable tracking
  isEnabled = true;
  eventCount = 0;
  
  // Connect event handlers
  setClickEventDispatcher(processAndSendEvent);
  setPageEventDispatcher(processAndSendEvent);
  
  // Start tracking modules
  initClickTracking(config);
  initPageTracking(config);
  
  debugLog('Autocapture initialized with configuration:', config);
}

/**
 * Process and send events to Snowplow
 * Handles validation, sampling, limits, and dispatch
 * @private
 */
function processAndSendEvent(event: AutocaptureEvent): void {
  // Early returns for disabled tracking or limits
  if (!isEnabled) return;
  if (isEventLimitReached(eventCount, config)) {
    debugLog('Event limit reached', config);
    return;
  }
  if (!shouldSampleEvent(config)) {
    debugLog('Event sampled out', config);
    return;
  }
  
  // Add unique event ID
  const eventWithId = { ...event, id: generateEventId() };
  
  try {
    sendEventToSnowplow(eventWithId);
    eventCount++;
  } catch (error) {
    debugLog('Error sending event', config, error);
  }
}

/**
 * Send events to Snowplow with comprehensive data
 * @private
 */
function sendEventToSnowplow(event: AutocaptureEvent): void {
  console.log('📤 [Cruxstack] Processing event:', event.type);
  
  switch (event.type) {
    case EventType.PAGE_VIEW:
      sendPageViewEvent(event);
      break;
      
    case EventType.CLICK:
      sendButtonClickEvent(event);
      break;
      
    default:
      console.log('❓ [Cruxstack] Unknown event type:', event.type);
  }
}

/**
 * Send page view event with all captured data
 * @private
 */
function sendPageViewEvent(event: AutocaptureEvent): void {
  const timeSpentInfo = event.eventData?.previousPageTimeSpent;
  
  // Log comprehensive page view data
  console.log('📄 [Cruxstack] PAGE_VIEW Event - Full Data:', {
    type: event.type,
    timestamp: new Date(event.timestamp).toISOString(),
    routeInfo: event.routeInfo,
    previousPageTimeSpent: timeSpentInfo ? {
      ...timeSpentInfo,
      summary: `Spent ${timeSpentInfo.timeSpentFormatted} on previous page (${timeSpentInfo.timePeriod})`
    } : 'No previous page data',
    pageInfo: {
      title: event.eventData?.pageTitle,
      url: event.eventData?.pageUrl,
      host: event.eventData?.pageHost,
      protocol: event.eventData?.pageProtocol,
      referrer: event.eventData?.referrer
    },
    browserInfo: {
      userAgent: event.eventData?.userAgent,
      language: event.eventData?.language,
      platform: event.eventData?.platform,
      onLine: event.eventData?.onLine
    },
    displayInfo: event.eventData?.viewport,
    performance: event.eventData?.performanceTiming,
    connection: event.eventData?.connection,
    metaTags: event.eventData?.metaTags
  });
  
  // Send to Snowplow as self-describing event
  trackSelfDescribingEvent({
    event: {
      schema: 'iglu:com.cruxstack/page_view/jsonschema/1-0-0',
      data: {
        ...event.eventData,
        routeInfo: event.routeInfo,
        capturedAt: new Date(event.timestamp).toISOString(),
        eventId: event.id
      }
    }
  }, ['sp1']);
  
  console.log('✅ [Cruxstack] PAGE_VIEW with FULL DATA sent to Snowplow');
}

/**
 * Send button click event with all captured data
 * @private
 */
function sendButtonClickEvent(event: AutocaptureEvent): void {
  // Log comprehensive button click data
  console.log('👆 [Cruxstack] BUTTON_CLICK Event - Full Data:', {
    type: event.type,
    timestamp: new Date(event.timestamp).toISOString(),
    buttonDetails: {
      id: event.eventData?.buttonId,
      name: event.eventData?.buttonName,
      value: event.eventData?.buttonValue,
      type: event.eventData?.buttonType,
      text: event.eventData?.buttonText,
      disabled: event.eventData?.buttonDisabled
    },
    styling: {
      className: event.eventData?.className,
      classList: event.eventData?.classList
    },
    position: event.eventData?.position,
    mouseDetails: {
      button: event.eventData?.mouseButton,
      coordinates: event.eventData?.clickCoordinates
    },
    dataAttributes: event.eventData?.dataAttributes,
    formContext: event.eventData?.formContext,
    domInfo: {
      tagName: event.eventData?.targetTagName,
      parentElement: event.eventData?.parentElement,
      elementPath: event.eventData?.elementPath,
      isVisible: event.eventData?.isVisible
    },
    pageContext: {
      url: event.eventData?.pageUrl,
      title: event.eventData?.pageTitle,
      referrer: event.eventData?.referrer
    },
    elementInfo: event.elementInfo
  });
  
  // Send to Snowplow as self-describing event
  trackSelfDescribingEvent({
    event: {
      schema: 'iglu:com.cruxstack/button_click/jsonschema/1-0-0',
      data: {
        ...event.eventData,
        elementInfo: event.elementInfo,
        capturedAt: new Date(event.timestamp).toISOString(),
        eventId: event.id
      }
    }
  }, ['sp1']);
  
  console.log('✅ [Cruxstack] BUTTON_CLICK with FULL DATA sent to Snowplow');
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
  debugLog('Autocapture stopped', config);
}

/**
 * Get current SDK status and statistics
 * 
 * @returns Current state of the SDK
 * 
 * @example
 * ```typescript
 * const status = getCruxstackStatus();
 * console.log('Events captured:', status.eventCount);
 * console.log('Tracking active:', status.isEnabled);
 * ```
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

// Re-export useful functions for manual tracking
export { trackAutocapturePageView, trackCurrentPageTime };

// Re-export types for TypeScript users
export type { AutocaptureEvent, AutocaptureConfig } from '../common/types';
