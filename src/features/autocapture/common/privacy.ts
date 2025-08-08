import { SENSITIVE_SELECTORS, PRIVACY_SETTINGS } from './constants';

// Check if an element should be ignored for tracking
export const shouldIgnoreElement = (element: HTMLElement): boolean => {
  // Check if element matches sensitive selectors
  if (element.matches(SENSITIVE_SELECTORS)) {
    return true;
  }
  
  // Check if element is inside a sensitive container
  if (element.closest(SENSITIVE_SELECTORS)) {
    return true;
  }
  
  // Check for data attributes that indicate sensitive content
  if (element.hasAttribute('data-sensitive') || 
      element.hasAttribute('data-private') ||
      element.hasAttribute('data-no-track')) {
    return true;
  }
  
  return false;
};

// Redact sensitive values from form inputs
export const redactSensitiveValue = (element: HTMLElement, value: string): string | null => {
  if (!PRIVACY_SETTINGS.REDACT_INPUT_VALUES) {
    return value;
  }
  
  const input = element as HTMLInputElement;
  const type = input.type?.toLowerCase();
  const name = input.name?.toLowerCase();
  
  // Always redact password fields
  if (type === 'password') {
    return '[REDACTED_PASSWORD]';
  }
  
  // Redact email fields
  if (type === 'email' || name?.includes('email')) {
    return '[REDACTED_EMAIL]';
  }
  
  // Redact phone numbers
  if (type === 'tel' || name?.includes('phone') || name?.includes('tel')) {
    return '[REDACTED_PHONE]';
  }
  
  // Redact credit card fields
  if (name?.includes('card') || name?.includes('credit') || type?.includes('cc')) {
    return '[REDACTED_CARD]';
  }
  
  // Redact SSN or social security
  if (name?.includes('ssn') || name?.includes('social')) {
    return '[REDACTED_SSN]';
  }
  
  // For other inputs, return limited info
  if (input.tagName === 'INPUT') {
    return value.length > 0 ? `[${value.length} chars]` : null;
  }
  
  return value;
};

// Clean data object by removing or redacting sensitive information
export const cleanEventData = (data: Record<string, any>): Record<string, any> => {
  const cleaned = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'ssn', 'social', 'creditCard', 'cvv'];
  sensitiveFields.forEach(field => {
    if (cleaned[field]) {
      delete cleaned[field];
    }
  });
  
  // Redact URLs that might contain sensitive info
  if (cleaned.url && typeof cleaned.url === 'string') {
    try {
      const url = new URL(cleaned.url);
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'password', 'secret', 'auth'];
      sensitiveParams.forEach(param => {
        url.searchParams.delete(param);
      });
      cleaned.url = url.toString();
    } catch (e) {
      // Invalid URL, keep as is
    }
  }
  
  return cleaned;
};

// Check if we should rate limit this event
let eventCounts: Map<string, { count: number; lastReset: number }> = new Map();

export const shouldRateLimit = (eventType: string, limit: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const key = eventType;
  
  const current = eventCounts.get(key) || { count: 0, lastReset: now };
  
  // Reset counter if window has passed
  if (now - current.lastReset > windowMs) {
    current.count = 0;
    current.lastReset = now;
  }
  
  current.count++;
  eventCounts.set(key, current);
  
  return current.count > limit;
}; 