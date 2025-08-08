export interface PageViewEventData {
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

  // Scroll depth (percentage of page viewed)
  scrollDepthPercent: number;
} 