/**
 * Snowplow Wrapper
 * 
 * Handles all Snowplow-specific event sending logic.
 * Provides a clean interface for sending events to the Snowplow collector.
 */

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker';
import type { AutocaptureEvent } from '../common/types';
import { EventType } from '../common/types';
import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';

/**
 * Send a page view event to Snowplow collector
 * 
 * @param event - The page view event to send
 * @param debug - Enable debug logging
 */
export function sendPageViewToSnowplow(event: AutocaptureEvent, debug: boolean): void {
  if (debug) {
    console.log('📤 [Snowplow] Sending page view event:', event.id);
    sdkLog(debug, '📄 [Cruxstack] PAGE_VIEW Event - Full Data:', {
        type: event.type,
        timestamp: new Date(event.timestamp).toISOString(),
        routeInfo: event.routeInfo,
        previousPageTimeSpent: event.eventData?.previousPageTimeSpent,
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
    if (error instanceof CruxSDKError) {
      throw error;
    }
    throw new CruxSDKError('Failed to send page view event to Snowplow', 'general', { eventId: event.id });
  }

  if (debug) {
    console.log('✅ [Snowplow] Page view event sent successfully');
  }
}

/**
 * Send a button click event to Snowplow collector
 * 
 * @param event - The button click event to send
 * @param debug - Enable debug logging
 */
export function sendButtonClickToSnowplow(event: AutocaptureEvent, debug: boolean): void {
  if (debug) {
    console.log('📤 [Snowplow] Sending button click event:', event.id);
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
    if (error instanceof CruxSDKError) {
      throw error;
    }
    throw new CruxSDKError('Failed to send button click event to Snowplow', 'general', { eventId: event.id });
  }

  if (debug) {
    console.log('✅ [Snowplow] Button click event sent successfully');
  }
}

/**
 * Send any autocapture event to Snowplow collector
 * Routes events to appropriate handlers based on event type
 * 
 * @param event - The event to send
 * @param debug - Enable debug logging
 */
export function sendEventToSnowplow(event: AutocaptureEvent, debug: boolean): void {
  switch (event.type) {
    case EventType.PAGE_VIEW:
      sendPageViewToSnowplow(event, debug);
      break;
    case EventType.CLICK:
      sendButtonClickToSnowplow(event, debug);
      break;
    default:
      if (debug) {
        console.log('❓ [Snowplow] Unknown event type:', event.type);
      }
  }
}
