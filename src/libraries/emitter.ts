/**
 * Emitter Module
 * 
 * Handles the initialization and configuration of the tracker.
 * This module is responsible for setting up the connection to the collector.
 */

import { newTracker } from '@snowplow/browser-tracker';
import { isBrowser } from '../common/environment';
import { sdkLog } from '../common/utils';
import { CruxSDKError } from '../common/errors';

/**
 * Initialize the tracker with hardcoded collector URL
 * 
 * Sets up the tracker instance with the configured collector endpoint.
 * The collector URL is hardcoded in the SDK for security and consistency.
 * 
 * @param appId - Application identifier for the tracker
 * @param debug - Enable debug logging
 */
export async function initEmitter(appId: string, debug: boolean): Promise<void> {
  // if (!isBrowser()) {
  //   throw new CruxSDKError('Browser environment required for tracker initialization', 'general');
  // }
  
  const collectorUrl = 'https://dev-uii.portqii.com/eventCollector';
  
  try {
    newTracker('sp1', collectorUrl, {
      appId,
      postPath: '/i',
      credentials: 'omit',
      eventMethod: 'post',
      platform: 'web',
    });
    sdkLog(debug, '✅ [Cruxstack] tracker initialized');
  } catch (error) {
    if (error instanceof CruxSDKError) {
      throw error;
    }
    throw new CruxSDKError('Failed to initialize tracker', 'general', { error });
  }
}
