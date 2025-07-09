/**
 * Environment Detection and Safe Browser API Wrappers
 * 
 * Provides environment-safe access to browser APIs with Node.js fallbacks
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
 * Detect if we're running in Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

/**
 * Safe browser API wrappers with Node.js fallbacks
 */
export const SafeBrowser = {
  // Window-related APIs
  getLocation: () => {
    if (!isBrowser()) {
      return {
        href: 'http://localhost:3000',
        host: 'localhost:3000',
        hostname: 'localhost',
        protocol: 'http:',
        port: '3000',
        pathname: '/',
        search: '',
        hash: ''
      };
    }
    return window.location;
  },

  getViewport: () => {
    if (!isBrowser()) {
      return {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        screenWidth: 1920,
        screenHeight: 1080,
        colorDepth: 24,
        pixelDepth: 24,
        devicePixelRatio: 1
      };
    }
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
    if (!isBrowser()) {
      return {
        title: 'Node.js Application',
        characterSet: 'UTF-8',
        compatMode: 'CSS1Compat',
        visibilityState: 'visible',
        hidden: false,
        readyState: 'complete',
        referrer: ''
      };
    }
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
    if (!isBrowser()) {
      return {};
    }
    
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
    if (!isBrowser()) {
      return {
        userAgent: 'Node.js/18.0.0 (linux; x64)',
        language: 'en-US',
        languages: ['en-US', 'en'],
        platform: process?.platform || 'linux',
        cookieEnabled: false,
        onLine: true,
        doNotTrack: undefined
      };
    }
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
    if (!isBrowser()) {
      // Return mock performance data for Node.js
      const now = Date.now();
      return {
        navigationStart: now - 1000,
        unloadEventStart: 0,
        unloadEventEnd: 0,
        redirectStart: 0,
        redirectEnd: 0,
        fetchStart: now - 800,
        domainLookupStart: now - 750,
        domainLookupEnd: now - 700,
        connectStart: now - 650,
        connectEnd: now - 600,
        secureConnectionStart: now - 580,
        requestStart: now - 500,
        responseStart: now - 300,
        responseEnd: now - 200,
        domLoading: now - 150,
        domInteractive: now - 100,
        domContentLoadedEventStart: now - 80,
        domContentLoadedEventEnd: now - 70,
        domComplete: now - 50,
        loadEventStart: now - 30,
        loadEventEnd: now - 10,
        totalLoadTime: 990,
        domReadyTime: 920,
        responseTime: 200,
        navigationType: 0,
        redirectCount: 0
      };
    }
    
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
    if (!isBrowser()) {
      return undefined;
    }
    
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
    const now = new Date();
    
    return {
      timeZone: isBrowser() ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      timeZoneOffset: now.getTimezoneOffset(),
      timestamp: now.toISOString(),
      localTime: now.toString()
    };
  },

  // Event listener management
  addEventListener: (event: string, handler: EventListener, options?: any) => {
    if (isBrowser()) {
      document.addEventListener(event, handler, options);
    }
  },

  removeEventListener: (event: string, handler: EventListener, options?: any) => {
    if (isBrowser()) {
      document.removeEventListener(event, handler, options);
    }
  },

  // History API
  getHistory: () => {
    if (!isBrowser()) {
      return {
        pushState: () => {},
        replaceState: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      };
    }
    return history;
  },

  // Window event management
  addWindowEventListener: (event: string, handler: EventListener, options?: any) => {
    if (isBrowser()) {
      window.addEventListener(event, handler, options);
    }
  },

  removeWindowEventListener: (event: string, handler: EventListener, options?: any) => {
    if (isBrowser()) {
      window.removeEventListener(event, handler, options);
    }
  },

  // Get current timestamp
  now: () => Date.now(),

  // Check if environment supports specific features
  supportsPageTracking: () => isBrowser(),
  supportsClickTracking: () => isBrowser(),
  supportsHistoryAPI: () => isBrowser() && typeof history !== 'undefined'
};

/**
 * Log environment info
 */
export function logEnvironmentInfo(): void {
  if (isBrowser()) {
    console.log('🌐 [Cruxstack] Running in Browser Environment');
  } else if (isNode()) {
    console.log('🟢 [Cruxstack] Running in Node.js Environment');
  } else {
    console.log('❓ [Cruxstack] Running in Unknown Environment');
  }
} 