import { ClickEventData } from './types';
import { getCommonProperties, getElementSelector, getSafeTextContent } from '../common/enrichment';
import { shouldIgnoreElement, shouldRateLimit, cleanEventData } from '../common/privacy';
import { RATE_LIMITS } from '../common/constants';

let lastClickTime = 0;
let pageLoadTime = Date.now();

// Throttle function to prevent too many click events
const throttle = (func: Function, delay: number) => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Get element attributes (limited set)
const getElementAttributes = (element: HTMLElement): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const allowedAttrs = ['data-testid', 'data-track', 'role', 'aria-label', 'title'];
  
  allowedAttrs.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      attrs[attr] = value;
    }
  });
  
  return attrs;
};

// Calculate DOM depth from body
const getDOMDepth = (element: HTMLElement): number => {
  let depth = 0;
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    depth++;
    current = current.parentElement;
  }
  
  return depth;
};

// Process click event and extract data
export const processClickEvent = (event: MouseEvent): ClickEventData | null => {
  const target = event.target as HTMLElement;
  
  // Privacy and safety checks
  if (!target || shouldIgnoreElement(target)) {
    return null;
  }
  
  // Only track clicks on actionable elements
  const actionableSelectors = [
    'button', 'a', 'input', 'select', 'textarea', 
    '[role="button"]', '[role="link"]', '[role="tab"]',
    '[onclick]', '[data-clickable]', '[data-track]'
  ];
  
  const isActionable = actionableSelectors.some(selector => 
    target.matches(selector) || target.closest(selector)
  );
  
  if (!isActionable) {
    return null; // Skip clicks on non-actionable elements
  }
  
  // Rate limiting
  if (shouldRateLimit('click', 50, 10000)) { // 50 clicks per 10 seconds max
    return null;
  }
  
  const now = Date.now();
  const timeSinceLastClick = lastClickTime > 0 ? now - lastClickTime : null;
  lastClickTime = now;
  
  // Collect click-specific data
  const clickData: Partial<ClickEventData> = {
    element: {
      tag: target.tagName.toLowerCase(),
      id: target.id || null,
      classes: target.className || null,
      text: getSafeTextContent(target, RATE_LIMITS.MAX_TEXT_LENGTH),
      href: (target as HTMLAnchorElement).href || null,
      selector: getElementSelector(target),
      attributes: getElementAttributes(target)
    },
    
    position: {
      x: event.clientX,
      y: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    },
    
    context: {
      isContentEditable: target.isContentEditable,
      hasChildren: target.children.length > 0,
      parentTag: target.parentElement?.tagName.toLowerCase() || null,
      depth: getDOMDepth(target)
    },
    
    timing: {
      timeOnPage: now - pageLoadTime,
      timeSinceLastClick
    }
  };

  // If the clicked element is an input, add inputMeta
  if (target.tagName.toLowerCase() === 'input') {
    const input = target as HTMLInputElement;
    let label = null;
    if (input.id) {
      const labelElem = document.querySelector(`label[for='${input.id}']`);
      if (labelElem) label = labelElem.textContent?.trim() || null;
    }
    clickData.inputMeta = {
      type: input.type || null,
      name: input.name || null,
      placeholder: input.placeholder || null,
      label
    };
  }

  // Merge with common properties
  const fullData = {
    ...getCommonProperties(),
    ...clickData
  } as ClickEventData;
  
  // Clean sensitive data
  return cleanEventData(fullData) as ClickEventData;
};

// Create throttled click handler
export const createClickHandler = (trackingCallback: (data: ClickEventData) => void) => {
  return throttle((event: MouseEvent) => {
    const clickData = processClickEvent(event);
    if (clickData) {
      trackingCallback(clickData);
    }
  }, RATE_LIMITS.CLICK_THROTTLE_MS);
}; 