import { createClickHandler } from './handlers';
import { ClickEventData } from './types';

export type ClickTracker = (data: ClickEventData) => void;

export const setupClickCapture = (trackEvent: ClickTracker): (() => void) => {
  // Create the click handler
  const clickHandler = createClickHandler(trackEvent);
  
  // Add event listener without capture phase to reduce duplications
  document.addEventListener('click', clickHandler, {
    passive: true
  });
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', clickHandler);
  };
}; 