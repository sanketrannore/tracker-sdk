/**
 * Button Click Tracker
 * 
 * Automatically captures button click events with comprehensive data including:
 * - Button properties (ID, name, value, type, text, ARIA labels)
 * - Styling information (classes, computed styles)
 * - Position and dimensions
 * - Mouse interaction details
 * - Form context (if button is in a form)
 * - DOM hierarchy and element path
 * - Page context
 * 
 * Only tracks actual button elements, not all clickable elements.
 */

import { SafeBrowser, isBrowser } from '../../common/environment';
import type { AutocaptureConfig, AutocaptureEvent } from '../../common/types';
import { EventType } from '../../common/types';
import { getElementInfo } from '../../common/utils';

// Global state
let isActive = false;
let eventDispatcher: ((event: AutocaptureEvent) => void) | null = null;

/**
 * Initialize button click tracking
 * Adds global click event listener that filters for button elements
 * 
 * @param config - Autocapture configuration
 */
export function initClickTracking(config: AutocaptureConfig): void {
  if (isActive) {
    return;
  }
  
  // Check if we're in a browser environment
  if (!isBrowser()) {
    console.log('❌ [Cruxstack] Browser environment required for click tracking');
    return;
  }

  // Add global click listener
  SafeBrowser.addEventListener('click', handleButtonClick, true);
  isActive = true;
  
}

/**
 * Stop button click tracking
 * Removes event listeners and cleans up
 */
export function stopClickTracking(): void {
  if (!isActive) return;
  
  SafeBrowser.removeEventListener('click', handleButtonClick, true);
  isActive = false;
  eventDispatcher = null;
  
  console.log('🔘 [Cruxstack] Click tracking stopped');
}

/**
 * Set the event dispatcher function
 * This function will be called when button clicks are captured
 * 
 * @param dispatcher - Function to handle captured events
 */
export function setClickEventDispatcher(dispatcher: (event: AutocaptureEvent) => void): void {
  eventDispatcher = dispatcher;
}

/**
 * Check if click tracking is currently active
 * 
 * @returns True if tracking is active
 */
export function isClickTrackingActive(): boolean {
  return isActive;
}

/**
 * Handle click events and filter for buttons
 * Captures comprehensive data about button interactions
 * 
 * @param event - DOM click event
 * @private
 */
function handleButtonClick(event: Event): void {
  const mouseEvent = event as MouseEvent;
  const target = mouseEvent.target as Element;
  
  // Only track actual button elements (not all clickable elements)
  if (!isButtonElement(target)) {
    return;
  }
  
  try {
    captureButtonClickData(mouseEvent, target);
  } catch (error) {
    console.error('❌ [Cruxstack] Error capturing button click:', error);
  }
}

/**
 * Check if element is a trackable button
 * 
 * @param element - DOM element to check
 * @returns True if element is a button
 * @private
 */
function isButtonElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const type = (element as HTMLInputElement).type?.toLowerCase();
  
  // Track button elements and input elements with button-like types
  if (tagName === 'button') return true;
  if (tagName === 'input' && type) {
    return ['button', 'submit', 'reset'].indexOf(type) !== -1;
  }
  return false;
}

/**
 * Capture comprehensive button click data
 * Extracts 50+ properties about the button and interaction
 * 
 * @param event - DOM click event
 * @param target - Button element that was clicked
 * @private
 */
function captureButtonClickData(event: MouseEvent, target: Element): void {
  const buttonElement = target as HTMLButtonElement | HTMLInputElement;
  const rect = buttonElement.getBoundingClientRect();
  const elementInfo = getElementInfo(buttonElement);
  
  // Extract comprehensive button data
  const buttonData = extractButtonProperties(buttonElement);
  const positionData = extractPositionData(event, rect);
  const mouseData = extractMouseData(event);
  const contextData = extractContextData(buttonElement);
  const pageData = extractPageData();
  
  // Create the complete event object
  const autocaptureEvent: AutocaptureEvent = {
    type: EventType.CLICK,
    timestamp: Date.now(),
    elementInfo,
    eventData: {
      // Button-specific properties
      ...buttonData,
      
      // Position and dimensions
      ...positionData,
      
      // Mouse interaction details
      ...mouseData,
      
      // Context information
      ...contextData,
      
      // Page context
      ...pageData
    }
  };
  
  // Dispatch the event
  if (eventDispatcher) {
    eventDispatcher(autocaptureEvent);
  }
}

