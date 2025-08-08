export interface ClickEventData {
  // Element information
  element: {
    tag: string;
    id: string | null;
    classes: string | null;
    text: string | null;
    href: string | null;
    selector: string;
    attributes: Record<string, string>;
  };
  
  // Mouse position and interaction details
  position: {
    x: number; // clientX
    y: number; // clientY
    pageX: number; // pageX
    pageY: number; // pageY
  };
  
  // Context
  context: {
    isContentEditable: boolean;
    hasChildren: boolean;
    parentTag: string | null;
    depth: number; // DOM depth from body
  };
  
  // Timing
  timing: {
    timeOnPage: number; // Time since page load
    timeSinceLastClick: number | null;
  };

  // Optional: Input meta for input clicks
  inputMeta?: {
    type: string | null;
    name: string | null;
    placeholder: string | null;
    label: string | null;
  };
} 