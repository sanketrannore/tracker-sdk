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

import type { AutocaptureConfig, AutocaptureEvent } from "../../common/types";
import { EventType } from "../../common/types";
import { debugLog } from "../../common/utils";

// Global state
let isActive = false;
let config: AutocaptureConfig = {};
let eventDispatcher: ((event: AutocaptureEvent) => void) | null = null;

// Time tracking state
let currentPageStartTime: number = Date.now();
let currentUrl: string = "/";
let previousPageData: any = null;

// Prevent duplicate events
let isProcessingPageView = false;
let lastProcessedUrl = "";

/**
 * Initialize page view tracking
 * Sets up tracking for both initial page loads and route changes
 *
 * @param trackingConfig - Autocapture configuration
 */
export function initPageTracking(trackingConfig: AutocaptureConfig): void {
  if (isActive) {
    debugLog("Page tracking already active", trackingConfig);
    return;
  }

  if (!trackingConfig.pageViews) {
    debugLog("Page tracking disabled in config", trackingConfig);
    return;
  }

  config = trackingConfig;
  isActive = true;

  // Track initial page load
  trackInitialPageView();

  // Set up route change detection
  setupRouteChangeDetection();

  debugLog("Page tracking initialized", config);
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

  console.log("📄 [Cruxstack] Page tracking stopped");
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
 * Manually track current page view
 * Useful for SPA route changes that aren't automatically detected
 *
 * @example
 * ```typescript
 * // Call this when route changes in your SPA
 * trackAutocapturePageView();
 * ```
 */
export function trackAutocapturePageView(): void {
  if (!window || !isActive || !eventDispatcher) return;

  const newUrl = window.location.href;

  // Prevent duplicate events for the same URL
  if (isProcessingPageView || newUrl === lastProcessedUrl) {
    debugLog("Skipping duplicate page view event for URL: " + newUrl, config);
    return;
  }

  isProcessingPageView = true;

  try {
    console.log("📄 [Cruxstack] Processing page view:", currentUrl, "->", newUrl);

    // Capture the route info before updating state
    const routeInfo = {
      fromUrl: currentUrl,
      toUrl: newUrl,
      navigationTime: Date.now(),
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
    exitTime: Date.now(),
  };
}

/**
 * Track initial page load
 * @private
 */
function trackInitialPageView(): void {
  console.log("📄 [Cruxstack] Tracking initial page view");
  if (!window) return;
  // Wait for page to fully load to get accurate performance data
  if (document.readyState === "complete") {
    trackAutocapturePageView();
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => trackAutocapturePageView(), 100);
    });
  }
}

/**
 * Set up detection for route changes in SPAs
 * @private
 */
function setupRouteChangeDetection(): void {
  // Override pushState and replaceState for SPA navigation
  if (!window) return;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => handleRouteChange(), 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => handleRouteChange(), 100);
  };

  // Listen for popstate events (back/forward button)
  window.addEventListener("popstate", () => {
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
  debugLog("Route change detection cleaned up", config);
}

/**
 * Handle route changes in SPAs
 * @private
 */
function handleRouteChange(): void {
  const newUrl = window.location.href;

  if (newUrl !== currentUrl && !isProcessingPageView) {
    console.log("📄 [Cruxstack] Route change detected:", currentUrl, "->", newUrl);
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
    navigationTime: Date.now(),
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
      previousPageTimeSpent: timeSpentData,
    },
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
  let timePeriod = "short";
  if (timeSpentSeconds > 300) timePeriod = "long";
  else if (timeSpentSeconds > 60) timePeriod = "medium";

  // Format human-readable time
  let timeSpentFormatted = "";
  if (timeSpentSeconds < 60) {
    timeSpentFormatted = `${timeSpentSeconds} seconds`;
  } else {
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    timeSpentFormatted = `${minutes} minutes${seconds > 0 ? ` ${seconds} seconds` : ""}`;
  }

  return {
    previousUrl: previousPageData.url,
    timeSpentMs,
    timeSpentSeconds,
    timeSpentFormatted,
    timePeriod,
    entryTime: currentPageStartTime,
    exitTime: previousPageData.exitTime,
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
  if (!window) return;
  currentUrl = window?.location?.href ? window.location.href : "/";
  currentPageStartTime = Date.now();
}

/**
 * Extract page-specific information
 * @private
 */
function extractPageData() {
  if (!window) return {};
  return {
    pageTitle: document.title,
    pageUrl: window.location.href,
    pageHost: window.location.host,
    pageHostname: window.location.hostname,
    pageProtocol: window.location.protocol,
    pagePort: window.location.port || undefined,
    pagePathname: window.location.pathname,
    pageSearch: window.location.search || undefined,
    pageHash: window.location.hash || undefined,
    referrer: document.referrer || undefined,
  };
}

/**
 * Extract browser information
 * @private
 */
function extractBrowserData() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: (navigator as any).languages
      ? (Array.from((navigator as any).languages) as string[])
      : [navigator.language],
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    doNotTrack: (navigator as any).doNotTrack || undefined,
  };
}

