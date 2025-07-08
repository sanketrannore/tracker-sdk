import type { AutocaptureConfig, AutocaptureEvent, RouteInfo } from '../types/types';
import { EventType } from '../types/types';
import { getCurrentRouteInfo, debounce, debugLog } from '../utils';

/**
 * Page Tracker Module
 * Handles page view tracking and time spent on pages
 * Includes automatic cleanup when users leave pages or close browser tabs
 */

let isPageTrackingEnabled = false;
let pageConfig: AutocaptureConfig = {};

// Page tracking state variables
let lastPageViewTime = 0;
let previousRoute = typeof window !== 'undefined' ? window.location.pathname : '';
let currentPageEntryTime = Date.now();
let currentPagePath = typeof window !== 'undefined' ? window.location.pathname : '';

/**
 * Initialize page tracking with configuration
 * @param config - Autocapture configuration object
 */
export function initPageTracking(config: AutocaptureConfig) {
  pageConfig = config;
  isPageTrackingEnabled = config.pageViews || false;
  
  // Reset tracking state
  lastPageViewTime = 0;
  previousRoute = typeof window !== 'undefined' ? window.location.pathname : '';
  currentPagePath = typeof window !== 'undefined' ? window.location.pathname : '';
  currentPageEntryTime = Date.now();
  
  if (isPageTrackingEnabled) {
    // Add page lifecycle event listeners for cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handlePageUnload);
      window.addEventListener('pagehide', handlePageHide);
    }
    debugLog('Page tracking initialized', config);
  }
}

/**
 * Stop page tracking and remove event listeners
 */
export function stopPageTracking() {
  if (isPageTrackingEnabled) {
    // Track time on current page before stopping
    trackCurrentPageTime();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handlePageUnload);
      window.removeEventListener('pagehide', handlePageHide);
    }
    isPageTrackingEnabled = false;
    debugLog('Page tracking stopped', pageConfig);
  }
}

/**
 * Handle page unload events (when user closes tab/window)
 * Ensures we capture time spent on the current page
 */
function handlePageUnload() {
  if (isPageTrackingEnabled) {
    trackCurrentPageTime();
  }
}

/**
 * Handle page hide events (when user navigates away)
 * Alternative to beforeunload for better browser compatibility
 */
function handlePageHide() {
  if (isPageTrackingEnabled) {
    trackCurrentPageTime();
  }
}

/**
 * Track time spent on the current page
 * Only tracks if user spent more than 1 second on the page
 */
export function trackCurrentPageTime() {
  if (!isPageTrackingEnabled) return;
  
  const now = Date.now();
  const timeSpent = now - currentPageEntryTime;
  
  // Only track if user spent more than 1 second on the page
  if (timeSpent > 1000) {
    const eventData: AutocaptureEvent = {
      type: EventType.PAGE_TIME,
      timestamp: now,
      routeInfo: {
        pathname: currentPagePath,
        timeSpent: timeSpent
      }
    };
    
    dispatchPageEvent(eventData);
    debugLog(`Page time tracked: ${Math.round(timeSpent / 1000)}s on ${currentPagePath}`, pageConfig);
  }
}

/**
 * Debounced page view tracking to prevent excessive events
 * Includes automatic time tracking for the previous page
 */
const debouncedTrackPageView = debounce((routeInfo?: RouteInfo) => {
  if (!isPageTrackingEnabled) return;
  
  const currentRoute = routeInfo || getCurrentRouteInfo();
  const now = Date.now();
  
  // Track time spent on previous page if we're navigating to a different page
  if (currentPagePath !== currentRoute.pathname) {
    trackCurrentPageTime();
  }
  
  // Prevent tracking page views that happen too quickly (within 3 seconds)
  if (now - lastPageViewTime < 3000) {
    debugLog('Page view skipped - too soon after last one', pageConfig);
    return;
  }
  
  // Create page view event data
  const eventData: AutocaptureEvent = {
    type: EventType.PAGE_VIEW,
    timestamp: now,
    routeInfo: {
      pathname: currentRoute.pathname,
      search: currentRoute.search,
      hash: currentRoute.hash,
      previousPath: previousRoute
    }
  };
  
  // Update tracking state
  previousRoute = currentRoute.pathname;
  currentPagePath = currentRoute.pathname;
  currentPageEntryTime = now;
  lastPageViewTime = now;
  
  // Dispatch the event
  dispatchPageEvent(eventData);
  debugLog(`Page view tracked: ${currentRoute.pathname}`, pageConfig);
}, 1000);

/**
 * Public function to track page views
 * Can be called manually or automatically by route change detection
 * @param routeInfo - Optional route information (auto-detected if not provided)
 */
export function trackAutocapturePageView(routeInfo?: RouteInfo) {
  debouncedTrackPageView(routeInfo);
}

/**
 * Dispatch page event to the main autocapture system
 * This function will be overridden by the main autocapture module
 * @param eventData - Page event data
 */
let dispatchPageEvent: (event: AutocaptureEvent) => void = () => {};

/**
 * Set the dispatch function for page events
 * Called by the main autocapture module to establish communication
 * @param dispatchFn - Function to dispatch events
 */
export function setPageEventDispatcher(dispatchFn: (event: AutocaptureEvent) => void) {
  dispatchPageEvent = dispatchFn;
}

/**
 * Check if page tracking is currently enabled
 * @returns boolean indicating if page tracking is active
 */
export function isPageTrackingActive(): boolean {
  return isPageTrackingEnabled;
}

/**
 * Get current page tracking configuration
 * @returns Current page tracking configuration
 */
export function getPageTrackingConfig(): AutocaptureConfig {
  return pageConfig;
}

/**
 * Get current page tracking state
 * Useful for debugging and monitoring
 * @returns Current page tracking state
 */
export function getPageTrackingState() {
  return {
    isEnabled: isPageTrackingEnabled,
    currentPagePath,
    currentPageEntryTime,
    lastPageViewTime,
    previousRoute,
    timeSpentOnCurrentPage: Date.now() - currentPageEntryTime
  };
} 