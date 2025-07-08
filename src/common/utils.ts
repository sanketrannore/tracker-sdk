/**
 * Utility Functions for Cruxstack Autocapture SDK
 * 
 * Provides helper functions for element analysis, event processing,
 * sampling, debugging, and other common operations.
 */

import type { AutocaptureConfig, ElementInfo } from './types';

/**
 * Generate unique event identifier
 * Uses timestamp and random number for uniqueness
 * 
 * @returns Unique event ID string
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if event should be sampled (included)
 * Based on configured sampling rate
 * 
 * @param config - Autocapture configuration
 * @returns True if event should be captured
 */
export function shouldSampleEvent(config: AutocaptureConfig): boolean {
  if (!config.samplingRate || config.samplingRate <= 0) return false;
  if (config.samplingRate >= 1) return true;
  
  return Math.random() <= config.samplingRate;
}

/**
 * Check if event limit has been reached for current session
 * 
 * @param currentCount - Current number of events captured
 * @param config - Autocapture configuration
 * @returns True if limit reached
 */
export function isEventLimitReached(currentCount: number, config: AutocaptureConfig): boolean {
  if (!config.maxEventsPerSession) return false;
  return currentCount >= config.maxEventsPerSession;
}

/**
 * Log debug messages if debug mode is enabled
 * 
 * @param message - Message to log
 * @param config - Autocapture configuration
 * @param data - Optional additional data to log
 */
export function debugLog(message: string, config: AutocaptureConfig, data?: any): void {
  if (!config.debug) return;
  
  if (data) {
    console.log(`🔍 [Cruxstack Debug] ${message}`, data);
  } else {
    console.log(`🔍 [Cruxstack Debug] ${message}`);
  }
}

/**
 * Extract comprehensive information about a DOM element
 * 
 * @param element - DOM element to analyze
 * @returns Element information object
 */
export function getElementInfo(element: Element): ElementInfo {
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    classList: element.classList.length > 0 ? Array.from(element.classList) : undefined,
    textContent: element.textContent?.trim() || undefined,
    ariaLabel: element.getAttribute('aria-label') || undefined,
    title: element.getAttribute('title') || undefined,
    dataAttributes: extractDataAttributes(element),
    boundingRect: element.getBoundingClientRect(),
    selectorPath: generateSelectorPath(element),
    isVisible: isElementVisible(element)
  };
}

/**
 * Extract all data-* attributes from an element
 * 
 * @param element - DOM element
 * @returns Object with data attributes
 * @private
 */
function extractDataAttributes(element: Element): Record<string, string> {
  const dataAttributes: Record<string, string> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    }
  }
  
  return dataAttributes;
}

/**
 * Generate CSS selector path to an element
 * 
 * @param element - DOM element
 * @returns CSS selector path
 * @private
 */
function generateSelectorPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // Add ID if available (makes selector unique)
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, no need to go further
    }
    
    // Add classes if available
    if (current.className) {
      const classes = current.className.trim().split(/\s+/).join('.');
      selector += `.${classes}`;
    }
    
    // Add nth-child if needed for uniqueness
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const sameTagSiblings = siblings.filter(sibling => 
        sibling.tagName.toLowerCase() === current!.tagName.toLowerCase()
      );
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Check if element is visible to the user
 * 
 * @param element - DOM element to check
 * @returns True if element is visible
 * @private
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         (element as HTMLElement).offsetParent !== null;
}

/**
 * Get current route information
 * 
 * @returns Current page route details
 */
export function getCurrentRouteInfo(): { pathname: string; search: string; hash: string } {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  };
} 