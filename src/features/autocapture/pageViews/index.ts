import { handleInitialPageView, handleSPANavigation } from './handlers';
import { PageViewEventData } from './types';

export type PageViewTracker = (data: PageViewEventData) => void;

let currentPath = window.location.pathname;
let currentHash = window.location.hash;

export const setupPageViewCapture = (trackEvent: PageViewTracker): (() => void) => {
  // Track initial page view
  const initialPageView = handleInitialPageView();
  if (initialPageView) {
    trackEvent(initialPageView);
  }
  
  // Handle browser back/forward navigation
  const handlePopState = () => {
    const pageView = handleSPANavigation('popstate');
    if (pageView) {
      trackEvent(pageView);
    }
    currentPath = window.location.pathname;
    currentHash = window.location.hash;
  };
  
  // Handle hash changes (for hash-based routing)
  const handleHashChange = () => {
    const pageView = handleSPANavigation('hashchange');
    if (pageView) {
      trackEvent(pageView);
    }
    currentHash = window.location.hash;
  };
  
  // Override history.pushState for SPA navigation detection
  const originalPushState = history.pushState;
  const pushStateHandler = function(this: History, ...args: Parameters<History['pushState']>) {
    const result = originalPushState.apply(this, args);
    
    // Check if the path actually changed
    if (window.location.pathname !== currentPath) {
      setTimeout(() => {
        const pageView = handleSPANavigation('pushstate');
        if (pageView) {
          trackEvent(pageView);
        }
        currentPath = window.location.pathname;
      }, 0); // Use setTimeout to ensure DOM updates are complete
    }
    
    return result;
  };
  
  // Override history.replaceState for SPA navigation detection
  const originalReplaceState = history.replaceState;
  const replaceStateHandler = function(this: History, ...args: Parameters<History['replaceState']>) {
    const result = originalReplaceState.apply(this, args);
    
    // Check if the path actually changed
    if (window.location.pathname !== currentPath) {
      setTimeout(() => {
        const pageView = handleSPANavigation('replacestate');
        if (pageView) {
          trackEvent(pageView);
        }
        currentPath = window.location.pathname;
      }, 0);
    }
    
    return result;
  };
  
  // Apply history overrides
  history.pushState = pushStateHandler;
  history.replaceState = replaceStateHandler;
  
  // Add event listeners
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('hashchange', handleHashChange);
  
  // Return cleanup function
  return () => {
    // Restore original history methods
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    
    // Remove event listeners
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('hashchange', handleHashChange);
  };
}; 