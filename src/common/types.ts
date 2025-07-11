/**
 * Type definitions for Cruxstack Autocapture SDK
 * 
 * Provides comprehensive TypeScript interfaces for all SDK functionality
 * including events, configuration, and data structures.
 */

/**
 * Types of events that can be captured by the SDK
 */
export enum EventType {
  /** Button click interactions */
  CLICK = 'CLICK',
  /** Page view events (initial loads and route changes) */
  PAGE_VIEW = 'PAGE_VIEW'
}

/**
 * SDK Configuration Interface
 * 
 * Controls which events are captured and how the SDK behaves.
 */
export interface AutocaptureConfig {
  /** Enable/disable button click tracking */
  clicks?: boolean;
  /** Enable/disable page view tracking */
  pageViews?: boolean;
  /** Enable debug logging to console */
  debugLog?: boolean;
  /** Sampling rate (0-1) for event capture */
  samplingRate?: number;
  /** Maximum events per session before stopping */
  maxEventsPerSession?: number;
}

/**
 * Core autocapture event structure
 * 
 * All captured events conform to this interface regardless of type.
 */
export interface AutocaptureEvent {
  /** Type of event (click, page view, etc.) */
  type: EventType;
  /** Timestamp when event occurred (milliseconds since epoch) */
  timestamp: number;
  /** Unique event identifier (generated automatically) */
  id?: string;
  /** Route/navigation information (for page views) */
  routeInfo?: RouteInfo;
  /** Comprehensive element information (for interactions) */
  elementInfo?: ElementInfo;
  /** All captured event data specific to the event type */
  eventData?: EventData;
}

/**
 * Route/navigation information for page views
 */
export interface RouteInfo {
  /** URL being navigated from */
  fromUrl: string;
  /** URL being navigated to */
  toUrl: string;
  /** Timestamp of navigation */
  navigationTime: number;
}

/**
 * Comprehensive element information
 * 
 * Captured for interactive elements (buttons, forms, etc.)
 */
export interface ElementInfo {
  /** HTML tag name */
  tagName: string;
  /** Element ID attribute */
  id?: string;
  /** CSS classes applied to element */
  className?: string;
  /** Array of individual CSS classes */
  classList?: string[];
  /** Text content of element */
  textContent?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Title attribute */
  title?: string;
  /** All data-* attributes */
  dataAttributes?: Record<string, string>;
  /** Element's bounding rectangle */
  boundingRect?: DOMRect;
  /** CSS selector path to element */
  selectorPath?: string;
  /** Whether element is visible to user */
  isVisible?: boolean;
}

/**
 * Comprehensive event data
 * 
 * Contains all captured information regardless of event type.
 * Different event types will populate different subsets of these fields.
 */
export interface EventData {
  // Button-specific properties
  /** Button ID attribute */
  buttonId?: string;
  /** Button name attribute */
  buttonName?: string;
  /** Button value attribute */
  buttonValue?: string;
  /** Button type (button, submit, reset) */
  buttonType?: string;
  /** Button text content */
  buttonText?: string;
  /** Button ARIA label */
  buttonAriaLabel?: string;
  /** Button title attribute */
  buttonTitle?: string;
  /** Whether button is disabled */
  buttonDisabled?: boolean;
  
  // CSS and styling
  /** CSS class name string */
  className?: string;
  /** Array of CSS classes */
  classList?: string[];
  
  // Position and dimensions
  /** Element position and size information */
  position?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  
  // Mouse interaction details
  /** Which mouse button was clicked (0=left, 1=middle, 2=right) */
  mouseButton?: number;
  /** Click coordinates relative to different reference points */
  clickCoordinates?: {
    clientX: number;  // Relative to viewport
    clientY: number;
    pageX: number;    // Relative to page
    pageY: number;
    screenX: number;  // Relative to screen
    screenY: number;
    offsetX: number;  // Relative to element
    offsetY: number;
  };
  /** Modifier keys pressed during click */
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  
  // Data attributes
  /** All data-* attributes from element */
  dataAttributes?: Record<string, string>;
  
