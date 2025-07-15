/**
 * Emitter Module
 * 
 * Handles the initialization and configuration of the tracker.
 * This module is responsible for setting up the connection to the collector.
 */

import { newTracker } from '@snowplow/browser-tracker';
import { isBrowser } from '../common/environment';
import { sdkLog } from '../common/utils';

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
  if (!isBrowser()) {
    throw new Error('Browser environment required for tracker initialization');
  }
  
  const collectorUrl = 'https://dev-uii.portqii.com/eventCollector';
  
  newTracker('sp1', collectorUrl, {
    appId,
    postPath: '/i',
    credentials: 'omit',
    eventMethod: 'get',
    platform: 'web',
  });
  
  sdkLog(debug, '✅ [Cruxstack] tracker initialized');
}
