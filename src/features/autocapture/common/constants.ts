// Sensitive elements that should never be tracked
export const SENSITIVE_SELECTORS = [
  'input[type="password"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[type="credit-card"]',
  'input[type="cc-number"]',
  'input[type="cardnumber"]',
  'input[name*="password"]',
  'input[name*="ssn"]',
  'input[name*="social"]',
  '[data-cruxstack-ignore]',
  '[autocomplete="cc-number"]',
  '[autocomplete="cc-exp"]',
  '[autocomplete="cc-csc"]'
].join(',');

// Events we want to capture
export const CAPTURE_EVENTS = {
  CLICK: 'click',
  SUBMIT: 'submit',
  CHANGE: 'change',
  FOCUS: 'focus',
  BLUR: 'blur'
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  CLICK_THROTTLE_MS: 100,
  FORM_CHANGE_DEBOUNCE_MS: 300,
  MAX_TEXT_LENGTH: 100
} as const;

// Privacy settings
export const PRIVACY_SETTINGS = {
  REDACT_INPUT_VALUES: true,
  CAPTURE_FORM_DATA: false, // Set to false for privacy
  MAX_SELECTOR_DEPTH: 10
} as const; 