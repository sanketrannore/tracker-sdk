import { PageViewEventData } from './types';
import { getCommonProperties } from '../common/enrichment';
import { cleanEventData } from '../common/privacy';

// Session tracking
let sessionStartTime = Date.now();
let pageViewCount = 0;
let lastPageUrl: string | null = null;
let lastPageTime: number | null = null;
let isFirstPageInSession = true;

// Get performance metrics
const getPerformanceMetrics = (): PageViewEventData['performance'] => {
  const timing = performance.timing;
  const navigation = performance.navigation;
  const paintEntries = performance.getEntriesByType('paint');
  
  // Calculate load times
  const loadTime = timing.loadEventEnd > 0 && timing.navigationStart > 0 ? 
    timing.loadEventEnd - timing.navigationStart : null;
  
  const domContentLoaded = timing.domContentLoadedEventEnd > 0 && timing.navigationStart > 0 ?
    timing.domContentLoadedEventEnd - timing.navigationStart : null;
  
  // Get paint metrics
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || null;
  const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || null;
  
  // Get connection info
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionType = connection ? connection.effectiveType || connection.type : null;
  
  return {
    loadTime,
    domContentLoaded,
    firstPaint,
    firstContentfulPaint,
    connectionType
  };
};

// Analyze page content
const analyzePageContent = (): PageViewEventData['content'] => {
  const body = document.body;
  
  return {
    characterCount: body.textContent?.length || 0,
    imageCount: document.querySelectorAll('img').length,
    linkCount: document.querySelectorAll('a[href]').length,
    formCount: document.querySelectorAll('form').length,
    scriptCount: document.querySelectorAll('script').length,
    hasVideo: document.querySelectorAll('video').length > 0,
    hasAudio: document.querySelectorAll('audio').length > 0
  };
};

// Get navigation type from performance API
const getNavigationType = (): PageViewEventData['navigation']['type'] => {
  if (performance.navigation) {
    switch (performance.navigation.type) {
      case 0: return 'navigate';
      case 1: return 'reload';
      case 2: return 'back_forward';
      default: return 'navigate';
    }
  }
  return 'navigate';
};

// Generate page view data
export const generatePageViewData = (
  triggeredBy: PageViewEventData['navigation']['triggeredBy'],
  isSPA: boolean = false
): PageViewEventData | null => {
  const now = Date.now();
  const currentUrl = window.location.href;
  
  // Calculate time on previous page
  const timeOnPreviousPage = lastPageTime ? now - lastPageTime : null;
  
  // Update tracking variables
  pageViewCount++;
  const wasFirstPage = isFirstPageInSession;
  isFirstPageInSession = false;
  
  // Build page view data
  const pageViewData: Partial<PageViewEventData> = {
    page: {
      title: document.title,
      url: currentUrl,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer || null
    },
    
    navigation: {
      type: isSPA ? 'spa' : getNavigationType(),
      isSPA,
      previousUrl: lastPageUrl,
      triggeredBy
    },
    
    performance: getPerformanceMetrics(),
    
    session: {
      isFirstPageInSession: wasFirstPage,
      pageViewCount,
      timeOnPreviousPage
    },
    
    timing: {
      sessionDuration: now - sessionStartTime,
      timeToPageView: now - sessionStartTime
    }
  };
  
  // Update state for next page view
  lastPageUrl = currentUrl;
  lastPageTime = now;
  
  // Merge with common properties
  const fullData = {
    ...getCommonProperties(),
    ...pageViewData
  } as PageViewEventData;
  
  // Clean sensitive data
  return cleanEventData(fullData) as PageViewEventData;
};

// Handle different types of navigation
export const handleInitialPageView = (): PageViewEventData | null => {
  return generatePageViewData('initial', false);
};

export const handleSPANavigation = (triggeredBy: 'pushstate' | 'replacestate' | 'popstate' | 'hashchange'): PageViewEventData | null => {
  return generatePageViewData(triggeredBy, true);
};

// Reset session tracking (useful for testing or manual session management)
export const resetSessionTracking = (): void => {
  sessionStartTime = Date.now();
  pageViewCount = 0;
  lastPageUrl = null;
  lastPageTime = null;
  isFirstPageInSession = true;
}; 