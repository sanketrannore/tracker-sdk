/**
 * Custom Events Plugin
 * 
 * Allows users to send custom events with categories and associated data.
 * Provides a simple API for tracking custom business events.
 * Uses a dedicated endpoint separate from Snowplow.
 * 
 * @example
 * ```typescript
 * import { cruxstack } from '@sanketrannore/tracker-sdk';
 * 
 * // Track a purchase event
 * cruxstack.trackCustom('purchase', {
 *   productId: '123',
 *   amount: 99.99,
 *   currency: 'USD'
 * });
 * 
 * // Track a user action
 * cruxstack.trackCustom('user_action', {
 *   action: 'signup',
 *   source: 'homepage'
 * });
 * ```
 */

import { sdkLog } from '../../common/utils';
import { isBrowser } from '../../common/environment';
import { trackStructEvent } from '@snowplow/browser-tracker';
import { CruxSDKError } from '../../common/errors';

// Global state for custom events
let isInitialized = false;
let debugEnabled = false;
let customEventsEndpoint = 'https://dev-uii.portqii.com/eventCollector/i';

/**
 * Custom event data structure
 */
export interface CustomEventData {
  /** Event category (e.g., 'purchase', 'signup', 'user_action') */
  category: string;
  /** Custom data associated with the event */
  data: Record<string, any>;
}

/**
 * Initialize custom events plugin
 * 
 * @param debug - Enable debug logging
 * @param appId - Application identifier
 * @param endpoint - Custom endpoint URL (optional)
 */
export function initCustomEvents(debug: boolean = false, appId?: string, endpoint?: string): void {
  
  debugEnabled = debug;
  isInitialized = true;
  
  if (endpoint) {
    customEventsEndpoint = endpoint;
  }
  
  sdkLog(debug, '🎯 [CruxCustom] Custom events plugin initialized', {
    endpoint: customEventsEndpoint,
    appId: appId
  });
}

/**
 * Send custom event data to the custom endpoint
 * 
 * @param eventData - The custom event data to send
 * @private
 */
async function sendToCustomEndpoint(eventData: CustomEventData): Promise<void> {
  try {
    const response = await fetch(customEventsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (debugEnabled) {
      sdkLog(true, '✅ [CruxCustom] Event sent successfully to custom endpoint', {
        category: eventData.category,
        status: response.status
      });
    }

  } catch (error) {
    sdkLog(debugEnabled, '❌ [CruxCustom] Failed to send event to custom endpoint:', error);
    
    if (debugEnabled) {
      sdkLog(true, '❌ [CruxCustom] Custom endpoint error:', {
        error: error instanceof Error ? error.message : String(error),
        endpoint: customEventsEndpoint,
      });
    }
    
    throw error;
  }
}

/**
 * Send a custom event with category and data
 * 
 * @param category - Event category (e.g., 'purchase', 'signup', 'user_action')
 * @param data - Custom data object associated with the event
 * 
 * @example
 * ```typescript
 * // E-commerce tracking
 * cruxstack.trackCustom('purchase', {
 *   productId: 'ABC123',
 *   productName: 'Premium Widget',
 *   amount: 99.99,
 *   currency: 'USD',
 *   quantity: 2
 * });
 * 
 * // User behavior tracking
 * cruxstack.trackCustom('user_signup', {
 *   source: 'homepage',
 *   method: 'email',
 *   userType: 'premium'
 * });
 * 
 * // Feature usage tracking
 * cruxstack.trackCustom('feature_used', {
 *   featureName: 'export_data',
 *   userId: 'user123',
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export async function cruxCustom(category: string, data: Record<string, any>): Promise<void> {
  // Validate inputs
  if (!category || typeof category !== 'string') {
    const err = new CruxSDKError('Category must be a non-empty string', 'custom', { category });
    sdkLog(debugEnabled, '❌ [CruxCustom] ' + err.message, err.details);
    throw err;
  }
  
  if (!data || typeof data !== 'object') {
    const err = new CruxSDKError('Data must be an object', 'custom', { data });
    sdkLog(debugEnabled, '❌ [CruxCustom] ' + err.message, err.details);
    throw err;
  }
  
  // Auto-initialize if not already done
  if (!isInitialized) {
    initCustomEvents(false);
  }

  try {
    // Create custom event data structure
    const customEventData: CustomEventData = {
      category,
      data,
    };
    
    // Log event details if debug is enabled
    if (debugEnabled) {
      sdkLog(true, '🎯 [CruxCustom] Sending custom event:', {
        category,
        endpoint: customEventsEndpoint,
        dataKeys: Object.keys(data),
        dataPreview: Object.keys(data).length > 0 ? Object.keys(data).slice(0, 5) : [],
        fullData: data
      });
    }

    if (isBrowser()) {
      // Send via Snowplow structEvent or self-describing event with category and data
      trackStructEvent({
        category,
        action: 'custom',
        property: JSON.stringify(data), // send all data as a property
      });
      sdkLog(debugEnabled, `✅ [CruxCustom] Custom event '${category}' sent via Snowplow structEvent`);
    } else {
      // Send to custom endpoint
      await sendToCustomEndpoint(customEventData);
      sdkLog(debugEnabled, `✅ [CruxCustom] Custom event '${category}' sent successfully to custom endpoint`);
    }
  } catch (error) {
    sdkLog(debugEnabled, '❌ [CruxCustom] Error sending custom event:', error);
    throw error instanceof CruxSDKError ? error : new CruxSDKError('Error sending custom event', 'custom', { error });
  }
}

/**
 * Set custom endpoint URL for custom events
 * 
 * @param endpoint - Custom endpoint URL
 */
export function setCustomEventsEndpoint(endpoint: string): void {
  if (!endpoint || typeof endpoint !== 'string') {
    console.error('❌ [CruxCustom] Endpoint must be a non-empty string');
    return;
  }
  
  customEventsEndpoint = endpoint;
  sdkLog(debugEnabled, `🎯 [CruxCustom] Custom endpoint updated: ${endpoint}`);
}

/**
 * Enable or disable debug logging for custom events
 * 
 * @param enabled - Whether to enable debug logging
 */
export function setCustomEventsDebug(enabled: boolean): void {
  debugEnabled = enabled;
  sdkLog(enabled, `🎯 [CruxCustom] Debug logging ${enabled ? 'enabled' : 'disabled'}`);
}