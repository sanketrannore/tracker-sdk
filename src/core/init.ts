import { CruxstackConfig, Event } from "../common/types";
import { SessionManager } from "./session";
import { EventQueue } from "./queue";
import { ApiClient } from "./apiClient";
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
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
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
    apiClient = new ApiClient(
      config.clientId,
      config.customerId,
      config.customerName,
      config.debugLog || false
    );
    eventTracker = new EventTracker(apiClient, eventQueue, sessionManager, config.clientId, config.customerId);

    // Setup autocapture if enabled
    if (config.autoCapture !== false) {
      const autocaptureTrackers: AutocaptureTrackers = {
        trackClick: (data: ClickEventData) => {
          eventTracker.track({
            type: "click",
            data,
            id: generateEventId(),
            clientId: config.clientId,
            customerId: config.customerId,
          });
        },

        trackForm: (data: FormEventData) => {
          eventTracker.track({
            type: `form_${data.eventType}`,
            data,
            id: generateEventId(),
            clientId: config.clientId,
            customerId: config.customerId,
          });
        },

        trackPageView: (data: PageViewEventData) => {
          eventTracker.track({
            type: "page_view",
            data,
            id: generateEventId(),
            clientId: config.clientId,
            customerId: config.customerId,
          });
        },
      };
      
      autocaptureCleanup = setupAutocapture(autocaptureTrackers, config);
    }

    // Setup unload handler for queue flushing
    unloadHandler = () => {
      if (eventTracker && eventTracker.getQueueStatus().length > 0) {
        if (config.debugLog) {
          console.log("Cruxstack: Flushing events on page unload");
        }
        eventTracker.flushQueue();
      }
    };

    // Setup online handler for retry
    onlineHandler = () => {
      if (eventTracker && eventTracker.getQueueStatus().length > 0) {
        if (config.debugLog) {
          console.log("Cruxstack: Connection restored, retrying queued events");
        }
        eventTracker.flushQueue();
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", unloadHandler);
    window.addEventListener("online", onlineHandler);

    // Attempt to flush any queued events immediately on init (ensures delivery of persisted events)
    if (eventTracker.getQueueStatus().length > 0) {
      eventTracker.flushQueue();
    }

    if (config.debugLog) {
      console.log("Cruxstack: SDK initialized successfully", {
        clientId: config.clientId,
        customerId: config.customerId,
        autoCapture: config.autoCapture !== false,
        userId: config.userId,
      });
    }
  } catch (error) {
    console.error("Cruxstack: Initialization failed", error);
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
    customerId: globalConfig.customerId,
  });
}

// Public API methods for data fetching
export async function getUserTraits(userId: string): Promise<any> {
  if (!apiClient || !globalConfig) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() with your configuration before using API methods."
    );
  }

  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Cruxstack: userId must be a non-empty string.");
  }

  try {
    return await apiClient.getUserTraits(userId);
  } catch (error) {
    if (globalConfig.debugLog) {
      console.error("Cruxstack: Failed to fetch user traits", error);
    }
    throw error;
  }
}

export function getSessionInfo() {
  if (!sessionManager) {
    return {
      sessionId: null,
      userId: null,
      isInitialized: false,
    };
  }

  return {
    sessionId: sessionManager.getSessionId(),
    userId: sessionManager.getUserId(),
    isInitialized: true,
  };
}

export function flushEvents(): Promise<void> {
  if (!eventTracker) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() with your configuration."
    );
  }

  return eventTracker.flushQueue();
}

export function getQueueStatus() {
  if (!eventTracker) {
    return {
      length: 0,
      events: [],
    };
  }

  return eventTracker.getQueueStatus();
}

export function clearQueue() {
  if (!eventTracker) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() with your configuration."
    );
  }

  eventTracker.clearQueue();
}

export function resetSession() {
  if (!sessionManager) {
    throw new Error(
      "Cruxstack: SDK not initialized. Please call init() with your configuration."
    );
  }

  sessionManager.resetSession();
}

export function isInitialized(): boolean {
  return !!(eventTracker && globalConfig);
}

export function cleanup() {
  // Remove event listeners
  if (unloadHandler) {
    window.removeEventListener("beforeunload", unloadHandler);
    unloadHandler = null;
  }

  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }

  // Cleanup autocapture
  if (autocaptureCleanup) {
    autocaptureCleanup();
    autocaptureCleanup = null;
  }

  // Reset all modules
  sessionManager = null as any;
  eventQueue = null as any;
  apiClient = null as any;
  eventTracker = null as any;
  globalConfig = null;

  console.log("Cruxstack: SDK cleaned up successfully");
}

// Export autocapture types for advanced usage
export type { ClickEventData, FormEventData, PageViewEventData, AutocaptureTrackers };

