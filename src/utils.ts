import type { AutocaptureConfig, ElementInfo } from './types/types';

export function getElementInfo(element: HTMLElement): ElementInfo {
  const rect = element.getBoundingClientRect();
  const dataAttributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    }
  }
  const info: ElementInfo = {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: element.className || undefined,
    textContent: element.textContent?.trim().substring(0, 100) || undefined,
    dataAttributes,
    position: {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    }
  };
  if (element instanceof HTMLAnchorElement) {
    info.href = element.href;
  } else if (element instanceof HTMLFormElement) {
    info.formAction = element.action;
  } else if (element instanceof HTMLInputElement) {
    info.inputType = element.type;
    if (!isSensitiveInput(element)) {
      info.inputValue = element.value.substring(0, 50);
    }
  }
  return info;
}

export function isSensitiveInput(input: HTMLInputElement): boolean {
  const sensitiveTypes = ['password', 'email', 'tel', 'ssn', 'credit-card'];
  const sensitiveNames = ['password', 'email', 'phone', 'ssn', 'credit', 'card', 'cvv', 'cvc'];
  if (sensitiveTypes.indexOf(input.type) >= 0) return true;
  if (input.name && sensitiveNames.some(s => input.name.toLowerCase().indexOf(s) >= 0)) return true;
  if (input.id && sensitiveNames.some(s => input.id.toLowerCase().indexOf(s) >= 0)) return true;
  return false;
}

export function shouldIgnoreElement(element: HTMLElement, config: AutocaptureConfig): boolean {
  if (config.ignoreSelectors) {
    for (const selector of config.ignoreSelectors) {
      if (element.matches(selector)) return true;
    }
  }
  if (config.includeSelectors && config.includeSelectors.length > 0) {
    let shouldInclude = false;
    for (const selector of config.includeSelectors) {
      if (element.matches(selector)) {
        shouldInclude = true;
        break;
      }
    }
    if (!shouldInclude) return true;
  }
  if (element.hasAttribute('data-autocapture-ignore')) return true;
  if (element.offsetParent === null) return true;
  return false;
}

export function shouldSampleEvent(config: AutocaptureConfig): boolean {
  if (!config.samplingRate || config.samplingRate >= 1) return true;
  return Math.random() < config.samplingRate;
}

export function isEventLimitReached(eventCount: number, config: AutocaptureConfig): boolean {
  if (!config.maxEventsPerSession) return false;
  return eventCount >= config.maxEventsPerSession;
}

export function debugLog(message: string, config: AutocaptureConfig, data?: any): void {
  if (config.debug) {
    console.log(`[Vanilla Autocapture] ${message}`, data || '');
  }
}

export function generateEventId(): string {
  return `autocapture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentRouteInfo(): { pathname: string; search: string; hash: string } {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  };
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 