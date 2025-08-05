import { setupClickCapture, ClickTracker } from './clicks';
import { setupFormCapture, FormTracker } from './forms';
import { setupPageViewCapture, PageViewTracker } from './pageViews';
import { CruxstackConfig } from '../../common/types';

// Types for the tracking functions
export interface AutocaptureTrackers {
  trackClick: ClickTracker;
  trackForm: FormTracker;
  trackPageView: PageViewTracker;
}

// Combined autocapture cleanup function
export type AutocaptureCleanup = () => void;

// Main autocapture setup function
export const setupAutocapture = (
  trackers: AutocaptureTrackers,
  config: CruxstackConfig
): AutocaptureCleanup => {
  // Skip if autocapture is disabled
  if (config.autoCapture === false) {
    return () => {}; // Return no-op cleanup function
  }
  
  const cleanupFunctions: (() => void)[] = [];
  
  // Set up each capture type
  try {
    // Page views (should be first to capture initial page load)
    const pageViewCleanup = setupPageViewCapture(trackers.trackPageView);
    cleanupFunctions.push(pageViewCleanup);
    
    // Click tracking
    const clickCleanup = setupClickCapture(trackers.trackClick);
    cleanupFunctions.push(clickCleanup);
    
    // Form tracking
    const formCleanup = setupFormCapture(trackers.trackForm);
    cleanupFunctions.push(formCleanup);
    
    if (config.debugLog) {
      console.log('Cruxstack: Autocapture initialized successfully');
    }
  } catch (error) {
    if (config.debugLog) {
      console.error('Cruxstack: Error setting up autocapture:', error);
    }
    
    // Clean up any successfully initialized trackers
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (cleanupError) {
        console.error('Cruxstack: Error during cleanup:', cleanupError);
      }
    });
    
    return () => {}; // Return no-op if setup failed
  }
  
  // Return combined cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        if (config.debugLog) {
          console.error('Cruxstack: Error during autocapture cleanup:', error);
        }
      }
    });
    
    if (config.debugLog) {
      console.log('Cruxstack: Autocapture cleaned up');
    }
  };
};

// Re-export types for convenience
export type { ClickEventData } from './clicks/types';
export type { FormEventData } from './forms/types';
export type { PageViewEventData } from './pageViews/types'; 