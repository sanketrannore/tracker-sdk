/*
 * Event Collector Wrapper
 *
 * Handles all event sending logic to the analytics collector.
 * Provides a clean interface for sending events to the event collector.
 */
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker';
import { EventType } from '../common/types';
import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';

/**
 * Send a page view event to the event collector
 *
 * @param event - The page view event to send
 * @param debug - Enable debug logging
 */
export function sendPageViewToEventCollector(event: any, debug: boolean): void {
  if (debug) {
    sdkLog(debug, '[Cruxstack] PAGE_VIEW Event - Full Data:', event);
  }
  try {
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
  } catch (error) {
    throw new CruxSDKError('Failed to send page view event to event collector', 'general', { eventId: event.id });
  }
}

/**
 * Send a button click event to the event collector
 *
 * @param event - The button click event to send
 * @param debug - Enable debug logging
 */
export function sendButtonClickToEventCollector(event: any, debug: boolean): void {
  if (debug) {
    sdkLog(debug, '[Cruxstack] BUTTON_CLICK Event - Full Data:', event);
  }
  try {
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
  } catch (error) {
    throw new CruxSDKError('Failed to send button click event to event collector', 'general', { eventId: event.id });
  }
}

/**
 * Send any autocapture event to the event collector
 * Routes events to appropriate handlers based on event type
 *
 * @param event - The event to send
 * @param debug - Enable debug logging
 */
export function sendEventToEventCollector(event: any, debug: boolean): void {
  switch (event.type) {
    case EventType.PAGE_VIEW:
      sendPageViewToEventCollector(event, debug);
      break;
    case EventType.CLICK:
      sendButtonClickToEventCollector(event, debug);
      break;
    default:
      if (debug) {
        sdkLog(debug, '[Cruxstack] Unknown event type:', event.type);
      }
  }
}
