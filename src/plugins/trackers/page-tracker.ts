/**
 * Page View Tracker
 * 
 * Automatically captures page view events with comprehensive data including:
 * - Page information (title, URL, host, protocol, referrer)
 * - Browser and device data (user agent, language, platform, viewport, screen)
 * - Performance metrics (complete navigation timing API data)
 * - Meta tags (all page meta tags)
 * - Network connection information
 * - Document properties and timezone
 * - Time tracking (time spent on previous page with formatted periods)
 * 
 * Supports both initial page loads and route changes in SPAs.
 */

import { SafeBrowser } from '../../common/environment';
import type { AutocaptureConfig, AutocaptureEvent } from '../../common/types';
import { EventType } from '../../common/types';
import { sdkLog } from '../../common/utils';
import { CruxSDKError } from '../../common/errors';

// Global state
let isActive = false;
let config: AutocaptureConfig = {};
let eventDispatcher: ((event: AutocaptureEvent) => void) | null = null;

// Time tracking state
let currentPageStartTime: number = Date.now();
let currentUrl: string = ''; // Initialize as empty string, set during init
let previousPageData: any = null;

// Prevent duplicate events
let isProcessingPageView = false;
let lastProcessedUrl = '';

/**
 * Initialize page view tracking
 * Sets up tracking for both initial page loads and route changes
 * 
 * @param trackingConfig - Autocapture configuration
 */
export function initPageTracking(trackingConfig: AutocaptureConfig): void {
  if (isActive) {
    sdkLog(false, 'Page tracking already active', trackingConfig);
    return;
  }

  config = trackingConfig;
  isActive = true;
  
  // Initialize currentUrl when tracker is actually started (browser environment guaranteed)
  currentUrl = SafeBrowser.getLocation().href;
  
  // Track initial page load
  trackInitialPageView();
  
  // Set up route change detection
  setupRouteChangeDetection();
  
  sdkLog(false, 'Page tracking initialized', config);
}

/**
 * Stop page view tracking
 * Removes event listeners and cleans up
 */
export function stopPageTracking(): void {
  if (!isActive) return;
  
  // Record time spent on current page before stopping
  trackCurrentPageTime();
  
  // Clean up route change listeners
  cleanupRouteChangeDetection();
  
  isActive = false;
  eventDispatcher = null;
  
  sdkLog(false, '📄 [Cruxstack] Page tracking stopped');
}

/**
 * Set the event dispatcher function
 * This function will be called when page views are captured
 * 
 * @param dispatcher - Function to handle captured events
 */
export function setPageEventDispatcher(dispatcher: (event: AutocaptureEvent) => void): void {
  eventDispatcher = dispatcher;
}

/**
 * Check if page tracking is currently active
 * 
 * @returns True if tracking is active
 */
export function isPageTrackingActive(): boolean {
  return isActive;
}

/**
 * Track current page view (internal use only)
 * @private
 */
function trackAutocapturePageView(): void {
  if (!isActive || !eventDispatcher) return;
  
  const newUrl = SafeBrowser.getLocation().href;
  
  // Prevent duplicate events for the same URL
  if (isProcessingPageView || newUrl === lastProcessedUrl) {
    sdkLog(false, 'Skipping duplicate page view event for URL: ' + newUrl, config);
    return;
  }
  
  isProcessingPageView = true;
  
  try {
    sdkLog(false, '📄 [Cruxstack] Processing page view:', currentUrl, '->', newUrl);
    
    // Capture the route info before updating state
    const routeInfo = {
      fromUrl: currentUrl,
      toUrl: newUrl,
      navigationTime: Date.now()
    };
    
    // First: Update previousPageData for the page we're leaving
    trackCurrentPageTime();
    
    // Second: Calculate time spent using the updated previousPageData
    const timeSpentData = calculateTimeSpent();
    
    // Third: Update state for new page (currentUrl and start time)
    updatePageStateForNewPage();
    
    // Create comprehensive page view event with captured route info
    const pageViewEvent = createPageViewEventWithRouteInfo(timeSpentData, routeInfo);
    
    // Update last processed URL
    lastProcessedUrl = newUrl;
    
    // Dispatch the event
    eventDispatcher(pageViewEvent);
    
  } catch (error) {
    if (error instanceof CruxSDKError) {
      sdkLog(false, 'Error capturing page view event:', error.message, error.details);
    } else {
      sdkLog(false, 'Error capturing page view event:', error);
    }
  } finally {
    // Always reset the processing flag
    setTimeout(() => {
      isProcessingPageView = false;
    }, 50);
  }
}

