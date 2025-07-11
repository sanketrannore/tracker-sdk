/**
 * Autocapture Event Processing Module
 * 
 * Handles all event processing, validation, and dispatching to collector.
 * This module coordinates between individual trackers and the emitter.
 */

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker';
import type { AutocaptureConfig, AutocaptureEvent } from '../../common/types';
import { EventType } from '../../common/types';
import { debugLog, generateEventId, sdkLog, shouldSampleEvent } from '../../common/utils';
import { initClickTracking, setClickEventDispatcher } from './click-tracker';
import { initPageTracking, setPageEventDispatcher } from './page-tracker';

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
    clicks: true,
    pageViews: true,
    debugLog: false,
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

  debugLog('Autocapture initialized with configuration:', config);
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
    debugLog('Event sampled out', config);
    sdkLog(debug, '[Cruxstack] Event sampled out', config);
    return;
  }

  // Add unique event ID
  const eventWithId = { ...event, id: generateEventId() };

  try {
    sendEventToSnowplow(eventWithId, debug);
  } catch (error) {
    debugLog('Error sending event', config, error);
    sdkLog(debug, '[Cruxstack] Error sending event', config, error);
  }
}

/**
 * Send events to collector with comprehensive data
 * 
 * Routes events to appropriate handlers based on event type.
 * 
 * @param event - The event to send to collector
 * @param debug - Enable debug logging
 */
function sendEventToSnowplow(event: AutocaptureEvent, debug: boolean): void {
  sdkLog(debug, '📤 [Cruxstack] Processing event:', event.type);

  switch (event.type) {
    case EventType.PAGE_VIEW:
      sendPageViewEvent(event, debug);
      break;
    case EventType.CLICK:
      sendButtonClickEvent(event, debug);
      break;
    default:
      sdkLog(debug, '❓ [Cruxstack] Unknown event type:', event.type);
  }
}

/**
 * Send page view event with all captured data
 * 
 * Logs comprehensive page view information and sends to collector
 * as a self-describing event.
 * 
 * @param event - The page view event to process
 * @param debug - Enable debug logging
 */
function sendPageViewEvent(event: AutocaptureEvent, debug: boolean): void {
  const timeSpentInfo = event.eventData?.previousPageTimeSpent;

  // Log comprehensive page view data
  sdkLog(debug, '📄 [Cruxstack] PAGE_VIEW Event - Full Data:', {
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

  // Send to collector as self-describing event
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

  sdkLog(debug, '✅ [Cruxstack] PAGE_VIEW with FULL DATA sent to collector');
}

/**
 * Send button click event with all captured data
 * 
 * Logs comprehensive button click information and sends to collector
 * as a self-describing event.
 * 
 * @param event - The button click event to process
 * @param debug - Enable debug logging
 */
function sendButtonClickEvent(event: AutocaptureEvent, debug: boolean): void {
  // Log comprehensive button click data
  sdkLog(debug, '👆 [Cruxstack] BUTTON_CLICK Event - Full Data:', {
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

  // Send to collector as self-describing event
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

  sdkLog(debug, '✅ [Cruxstack] BUTTON_CLICK with FULL DATA sent to collector');
}
