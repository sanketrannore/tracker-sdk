export interface FormEventData {
  // Form information
  form: {
    id: string | null;
    classes: string | null;
    action: string | null;
    method: string | null;
    enctype: string | null;
    elementCount: number;
    selector: string;
  };
  
  // Field information (for change events)
  field?: {
    name: string | null;
    id: string | null;
    type: string;
    value: string | null; // Redacted for sensitive fields
    placeholder: string | null;
    required: boolean;
    selector: string;
  };
  
  // Event type information
  eventType: 'submit' | 'change' | 'focus' | 'blur';
  
  // Submission details (for submit events)
  submission?: {
    isValid: boolean;
    errorCount: number;
    filledFieldCount: number;
    requiredFieldCount: number;
    timeToSubmit: number; // Time from first interaction to submit
  };
  
  // Interaction timing
  timing: {
    timeOnPage: number;
    timeInForm: number | null; // Time since first interaction with form
    timeSinceLastInteraction: number | null;
  };
  
  // Context
  context: {
    formIndex: number; // Position of form on page (0-based)
    fieldIndex?: number; // Position of field in form (0-based)
    totalFormsOnPage: number;
  };
} 