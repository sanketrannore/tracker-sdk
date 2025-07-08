import type { AutocaptureConfig, AutocaptureEvent } from '../types/types';
import { EventType } from '../types/types';
import { getElementInfo, shouldIgnoreElement, debugLog } from '../utils';

/**
 * Click Tracker Module
 * Handles button click event tracking only
 */

/**
 * Check if element is a button
 * @param element - HTML element to check
 * @returns boolean indicating if element is a button
 */
function isButton(element: HTMLElement): boolean {
  return element.tagName === 'BUTTON' || 
         (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'button') ||
         (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'submit') ||
         element.getAttribute('role') === 'button';
}

let isClickTrackingEnabled = false;
let clickConfig: AutocaptureConfig = {};

/**
 * Initialize click tracking with configuration
 * @param config - Autocapture configuration object
 */
export function initClickTracking(config: AutocaptureConfig) {
  clickConfig = config;
  isClickTrackingEnabled = config.clicks || false;
  
  if (isClickTrackingEnabled) {
    // Use capture phase to catch all clicks, including those that might be prevented
    document.addEventListener('click', handleClick, true);
    debugLog('Click tracking initialized', config);
  }
}

/**
 * Stop click tracking and remove event listeners
 */
export function stopClickTracking() {
  if (isClickTrackingEnabled) {
    document.removeEventListener('click', handleClick, true);
    isClickTrackingEnabled = false;
    debugLog('Click tracking stopped', clickConfig);
  }
}

/**
 * Main click event handler
 * Processes click events and creates autocapture events
 * @param event - Native click event
 */
function handleClick(event: MouseEvent) {
  // Early return if click tracking is disabled
  if (!isClickTrackingEnabled) return;
  
  const element = event.target as HTMLElement;
  
  // Validate element exists and should be tracked
  if (!element || shouldIgnoreElement(element, clickConfig)) {
    return;
  }

  console.log('element', element);
  
  // Only track button clicks
  if (!isButton(element)) {
    return;
  }
  
  // Create click event data
  const eventData: AutocaptureEvent = {
    type: EventType.CLICK,
    timestamp: Date.now(),
    element,
    elementInfo: getElementInfo(element),
    eventData: {
      // Mouse event details
      button: event.button,           // Which mouse button was clicked (0=left, 1=middle, 2=right)
      
      // Element position information
      clientX: event.clientX,         // X coordinate relative to viewport
      clientY: event.clientY,         // Y coordinate relative to viewport
      
      // Additional context
      targetTagName: element.tagName.toLowerCase(),
      targetId: element.id || undefined,
      targetClassName: element.className || undefined
    }
  };
  
  // Dispatch the event to the main autocapture system
  dispatchClickEvent(eventData);
}

/**
 * Dispatch click event to the main autocapture system
 * This function will be overridden by the main autocapture module
 * @param eventData - Click event data
 */
let dispatchClickEvent: (event: AutocaptureEvent) => void = () => {};

/**
 * Set the dispatch function for click events
 * Called by the main autocapture module to establish communication
 * @param dispatchFn - Function to dispatch events
 */
export function setClickEventDispatcher(dispatchFn: (event: AutocaptureEvent) => void) {
  dispatchClickEvent = dispatchFn;
}

/**
 * Check if click tracking is currently enabled
 * @returns boolean indicating if click tracking is active
 */
export function isClickTrackingActive(): boolean {
  return isClickTrackingEnabled;
}

/**
 * Get current click tracking configuration
 * @returns Current click tracking configuration
 */
export function getClickTrackingConfig(): AutocaptureConfig {
  return clickConfig;
} 