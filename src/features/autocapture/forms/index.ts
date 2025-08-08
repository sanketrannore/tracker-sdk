import { createFormHandlers } from './handlers';
import { FormEventData } from './types';

export type FormTracker = (data: FormEventData) => void;

export const setupFormCapture = (trackEvent: FormTracker): (() => void) => {
  // Create the form handlers
  const handlers = createFormHandlers(trackEvent);
  
  // Add event listeners without capture phase to reduce duplications
  document.addEventListener('submit', handlers.submit);
  document.addEventListener('change', handlers.change, { passive: true });
  document.addEventListener('focus', handlers.focus, { passive: true });
  document.addEventListener('blur', handlers.blur, { passive: true });
  
  // Return cleanup function
  return () => {
    document.removeEventListener('submit', handlers.submit);
    document.removeEventListener('change', handlers.change);
    document.removeEventListener('focus', handlers.focus);
    document.removeEventListener('blur', handlers.blur);
  };
}; 