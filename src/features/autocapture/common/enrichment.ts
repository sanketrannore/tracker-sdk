// Static properties that don't change during a session
let staticProperties: Record<string, any> | null = null;

export const getStaticCommonProperties = (): Record<string, any> => {
  if (!staticProperties) {
    staticProperties = {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
    };
  }
  return staticProperties;
};

export const getDynamicCommonProperties = (): Record<string, any> => {
  const now = performance.now();
  const timing = performance.timing;
  
  return {
    url: window.location.href,
    pathname: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY
    },
    loadTime: timing.loadEventEnd > 0 ? timing.loadEventEnd - timing.navigationStart : null,
    timestamp: Date.now(),
    performanceNow: now
  };
};

export const getCommonProperties = (): Record<string, any> => {
  return {
    ...getStaticCommonProperties(),
    ...getDynamicCommonProperties()
  };
};

// Utility to generate CSS selector for an element
export const getElementSelector = (element: HTMLElement, maxDepth: number = 5): string => {
  if (!element || element === document.body) return 'body';
  
  const path: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;
  
  while (current && current !== document.body && depth < maxDepth) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    if (current.className) {
      const classes = current.className.split(' ').filter(c => c.trim()).slice(0, 3);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    // Add nth-child if there are siblings with same tag
    const siblings = current.parentElement?.children;
    if (siblings && siblings.length > 1) {
      const sameTagSiblings = Array.from(siblings).filter(s => s.tagName === current!.tagName);
      if (sameTagSiblings.length > 1) {
        const index = Array.from(siblings).indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
    depth++;
  }
  
  return path.join(' > ');
};

// Utility to safely get text content
export const getSafeTextContent = (element: HTMLElement, maxLength: number = 100): string | null => {
  const text = element.textContent?.trim();
  if (!text) return null;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}; 