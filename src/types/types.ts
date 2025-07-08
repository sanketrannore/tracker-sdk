// Configuration for the autocapture SDK
export interface AutocaptureConfig {
  clicks?: boolean;
  formInteractions?: boolean;
  pageViews?: boolean;
  routeChanges?: boolean;
  ignoreSelectors?: string[];
  includeSelectors?: string[];
  samplingRate?: number; // 0-1
  maxEventsPerSession?: number;
  debug?: boolean;
  onEvent?: (event: AutocaptureEvent) => void;
  onError?: (error: Error) => void;
}

export enum EventType {
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  FORM_CHANGE = 'form_change',
  FORM_FOCUS = 'form_focus',
  PAGE_VIEW = 'page_view',
  PAGE_TIME = 'page_time',
  ROUTE_CHANGE = 'route_change'
}

export interface AutocaptureEvent {
  type: EventType;
  timestamp: number;
  id?: string;
  element?: HTMLElement;
  elementInfo?: ElementInfo;
  eventData?: Record<string, any>;
  routeInfo?: RouteInfo;
  deviceInfo?: Record<string, any>; // Device information attached to all events
}

export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  href?: string;
  formAction?: string;
  inputType?: string;
  inputValue?: string;
  dataAttributes?: Record<string, string>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface RouteInfo {
  pathname: string;
  search?: string;
  hash?: string;
  previousPath?: string;
  timeSpent?: number; // time spent on the page in milliseconds
} 