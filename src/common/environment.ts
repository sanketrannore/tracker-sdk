/**
 * Environment Detection and Browser API Wrappers
 * 
 * Provides browser-only access to browser APIs.
 * If not in browser environment, functions will return early or throw errors.
 */

/**
 * Detect if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof navigator !== 'undefined';
}

/**
 * Throws an error if not in a browser environment
 */
export function assertBrowserEnv(): void {
  if (!isBrowser()) {
    throw new Error('This Cruxstack SDK can only be used in a browser environment. Check out the Node SDK here: https://github.com/sanketrannore/node-tracker-sdk');
  }
}

/**
 * Browser API wrappers - browser only
 */
export const SafeBrowser = {
  // Window-related APIs
  getLocation: () => {
    assertBrowserEnv();
    return window.location;
  },

  getViewport: () => {
    assertBrowserEnv();
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  },

  // Document-related APIs
  getDocument: () => {
    assertBrowserEnv();
    return {
      title: document.title,
      characterSet: document.characterSet,
      compatMode: document.compatMode,
      visibilityState: document.visibilityState,
      hidden: document.hidden,
      readyState: document.readyState,
      referrer: document.referrer
    };
  },

  getMetaTags: () => {
    assertBrowserEnv();
    
    const metaTags: Record<string, string> = {};
    const metas = document.getElementsByTagName('meta');
    
    for (let i = 0; i < metas.length; i++) {
      const meta = metas[i];
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
      const content = meta.getAttribute('content');
      
      if (name && content) {
        metaTags[name] = content;
      }
    }
    
    return metaTags;
  },

  // Navigator-related APIs
  getNavigator: () => {
    assertBrowserEnv();
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: (navigator as any).languages ? Array.from((navigator as any).languages) as string[] : [navigator.language],
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: (navigator as any).doNotTrack || undefined
    };
  },

  // Performance APIs
  getPerformanceTiming: () => {
    assertBrowserEnv();
    
    const timing = performance.timing;
    const navigation = performance.navigation;
    
    return {
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
      totalLoadTime: timing.loadEventEnd - timing.navigationStart,
      domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      responseTime: timing.responseEnd - timing.requestStart,
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount
    };
  },

  // Network connection API
  getConnection: () => {
    assertBrowserEnv();
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) return undefined;
    
    return {
      effectiveType: connection.effectiveType || undefined,
      downlink: connection.downlink || undefined,
      rtt: connection.rtt || undefined,
      saveData: connection.saveData || undefined,
      type: connection.type || undefined
    };
  },

  // Timezone information
  getTimezone: () => {
    assertBrowserEnv();
    
    const now = new Date();
    
    return {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeZoneOffset: now.getTimezoneOffset(),
      timestamp: now.toISOString(),
      localTime: now.toString()
    };
  },

  // Event listener management
  addEventListener: (event: string, handler: EventListener, options?: any) => {
    assertBrowserEnv();
    document.addEventListener(event, handler, options);
  },

  removeEventListener: (event: string, handler: EventListener, options?: any) => {
    assertBrowserEnv();
    document.removeEventListener(event, handler, options);
  },

  // History API
  getHistory: () => {
    assertBrowserEnv();
    return history;
  },

  // Window event management
  addWindowEventListener: (event: string, handler: EventListener, options?: any) => {
    assertBrowserEnv();
    window.addEventListener(event, handler, options);
  },

  removeWindowEventListener: (event: string, handler: EventListener, options?: any) => {
    assertBrowserEnv();
    window.removeEventListener(event, handler, options);
  },

  // Get current timestamp
  now: () => Date.now(),

  // Check if environment supports specific features
  supportsPageTracking: () => true,
  supportsClickTracking: () => true,
  supportsHistoryAPI: () => true
};