/**
 * Track time spent on current page and update state
 * Called when leaving a page or stopping tracking
 */
export function trackCurrentPageTime(): void {
  previousPageData = {
    url: currentUrl,
    timeSpent: Date.now() - currentPageStartTime,
    exitTime: Date.now()
  };
}

/**
 * Track initial page load
 * @private
 */
function trackInitialPageView(): void {
  sdkLog(false, '📄 [Cruxstack] Tracking initial page view');
  
  // Wait for page to fully load to get accurate performance data
  if (document.readyState === 'complete') {
    trackAutocapturePageView();
  } else {
    SafeBrowser.addWindowEventListener('load', () => {
      setTimeout(() => trackAutocapturePageView(), 100);
    });
  }
}

/**
 * Set up detection for route changes in SPAs
 * @private
 */
function setupRouteChangeDetection(): void {
  // Check if History API is available
  if (typeof history === 'undefined') {
    sdkLog(false, 'History API not supported, skipping route change detection', config);
    return;
  }

  // Override pushState and replaceState for SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(data: any, unused: string, url?: string | URL | null) {
    originalPushState.call(history, data, unused, url);
    setTimeout(() => handleRouteChange(), 100);
  };
  
  history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
    originalReplaceState.call(history, data, unused, url);
    setTimeout(() => handleRouteChange(), 100);
  };
  
  // Listen for popstate events (back/forward button)
  SafeBrowser.addWindowEventListener('popstate', () => {
    setTimeout(() => handleRouteChange(), 100);
  });
}

/**
 * Clean up route change detection
 * @private
 */
function cleanupRouteChangeDetection(): void {
  // Restore original history methods would require storing references
  // For now, just log cleanup
  sdkLog(false, 'Route change detection cleaned up', config);
}

/**
 * Handle route changes in SPAs
 * @private
 */
function handleRouteChange(): void {
  const newUrl = SafeBrowser.getLocation().href;
  
  if (newUrl !== currentUrl && !isProcessingPageView) {
    sdkLog(false, '📄 [Cruxstack] Route change detected:', currentUrl, '->', newUrl);
    trackAutocapturePageView();
  }
}

/**
 * Create comprehensive page view event with all captured data
 * @private
 */
function createPageViewEvent(timeSpentData: any): AutocaptureEvent {
  const routeInfo = {
    fromUrl: currentUrl,
    toUrl: window.location.href,
    navigationTime: Date.now()
  };
  
  return createPageViewEventWithRouteInfo(timeSpentData, routeInfo);
}

/**
 * Create comprehensive page view event with provided route info
 * @private
 */
function createPageViewEventWithRouteInfo(timeSpentData: any, routeInfo: any): AutocaptureEvent {
  const pageData = extractPageData();
  const browserData = extractBrowserData();
  const deviceData = extractDeviceData();
  const performanceData = extractPerformanceData();
  const metaData = extractMetaData();
  const connectionData = extractConnectionData();
  const documentData = extractDocumentData();
  const timezoneData = extractTimezoneData();
  
  return {
    type: EventType.PAGE_VIEW,
    timestamp: Date.now(),
    routeInfo,
    eventData: {
      // Page information
      ...pageData,
      
      // Browser and device information
      ...browserData,
      ...deviceData,
      
      // Performance metrics
      ...performanceData,
      
      // Meta tags and document info
      ...metaData,
      ...documentData,
      
      // Network and timezone
      ...connectionData,
      ...timezoneData,
      
      // Time spent on previous page
      previousPageTimeSpent: timeSpentData
    }
  };
}

