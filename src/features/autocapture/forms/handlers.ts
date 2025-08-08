import { FormEventData } from './types';
import { getElementSelector } from '../common/enrichment';
import { shouldIgnoreElement, redactSensitiveValue, cleanEventData } from '../common/privacy';
import { RATE_LIMITS } from '../common/constants';

// Track form interactions
const formInteractions = new Map<HTMLFormElement, {
  firstInteraction: number;
  lastInteraction: number;
  fieldInteractions: Set<HTMLElement>;
}>();

let pageLoadTime = Date.now();

// Debounce function for form changes
const debounce = (func: Function, delay: number) => {
  let timeoutId: number | null = null;
  
  return function (this: any, ...args: any[]) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(this, args), delay);
  };
};

// Get form element data
const getFormData = (form: HTMLFormElement) => {
  const forms = Array.from(document.querySelectorAll('form'));
  
  return {
    id: form.id || null,
    classes: form.className || null,
    action: form.action || null,
    method: form.method || 'get',
    enctype: form.enctype || null,
    elementCount: form.elements.length,
    selector: getElementSelector(form)
  };
};

// Get field data with privacy protection
const getFieldData = (element: HTMLElement, form: HTMLFormElement) => {
  const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  const formElements = Array.from(form.elements);
  
  return {
    name: input.name || null,
    id: input.id || null,
    type: input.type || element.tagName.toLowerCase(),
    value: redactSensitiveValue(element, input.value || ''),
    placeholder: (input as HTMLInputElement).placeholder || null,
    required: (input as HTMLInputElement).required || false,
    selector: getElementSelector(element)
  };
};

// Analyze form submission
const analyzeSubmission = (form: HTMLFormElement): FormEventData['submission'] => {
  const elements = Array.from(form.elements) as unknown as HTMLFormElement['elements'];
  let filledCount = 0;
  let requiredCount = 0;
  let errorCount = 0;

  // elements is HTMLFormControlsCollection, which doesn't have forEach, so use for loop
  for (let i = 0; i < elements.length; i++) {
    const input = elements[i] as HTMLInputElement;

    if (input.required) {
      requiredCount++;
    }
    
    if (input.value && input.value.trim()) {
      filledCount++;
    }
    
    if (!input.checkValidity()) {
      errorCount++;
    }
  }
  
  const interaction = formInteractions.get(form);
  const timeToSubmit = interaction ? Date.now() - interaction.firstInteraction : 0;
  
  return {
    isValid: form.checkValidity(),
    errorCount,
    filledFieldCount: filledCount,
    requiredFieldCount: requiredCount,
    timeToSubmit
  };
};

// Track form interaction timing
const trackFormInteraction = (form: HTMLFormElement, field?: HTMLElement) => {
  const now = Date.now();
  
  if (!formInteractions.has(form)) {
    formInteractions.set(form, {
      firstInteraction: now,
      lastInteraction: now,
      fieldInteractions: new Set()
    });
  }
  
  const interaction = formInteractions.get(form)!;
  interaction.lastInteraction = now;
  
  if (field) {
    interaction.fieldInteractions.add(field);
  }
};

// Process form events
export const processFormEvent = (
  event: Event, 
  eventType: FormEventData['eventType']
): FormEventData | null => {
  const target = event.target as HTMLElement;
  
  // Privacy and safety checks
  if (!target || shouldIgnoreElement(target)) {
    return null;
  }
  
  // Find the form
  const form = target.closest('form') as HTMLFormElement;
  if (!form) {
    return null;
  }
  
  // Add debug logging for form events (if debug is enabled)
  if (typeof window !== 'undefined' && (window as any).cruxstackDebug) {
    console.log(`Cruxstack: Form ${eventType} event detected`, {
      element: target.tagName,
      formId: form.id || 'no-id',
      fieldName: (target as HTMLInputElement).name || 'no-name',
      fieldType: (target as HTMLInputElement).type || 'no-type'
    });
  }
  
  const now = Date.now();
  const forms = Array.from(document.querySelectorAll('form'));
  const formIndex = forms.indexOf(form);
  
  // Track interaction
  trackFormInteraction(form, target);
  const interaction = formInteractions.get(form);
  
  // Base form data
  const formEventData: Partial<FormEventData> = {
    form: getFormData(form),
    eventType,
    timing: {
      timeOnPage: now - pageLoadTime,
      timeInForm: interaction ? now - interaction.firstInteraction : null,
      timeSinceLastInteraction: interaction && interaction.lastInteraction ? 
        now - interaction.lastInteraction : null
    },
    context: {
      formIndex,
      totalFormsOnPage: forms.length
    }
  };
  
  // Add field data for field-specific events
  if (['change', 'focus', 'blur'].includes(eventType)) {
    const formElements = Array.from(form.elements);
    const fieldIndex = formElements.indexOf(target as any);

    formEventData.field = getFieldData(target, form);
    if (formEventData.context) {
      formEventData.context.fieldIndex = fieldIndex >= 0 ? fieldIndex : undefined;
    }
  }
  
  // Add submission data for submit events
  if (eventType === 'submit') {
    formEventData.submission = analyzeSubmission(form);
  }
  
  // Clean sensitive data on event-specific payload only
  return cleanEventData(formEventData as Record<string, any>) as FormEventData;
};

// Create debounced handlers for different event types
export const createFormHandlers = (trackingCallback: (data: FormEventData) => void) => {
  const debouncedChangeHandler = debounce((event: Event) => {
    const formData = processFormEvent(event, 'change');
    if (formData) {
      trackingCallback(formData);
    }
  }, RATE_LIMITS.FORM_CHANGE_DEBOUNCE_MS);
  
  const submitHandler = (event: Event) => {
    const formData = processFormEvent(event, 'submit');
    if (formData) {
      trackingCallback(formData);
    }
  };
  
  const focusHandler = (event: Event) => {
    const formData = processFormEvent(event, 'focus');
    if (formData) {
      trackingCallback(formData);
    }
  };
  
  const blurHandler = (event: Event) => {
    const formData = processFormEvent(event, 'blur');
    if (formData) {
      trackingCallback(formData);
    }
  };
  
  return {
    change: debouncedChangeHandler,
    submit: submitHandler,
    focus: focusHandler,
    blur: blurHandler
  };
}; 