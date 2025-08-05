import { CruxstackConfig, Event } from "../common/types";
import { SessionManager } from "./session";
import { EventQueue } from "./queue";
import { ApiClient } from "./api";
import { EventTracker } from "./tracker";
import {
  setupAutocapture,
  AutocaptureTrackers,
  ClickEventData,
  FormEventData,
  PageViewEventData,
} from "../features/autocapture";

let sessionManager: SessionManager;
let eventQueue: EventQueue;
let apiClient: ApiClient;
let eventTracker: EventTracker;
let autocaptureCleanup: (() => void) | null = null;
let globalConfig: CruxstackConfig | null = null;

// Store event listener references for proper cleanup
let unloadHandler: (() => void) | null = null;
let onlineHandler: (() => void) | null = null;

// Generate plain UUID for event IDs
function generateEventId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function init(config: CruxstackConfig) {
  try {
    // Prevent multiple initializations
    if (eventTracker && globalConfig) {
      if (config.debugLog) {
        console.warn(
          "Cruxstack: SDK already initialized. Skipping re-initialization."
        );
      }
      return;
    }

    // Validate config
    if (!config.clientId) {
      throw new Error(
        "Cruxstack: clientId is required. Please provide a valid client identifier."
      );
    }

    if (typeof config.clientId !== "string" || config.clientId.trim() === "") {
      throw new Error("Cruxstack: clientId must be a non-empty string.");
    }

    // Store config globally
    globalConfig = config;

    // Initialize core modules
    sessionManager = new SessionManager(config);
    eventQueue = new EventQueue();
    apiClient = new ApiClient(config.debugLog || false, config.clientId);
    eventTracker = new EventTracker(
      apiClient,
      eventQueue,
      sessionManager,
      config.clientId
    );

    // Set up autocapture tracking functions
    const autocaptureTrackers: AutocaptureTrackers = {
      trackClick: (data: ClickEventData) => {
        eventTracker.track({
          type: "click",
          data,
          id: generateEventId(),
          clientId: config.clientId,
        });
      },

      trackForm: (data: FormEventData) => {
        eventTracker.track({
          type: `form_${data.eventType}`,
          data,
          id: generateEventId(),
          clientId: config.clientId,
        });
      },

      trackPageView: (data: PageViewEventData) => {
        eventTracker.track({
          type: "pageview",
          data,
          id: generateEventId(),
          clientId: config.clientId,
        });
      },
    };

    // Initialize autocapture
    autocaptureCleanup = setupAutocapture(autocaptureTrackers, config);

    // Set up unload handler to flush remaining events
    const handleUnload = () => {
      eventTracker.flushQueue();
    };

    unloadHandler = handleUnload;
    // Only use pagehide event - it's more reliable and fires once
    window.addEventListener("pagehide", handleUnload);

    // Set up online/offline handling
    const handleOnline = () => {
      if (config.debugLog) {
        console.log("Cruxstack: Connection restored, flushing queue");
      }
      eventTracker.flushQueue();
    };

    onlineHandler = handleOnline;
    window.addEventListener("online", handleOnline);

    if (config.debugLog) {
      console.log("Cruxstack: SDK initialized successfully", {
        clientId: config.clientId,
        autoCapture: config.autoCapture !== false,
        userId: config.userId || "anonymous",
      });

      // Set debug flag for form events
      (window as any).cruxstackDebug = true;
    }
  } catch (error) {
    console.error("Cruxstack: Error during initialization:", error);
    throw error;
  }
}

export function trackEvent(eventData: {
  type: string;
  data?: Record<string, any>;
}) {
  if (!eventTracker || !globalConfig) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() with your configuration before tracking events."
    );
  }

  if (!eventData.type || typeof eventData.type !== "string") {
    throw new Error("Cruxstack: Event type is required and must be a string.");
  }

  if (eventData.type.trim() === "") {
    throw new Error(
      "Cruxstack: Event type cannot be empty or contain only whitespace."
    );
  }

  // Validate data structure
  if (
    eventData.data !== undefined &&
    (typeof eventData.data !== "object" || eventData.data === null)
  ) {
    throw new Error("Cruxstack: Event data must be an object or undefined.");
  }

  eventTracker.track({
    id: generateEventId(),
    type: eventData.type,
    data: eventData.data || {},
    clientId: globalConfig.clientId,
  });
}

// Public API to manually flush the queue
export function flushEvents() {
  if (!eventTracker) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() before flushing events."
    );
  }

  return eventTracker.flushQueue();
}

// Public API to get current session info
export function getSessionInfo() {
  if (!sessionManager) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() before getting session info."
    );
  }

  return {
    sessionId: sessionManager.getSessionId(),
    userId: sessionManager.getUserId(),
    isInitialized: isInitialized(),
  };
}

// Utility function to check if SDK is initialized
export function isInitialized(): boolean {
  return eventTracker !== undefined && globalConfig !== null;
}

// Utility function to get current configuration
export function getConfig(): CruxstackConfig | null {
  if (!globalConfig) {
    return null;
  }

  // Return a copy to prevent external modification
  return { ...globalConfig };
}

// Debug function to check queue status
export function getQueueStatus(): { length: number; events: Event[] } | null {
  if (!eventTracker) {
    return null;
  }

  return eventTracker.getQueueStatus();
}

// Debug function to clear queue
export function clearQueue(): void {
  if (!eventTracker) {
    console.warn("Cruxstack: Cannot clear queue - SDK not initialized");
    return;
  }

  eventTracker.clearQueue();
}

// Utility function to reset session (useful for testing or logout scenarios)
export function resetSession(): void {
  if (!sessionManager) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() before resetting session."
    );
  }

  sessionManager.resetSession();

  if (globalConfig?.debugLog) {
    console.log("Cruxstack: Session reset successfully");
  }
}

// Cleanup function
export function cleanup() {
  if (autocaptureCleanup) {
    try {
      autocaptureCleanup();
    } catch (error) {
      if (globalConfig?.debugLog) {
        console.error("Cruxstack: Error during autocapture cleanup:", error);
      }
    }
    autocaptureCleanup = null;
  }

  // Remove event listeners
  if (unloadHandler) {
    try {
      window.removeEventListener("pagehide", unloadHandler);
    } catch (error) {
      if (globalConfig?.debugLog) {
        console.error(
          "Cruxstack: Error removing pagehide event listener:",
          error
        );
      }
    }
    unloadHandler = null;
  }

  if (onlineHandler) {
    try {
      window.removeEventListener("online", onlineHandler);
    } catch (error) {
      if (globalConfig?.debugLog) {
        console.error(
          "Cruxstack: Error removing online event listener:",
          error
        );
      }
    }
    onlineHandler = null;
  }

  // Reset session
  if (sessionManager) {
    try {
      sessionManager.resetSession();
    } catch (error) {
      if (globalConfig?.debugLog) {
        console.error(
          "Cruxstack: Error resetting session during cleanup:",
          error
        );
      }
    }
  }

  // Clear global config
  globalConfig = null;
}