/**
 * Calculate time spent on previous page with formatted output
 * @private
 */
function calculateTimeSpent(): any {
  if (!previousPageData) return null;
  
  const timeSpentMs = previousPageData.timeSpent;
  const timeSpentSeconds = Math.round(timeSpentMs / 1000);
  
  // Format time period
  let timePeriod = 'short';
  if (timeSpentSeconds > 300) timePeriod = 'long';
  else if (timeSpentSeconds > 60) timePeriod = 'medium';
  
  // Format human-readable time
  let timeSpentFormatted = '';
  if (timeSpentSeconds < 60) {
    timeSpentFormatted = `${timeSpentSeconds} seconds`;
  } else {
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    timeSpentFormatted = `${minutes} minutes${seconds > 0 ? ` ${seconds} seconds` : ''}`;
  }
  
  return {
    previousUrl: previousPageData.url,
    timeSpentMs,
    timeSpentSeconds,
    timeSpentFormatted,
    timePeriod,
    entryTime: currentPageStartTime,
    exitTime: previousPageData.exitTime
  };
}

/**
 * Update page tracking state for new page
 * @private
 */
function updatePageTrackingState(): void {
  // Store previous page data
  trackCurrentPageTime();
  
  // Update state for new page
  updatePageStateForNewPage();
}

/**
 * Update just the page state without touching previousPageData
 * @private
 */
function updatePageStateForNewPage(): void {
  currentUrl = SafeBrowser.getLocation().href;
  currentPageStartTime = Date.now();
}

/**
 * Extract page-specific information
 * @private
 */
function extractPageData() {
  const location = SafeBrowser.getLocation();
  const doc = SafeBrowser.getDocument();
  
  return {
    pageTitle: doc.title,
    pageUrl: location.href,
    pageHost: location.host,
    pageHostname: location.hostname,
    pageProtocol: location.protocol,
    pagePort: location.port || undefined,
    pagePathname: location.pathname,
    pageSearch: location.search || undefined,
    pageHash: location.hash || undefined,
    referrer: doc.referrer || undefined
  };
}

/**
 * Extract browser information
 * @private
 */
function extractBrowserData() {
  const nav = SafeBrowser.getNavigator();
  
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    languages: nav.languages,
    platform: nav.platform,
    cookieEnabled: nav.cookieEnabled,
    onLine: nav.onLine,
    doNotTrack: nav.doNotTrack
  };
}

/**
 * Extract device and viewport information
 * @private
 */
function extractDeviceData() {
  return {
    viewport: SafeBrowser.getViewport()
  };
}

/**
 * Extract performance timing data
 * @private
 */
function extractPerformanceData() {
  return {
    performanceTiming: SafeBrowser.getPerformanceTiming()
  };
}

/**
 * Extract all meta tags from the page
 * @private
 */
function extractMetaData() {
  return { 
    metaTags: SafeBrowser.getMetaTags() 
  };
}

/**
 * Extract network connection information
 * @private
 */
function extractConnectionData() {
  return {
    connection: SafeBrowser.getConnection()
  };
}

/**
 * Extract document properties
 * @private
 */
function extractDocumentData() {
  const doc = SafeBrowser.getDocument();
  
  return {
    documentReadyState: doc.readyState,
    documentCharacterSet: doc.characterSet,
    documentCompatMode: doc.compatMode,
    documentVisibilityState: doc.visibilityState,
    documentHidden: doc.hidden
  };
}

/**
 * Extract timezone information
 * @private
 */
function extractTimezoneData() {
  return SafeBrowser.getTimezone();
} 