/**
 * Extract button-specific properties
 * 
 * @param element - Button element
 * @returns Button properties
 * @private
 */
function extractButtonProperties(element: HTMLButtonElement | HTMLInputElement) {
  return {
    // Basic button properties
    buttonId: element.id || undefined,
    buttonName: element.name || undefined,
    buttonValue: element.value || undefined,
    buttonType: element.type || undefined,
    buttonText: getButtonText(element),
    buttonAriaLabel: element.getAttribute('aria-label') || undefined,
    buttonTitle: element.title || undefined,
    buttonDisabled: element.disabled,
    
    // CSS information
    className: element.className || undefined,
    classList: element.classList ? Array.from(element.classList) : [],
    
    // DOM information
    targetTagName: element.tagName.toLowerCase(),
    hasChildren: element.children.length > 0,
    isVisible: isElementVisible(element),
    
    // Data attributes (all data-* attributes)
    dataAttributes: extractDataAttributes(element)
  };
}

/**
 * Extract position and dimension data
 * 
 * @param event - Click event
 * @param rect - Element bounding rectangle
 * @returns Position data
 * @private
 */
function extractPositionData(event: MouseEvent, rect: DOMRect) {
  return {
    position: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    },
    clickCoordinates: {
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      offsetX: event.offsetX,
      offsetY: event.offsetY
    }
  };
}

/**
 * Extract mouse interaction data
 * 
 * @param event - Click event
 * @returns Mouse data
 * @private
 */
function extractMouseData(event: MouseEvent) {
  return {
    mouseButton: event.button, // 0=left, 1=middle, 2=right
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey
  };
}

/**
 * Extract contextual data (form, DOM hierarchy)
 * 
 * @param element - Button element
 * @returns Context data
 * @private
 */
function extractContextData(element: HTMLButtonElement | HTMLInputElement) {
  return {
    // Form context (if button is in a form)
    formContext: getFormContext(element),
    
    // DOM hierarchy
    parentElement: element.parentElement?.tagName.toLowerCase() || undefined,
    elementPath: getElementPath(element)
  };
}

/**
 * Extract current page data
 * 
 * @returns Page data
 * @private
 */
function extractPageData() {
  const location = SafeBrowser.getLocation();
  const doc = SafeBrowser.getDocument();
  
  return {
    pageUrl: location.href,
    pageTitle: doc.title,
    pageHost: location.host,
    pageProtocol: location.protocol,
    referrer: doc.referrer || undefined
  };
}

/**
 * Get text content from button element
 * 
 * @param element - Button element
 * @returns Button text content
 * @private
 */
function getButtonText(element: HTMLButtonElement | HTMLInputElement): string | undefined {
  if (element.tagName.toLowerCase() === 'input') {
    return element.value || undefined;
  }
  return element.textContent?.trim() || undefined;
}

/**
 * Check if element is visible to the user
 * 
 * @param element - Element to check
 * @returns True if element is visible
 * @private
 */
function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

/**
 * Extract all data-* attributes from element
 * 
 * @param element - Element to extract data attributes from
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
 * Get form context if button is inside a form
 * 
 * @param element - Button element
 * @returns Form context information
 * @private
 */
function getFormContext(element: HTMLButtonElement | HTMLInputElement): any {
  const form = element.closest('form');
  if (!form) return undefined;
  
  return {
    formId: form.id || undefined,
    formName: form.name || undefined,
    formMethod: form.method || undefined,
    formAction: form.action || undefined,
    formEnctype: form.enctype || undefined,
    formElementCount: form.elements.length
  };
}

/**
 * Generate CSS selector path to element
 * 
 * @param element - Element to generate path for
 * @returns CSS selector path
 * @private
 */
function getElementPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      selector += `.${current.className.trim().split(/\s+/).join('.')}`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
} 