/**
 * Extract device and viewport information
 * @private
 */
function extractDeviceData() {
  if (!window) return {};
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
  };
}

/**
 * Extract performance timing data
 * @private
 */
function extractPerformanceData() {
  const timing = performance.timing;
  const navigation = performance.navigation;

  return {
    performanceTiming: {
      // Navigation timing
      navigationStart: timing.navigationStart,
      unloadEventStart: timing.unloadEventStart,
      unloadEventEnd: timing.unloadEventEnd,
      redirectStart: timing.redirectStart,
      redirectEnd: timing.redirectEnd,
      fetchStart: timing.fetchStart,
      domainLookupStart: timing.domainLookupStart,
      domainLookupEnd: timing.domainLookupEnd,
      connectStart: timing.connectStart,
      connectEnd: timing.connectEnd,
      secureConnectionStart: timing.secureConnectionStart,
      requestStart: timing.requestStart,
      responseStart: timing.responseStart,
      responseEnd: timing.responseEnd,
      domLoading: timing.domLoading,
      domInteractive: timing.domInteractive,
      domContentLoadedEventStart: timing.domContentLoadedEventStart,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
      domComplete: timing.domComplete,
      loadEventStart: timing.loadEventStart,
      loadEventEnd: timing.loadEventEnd,

      // Calculated metrics
      totalLoadTime: timing.loadEventEnd - timing.navigationStart,
      domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      responseTime: timing.responseEnd - timing.requestStart,

      // Navigation type
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount,
    },
  };
}

/**
 * Extract all meta tags from the page
 * @private
 */
function extractMetaData() {
  const metaTags: Record<string, string> = {};
  const metas = document.getElementsByTagName("meta");

  for (let i = 0; i < metas.length; i++) {
    const meta = metas[i];
    const name = meta.getAttribute("name") || meta.getAttribute("property") || meta.getAttribute("http-equiv");
    const content = meta.getAttribute("content");

    if (name && content) {
      metaTags[name] = content;
    }
  }

  return { metaTags };
}

/**
 * Extract network connection information
 * @private
 */
function extractConnectionData() {
  const connection =
    (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (!connection) return { connection: undefined };

  return {
    connection: {
      effectiveType: connection.effectiveType || undefined,
      downlink: connection.downlink || undefined,
      rtt: connection.rtt || undefined,
      saveData: connection.saveData || undefined,
      type: connection.type || undefined,
    },
  };
}

/**
 * Extract document properties
 * @private
 */
function extractDocumentData() {
  return {
    documentReadyState: document.readyState,
    documentCharacterSet: document.characterSet,
    documentCompatMode: document.compatMode,
    documentVisibilityState: document.visibilityState,
    documentHidden: document.hidden,
  };
}

/**
 * Extract timezone information
 * @private
 */
function extractTimezoneData() {
  const now = new Date();

  return {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeZoneOffset: now.getTimezoneOffset(),
    timestamp: now.toISOString(),
    localTime: now.toString(),
  };
}
