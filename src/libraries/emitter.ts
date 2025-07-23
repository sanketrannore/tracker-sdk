/**
 * Emitter Module
 * 
 * Handles the initialization and configuration of the tracker.
 * This module is responsible for setting up the connection to the event collector.
 * Only initializes Snowplow tracker in browser environments.
 */

import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';
import { assertBrowserEnv } from '../common/environment';

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
export async function initEmitter(appId: string, debug: boolean, userId: string | undefined): Promise<void> {
  assertBrowserEnv();
  const collectorUrl = 'https://dev-uii.portqii.com/api/v1/events';
  
  try {
    const { newTracker, setUserId } = await import('@snowplow/browser-tracker');
    const sp = newTracker('sp1', collectorUrl, {
      appId,
      postPath: '/',
      credentials: 'omit',
      eventMethod: 'post',
      platform: 'web',
    });

    if (userId) {
      setUserId(userId, ['sp1']);
    }
    // Removed unnecessary log for tracker initialization
  } catch (error) {
    if (error instanceof CruxSDKError) {
      throw error;
    }
    throw new CruxSDKError('Failed to initialize event collector', 'general', { error });
  }
}