  // Form context (if element is in a form)
  /** Form information if button is inside a form */
  formContext?: {
    formId?: string;
    formName?: string;
    formMethod?: string;
    formAction?: string;
    formEnctype?: string;
    formElementCount?: number;
  };
  
  // DOM hierarchy
  /** Tag name of target element */
  targetTagName?: string;
  /** Parent element tag name */
  parentElement?: string;
  /** CSS selector path to element */
  elementPath?: string;
  /** Whether element is visible */
  isVisible?: boolean;
  /** Whether element has child elements */
  hasChildren?: boolean;
  
  // Page context
  /** Current page URL */
  pageUrl?: string;
  /** Page title */
  pageTitle?: string;
  /** Page hostname */
  pageHost?: string;
  /** Page hostname (detailed) */
  pageHostname?: string;
  /** Page protocol (http/https) */
  pageProtocol?: string;
  /** Page port number */
  pagePort?: string;
  /** Page pathname */
  pagePathname?: string;
  /** Page query string */
  pageSearch?: string;
  /** Page hash/fragment */
  pageHash?: string;
  /** Referring page URL */
  referrer?: string;
  
  // Browser information
  /** User agent string */
  userAgent?: string;
  /** Browser language */
  language?: string;
  /** All browser languages */
  languages?: string[];
  /** Browser platform */
  platform?: string;
  /** Whether cookies are enabled */
  cookieEnabled?: boolean;
  /** Whether browser is online */
  onLine?: boolean;
  /** Do not track setting */
  doNotTrack?: string;
  
  // Viewport and screen
  /** Viewport and screen information */
  viewport?: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    screenWidth: number;
    screenHeight: number;
    colorDepth: number;
    pixelDepth: number;
    devicePixelRatio: number;
  };
  
  // Performance timing
  /** Complete performance timing data */
  performanceTiming?: {
    navigationStart: number;
    unloadEventStart: number;
    unloadEventEnd: number;
    redirectStart: number;
    redirectEnd: number;
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    domLoading: number;
    domInteractive: number;
    domContentLoadedEventStart: number;
    domContentLoadedEventEnd: number;
    domComplete: number;
    loadEventStart: number;
    loadEventEnd: number;
    totalLoadTime: number;
    domReadyTime: number;
    responseTime: number;
    navigationType: number;
    redirectCount: number;
  };
  
  // Meta tags
  /** All meta tags from page */
  metaTags?: Record<string, string>;
  
  // Network connection
  /** Network connection information */
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    type?: string;
  };
  
  // Document properties
  /** Document ready state */
  documentReadyState?: string;
  /** Document character set */
  documentCharacterSet?: string;
  /** Document compatibility mode */
  documentCompatMode?: string;
  /** Document visibility state */
  documentVisibilityState?: string;
  /** Whether document is hidden */
  documentHidden?: boolean;
  
  // Timezone information
  /** Browser timezone */
  timeZone?: string;
  /** Timezone offset in minutes */
  timeZoneOffset?: number;
  /** ISO timestamp */
  timestamp?: string;
  /** Local time string */
  localTime?: string;
  
  // Time spent on previous page
  /** Time tracking for previous page */
  previousPageTimeSpent?: {
    previousUrl: string;
    timeSpentMs: number;
    timeSpentSeconds: number;
    timeSpentFormatted: string;
    timePeriod: 'short' | 'medium' | 'long';
    entryTime: number;
    exitTime: number;
  };
} 

/**
 * Main SDK Configuration Interface
 * 
 * Controls the initialization and behavior of the Cruxstack SDK.
 */
export interface CruxstackConfig {
  /** Application identifier (required) */
  appId: string;
  /** User identifier (optional) */
  userId?: string;
  /** Enable/disable automatic event capture (optional, defaults to true) */
  autoCapture?: boolean;
  /** Enable debug logging to console (optional, defaults to false) */
  debugLog?: boolean;
} 