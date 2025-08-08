import { PageViewEventData } from './types';
import { cleanEventData } from '../common/privacy';

// Session tracking
let sessionStartTime = Date.now();
let pageViewCount = 0;
let lastPageUrl: string | null = null;
let lastPageTime: number | null = null;
let isFirstPageInSession = true;
let maxScrollDepthPercent = 0;

// (Performance, content, and navigation details are handled in the top-level envelope; ev keeps only session/timing/scroll)

// Generate page view data
export const generatePageViewData = (
  triggeredBy: 'initial' | 'popstate' | 'pushstate' | 'replacestate' | 'hashchange',
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
    // Only include event-specific portions; common env fields are moved to envelope
    session: {
      isFirstPageInSession: wasFirstPage,
      pageViewCount,
      timeOnPreviousPage
    },
    
    timing: {
      sessionDuration: now - sessionStartTime,
      timeToPageView: now - sessionStartTime
    },
    scrollDepthPercent: Math.min(100, Math.max(0, Math.round(maxScrollDepthPercent)))
  };
  
  // Update state for next page view
  lastPageUrl = currentUrl;
  lastPageTime = now;
  
  // Merge with common properties
  // Clean sensitive data (only event-specific payload)
  return cleanEventData(pageViewData as Record<string, any>) as PageViewEventData;
};

// Handle different types of navigation
export const handleInitialPageView = (): PageViewEventData | null => {
  // Setup scroll tracking on initial page load
  setupScrollDepthTracking();
  return generatePageViewData('initial', false);
};

export const handleSPANavigation = (triggeredBy: 'pushstate' | 'replacestate' | 'popstate' | 'hashchange'): PageViewEventData | null => {
  // Reset scroll depth tracking for new SPA page
  resetScrollDepthTracking();
  setupScrollDepthTracking();
  return generatePageViewData(triggeredBy, true);
};

// Reset session tracking (useful for testing or manual session management)
export const resetSessionTracking = (): void => {
  sessionStartTime = Date.now();
  pageViewCount = 0;
  lastPageUrl = null;
  lastPageTime = null;
  isFirstPageInSession = true;
  resetScrollDepthTracking();
}; 

// Scroll depth tracking utilities
function setupScrollDepthTracking(): void {
  maxScrollDepthPercent = 0;
  const onScroll = () => {
    try {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      const maxScrollable = Math.max(1, docHeight - viewportHeight);
      const currentDepth = Math.round(((scrollTop + viewportHeight) / maxScrollable) * 100);
      if (currentDepth > maxScrollDepthPercent) {
        maxScrollDepthPercent = currentDepth;
      }
    } catch {}
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // Store handler for potential future removal if needed (not strictly necessary as we keep it during session)
}

function resetScrollDepthTracking(): void {
  maxScrollDepthPercent = 0;
}