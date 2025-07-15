/**
 * Emitter Module
 * 
 * Handles the initialization and configuration of the tracker.
 * This module is responsible for setting up the connection to the collector.
 * Only initializes Snowplow tracker in browser environments.
 */

import { isBrowser } from '../common/environment';
import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';

/**
 * Initialize the tracker with hardcoded collector URL
 * 
 * Sets up the tracker instance with the configured collector endpoint.
 * The collector URL is hardcoded in the SDK for security and consistency.
 * 
 * Only initializes Snowplow tracker in browser environments.
 * In non-browser environments, this function will return early.
 * 
 * @param appId - Application identifier for the tracker
 * @param debug - Enable debug logging
 */
export async function initEmitter(appId: string, debug: boolean): Promise<void> {
  if (!isBrowser()) {
    sdkLog(debug, '⚠️ [Cruxstack] Non-browser environment detected, skipping Snowplow tracker initialization');
    return;
  }
  
  const collectorUrl = 'https://dev-uii.portqii.com/eventCollector';
  
  try {
    const { newTracker } = await import('@snowplow/browser-tracker');
    
    newTracker('sp1', collectorUrl, {
      appId,
      postPath: '/i',
      credentials: 'omit',
      eventMethod: 'post',
      platform: 'web',
    });
    sdkLog(debug, '✅ [Cruxstack] Snowplow tracker initialized');
  } catch (error) {
    if (error instanceof CruxSDKError) {
      throw error;
    }
    throw new CruxSDKError('Failed to initialize Snowplow tracker', 'general', { error });
  }
}
