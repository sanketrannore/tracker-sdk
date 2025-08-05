export interface PageViewEventData {
  // Page information
  page: {
    title: string;
    url: string;
    pathname: string;
    search: string;
    hash: string;
    referrer: string | null;
  };
  
  // Navigation details
  navigation: {
    type: 'navigate' | 'reload' | 'back_forward' | 'spa';
    isSPA: boolean;
    previousUrl: string | null;
    triggeredBy: 'initial' | 'popstate' | 'pushstate' | 'replacestate' | 'hashchange';
  };
  
  // Performance metrics
  performance: {
    loadTime: number | null; // Total page load time
    domContentLoaded: number | null; // DOM ready time
    firstPaint: number | null; // First paint time
    firstContentfulPaint: number | null; // First contentful paint
    connectionType: string | null; // Network connection type
  };
  
  // Content analysis
  content: {
    characterCount: number; // Total text content length
    imageCount: number; // Number of images
    linkCount: number; // Number of links
    formCount: number; // Number of forms
    scriptCount: number; // Number of scripts
    hasVideo: boolean; // Contains video elements
    hasAudio: boolean; // Contains audio elements
  };
  
  // Session context
  session: {
    isFirstPageInSession: boolean;
    pageViewCount: number; // Number of page views in this session
    timeOnPreviousPage: number | null; // Time spent on previous page
  };
  
  // Timing
  timing: {
    sessionDuration: number; // Total session time
    timeToPageView: number; // Time from session start to this page view
  };
} 