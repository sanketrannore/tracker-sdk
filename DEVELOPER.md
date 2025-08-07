# Cruxstack SDK v2 - Developer Guide

This document provides comprehensive technical details about the Cruxstack SDK architecture, implementation, and extension capabilities.

## 🏗️ Architecture Overview

The SDK follows a modular architecture with clear separation of concerns:

```
src/
├── index.ts              # Public API exports
├── common/
│   └── types.ts          # Shared TypeScript interfaces
├── core/                 # Core SDK functionality
│   ├── init.ts           # SDK initialization and public API
│   ├── tracker.ts        # Event tracking orchestration
│   ├── api.ts            # HTTP communication
│   ├── queue.ts          # Event queuing and persistence
│   └── session.ts        # Session management
├── features/             # Feature modules
│   └── autocapture/      # Automatic event capture
│       ├── index.ts      # Autocapture setup
│       ├── common/       # Shared utilities
│       ├── clicks/       # Click tracking
│       ├── forms/        # Form tracking
│       └── pageViews/    # Page view tracking
└── trackers/             # Custom event trackers
    └── customEvents.ts   # Manual event tracking
```

## 🔧 Core Modules

### 1. Initialization (`src/core/init.ts`)

The central orchestrator that initializes all modules and provides the public API.

#### Key Functions:

**`init(config: CruxstackConfig)`**
- Validates configuration
- Initializes core modules (SessionManager, EventQueue, ApiClient, EventTracker)
- Sets up autocapture tracking
- Configures event listeners (pagehide, online)
- Implements singleton pattern to prevent multiple initializations

**`cruxCustom(eventName, properties, eventId)`**
- Public API for manual event tracking
- Validates input parameters
- Delegates to EventTracker.track()

#### Module Dependencies:
```typescript
import { SessionManager } from "./session";
import { EventQueue } from "./queue";
import { ApiClient } from "./api";
import { EventTracker } from "./tracker";
import { setupAutocapture } from "../features/autocapture";
```

### 2. Event Tracker (`src/core/tracker.ts`)

Orchestrates event creation, sending, and queue management.

#### Key Methods:

**`track(eventData)`**
```typescript
async track(eventData: Omit<Event, 'sessionId' | 'userId' | 'timestamp'>): Promise<void> {
  // 1. Create complete event with session data
  const event: Event = {
    ...eventData,
    appId: this.appId,
    sessionId: this.sessionManager.getSessionId(),
    userId: this.sessionManager.getUserId(),
    timestamp: Date.now()
  };

  try {
    // 2. Attempt immediate send
    const success = await this.apiClient.sendEvent(event);
    if (!success) return; // 400 errors are permanent
  } catch (error) {
    // 3. Queue for retry on non-400 errors
    this.eventQueue.add(event);
  }
}
```

**`flushQueue()`**
- Processes queued events in batches
- Handles retryable vs permanent failures
- Re-queues failed events for later retry

### 3. API Client (`src/core/api.ts`)

Handles HTTP communication with the backend server.

#### Key Features:

**Unload Scenario Detection**
```typescript
private isUnloadScenario(): boolean {
  return document.visibilityState === 'hidden';
}
```

**Error Classification**
```typescript
if (response.status === 400) {
  return false; // Permanent failure - don't retry
}
throw new Error(`HTTP ${response.status}`); // Retryable error
```

**Why This Matters:**
- **400 errors** = Bad data (invalid format, missing fields)
- **404/500 errors** = Server issues (temporary, will be fixed)
- **Network errors** = Connectivity issues (retryable)

### 4. Event Queue (`src/core/queue.ts`)

Manages event persistence and batching.

#### Key Features:

**localStorage Persistence**
```typescript
private saveToStorage(): void {
  const queueData = JSON.stringify(this.queue);
  localStorage.setItem(QUEUE_KEY, queueData);
}
```

**Batch Processing**
```typescript
getBatch(): Event[] {
  const batch = this.queue.splice(0, BATCH_SIZE); // BATCH_SIZE = 10
  this.saveToStorage();
  return batch;
}
```

**Size Management**
```typescript
if (this.queue.length >= MAX_QUEUE_SIZE) { // MAX_QUEUE_SIZE = 1000
  this.queue.shift(); // Remove oldest event
}
```

### 5. Session Manager (`src/core/session.ts`)

Manages user sessions and session data.

#### Session Rules:
- **30 minutes of inactivity** → New session
- **4 hours maximum duration** → New session
- **sessionStorage persistence** → Survives page reloads
- **Memory fallback** → If storage fails

## 🎯 Feature Modules

### Autocapture System (`src/features/autocapture/`)

The autocapture system automatically detects and tracks user interactions.

#### Architecture:
```
autocapture/
├── index.ts              # Main setup and coordination
├── common/               # Shared utilities
│   ├── constants.ts      # Configuration constants
│   ├── enrichment.ts     # Data enrichment utilities
│   └── privacy.ts        # Privacy and filtering logic
├── clicks/               # Click tracking
├── forms/                # Form tracking
└── pageViews/            # Page view tracking
```

#### Adding New Event Types

To add a new autocapture event type (e.g., scroll tracking):

1. **Create the event module:**
```typescript
// src/features/autocapture/scrolls/
├── index.ts
├── handlers.ts
└── types.ts
```

2. **Define the event type:**
```typescript
// src/features/autocapture/scrolls/types.ts
export interface ScrollEventData {
  scrollPosition: {
    x: number;
    y: number;
  };
  scrollDirection: 'up' | 'down' | 'left' | 'right';
  scrollPercentage: number;
  element: {
    tag: string;
    id: string | null;
    classes: string | null;
  };
}
```

3. **Create the handler:**
```typescript
// src/features/autocapture/scrolls/handlers.ts
export const processScrollEvent = (event: Event): ScrollEventData | null => {
  // Process scroll event and extract data
  // Apply privacy filters
  // Return enriched data or null if filtered
};

export const createScrollHandler = (trackingCallback: (data: ScrollEventData) => void) => {
  return throttle((event: Event) => {
    const scrollData = processScrollEvent(event);
    if (scrollData) {
      trackingCallback(scrollData);
    }
  }, SCROLL_THROTTLE_MS);
};
```

4. **Set up the capture:**
```typescript
// src/features/autocapture/scrolls/index.ts
export type ScrollTracker = (data: ScrollEventData) => void;

export const setupScrollCapture = (trackEvent: ScrollTracker): (() => void) => {
  const scrollHandler = createScrollHandler(trackEvent);
  
  window.addEventListener('scroll', scrollHandler, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', scrollHandler);
  };
};
```

5. **Integrate with main autocapture:**
```typescript
// src/features/autocapture/index.ts
import { setupScrollCapture, ScrollTracker } from './scrolls';

export interface AutocaptureTrackers {
  trackClick: ClickTracker;
  trackForm: FormTracker;
  trackPageView: PageViewTracker;
  trackScroll: ScrollTracker; // Add new tracker
}

export const setupAutocapture = (trackers: AutocaptureTrackers, config: CruxstackConfig): AutocaptureCleanup => {
  const cleanupFunctions: (() => void)[] = [];
  
  // Add scroll capture
  const scrollCleanup = setupScrollCapture(trackers.trackScroll);
  cleanupFunctions.push(scrollCleanup);
  
  // ... existing captures
  
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};
```

6. **Update the main init function:**
```typescript
// src/core/init.ts
const autocaptureTrackers: AutocaptureTrackers = {
  // ... existing trackers
  trackScroll: (data: ScrollEventData) => {
    eventTracker.track({
      type: 'scroll',
      data,
      id: generateEventId('scroll'),
      appId: config.appId,
    });
  },
};
```

### Privacy System (`src/features/autocapture/common/privacy.ts`)

Handles sensitive data filtering and privacy protection.

#### Key Functions:

**`shouldIgnoreElement(element)`**
- Checks if element matches sensitive selectors
- Filters password fields, email inputs, credit card fields
- Respects `data-cruxstack-ignore` attributes

**`redactSensitiveValue(element, value)`**
- Redacts sensitive input values
- Returns `[REDACTED_PASSWORD]` for password fields
- Returns `[REDACTED_EMAIL]` for email fields
- Returns character count for other inputs

**`cleanEventData(data)`**
- Removes sensitive fields from event data
- Cleans URLs of sensitive query parameters
- Ensures GDPR compliance

### Data Enrichment (`src/features/autocapture/common/enrichment.ts`)

Adds contextual data to events.

#### Key Functions:

**`getCommonProperties()`**
- Browser information (userAgent, screen size, language)
- Page information (URL, title, referrer)
- Performance metrics (load time, viewport size)
- Timing information (timestamp, performance.now)

**`getElementSelector(element)`**
- Generates CSS selector for element identification
- Handles IDs, classes, and nth-child selectors
- Limits depth for performance

## 🔄 Event Flow Architecture

### 1. Event Capture Flow

```
User Action → DOM Event → Autocapture Handler → Data Processing → Privacy Filtering → Event Creation → EventTracker.track()
```

### 2. Event Processing Flow

```
EventTracker.track() → Event Enrichment → Immediate Send Attempt → Success/Failure → Queue Management
```

### 3. Queue Processing Flow

```
flushQueue() → Batch Retrieval → Individual Send → Error Classification → Re-queuing → Storage Update
```

### 4. Error Handling Flow

```
API Error → Error Classification → Permanent (400) vs Retryable (404/500/Network) → Queue Management → Retry Logic
```

## 🛠️ Extension Points

### Adding New Event Types

The SDK is designed for easy extension. Here are the key extension points:

#### 1. Custom Event Trackers
```typescript
// src/trackers/myCustomTracker.ts
export function trackCustomEvent(eventName: string, data: any) {
  // Your custom logic
  cruxCustom(eventName, data);
}
```

#### 2. Custom Autocapture
Follow the pattern in the "Adding New Event Types" section above.

#### 3. Custom API Client
```typescript
// Extend ApiClient for custom endpoints
export class CustomApiClient extends ApiClient {
  async sendCustomEvent(event: CustomEvent): Promise<boolean> {
    // Custom implementation
  }
}
```

#### 4. Custom Queue Implementation
```typescript
// Implement custom storage (IndexedDB, etc.)
export class CustomEventQueue extends EventQueue {
  private async saveToStorage(): Promise<void> {
    // Custom storage implementation
  }
}
```

## 🔧 Configuration Options

### Core Configuration
```typescript
interface CruxstackConfig {
  appId: string;           // Required: Application identifier
  userId?: string;         // Optional: User identifier
  autoCapture?: boolean;   // Optional: Enable autocapture (default: true)
  debugLog?: boolean;      // Optional: Debug logging (default: false)
}
```

### Privacy Configuration
```typescript
// src/features/autocapture/common/constants.ts
export const SENSITIVE_SELECTORS = [
  'input[type="password"]',
  'input[type="email"]',
  // ... more selectors
];

export const PRIVACY_SETTINGS = {
  REDACT_INPUT_VALUES: true,
  CAPTURE_FORM_DATA: false,
  MAX_SELECTOR_DEPTH: 10
};
```

### Queue Configuration
```typescript
// src/core/queue.ts
const BATCH_SIZE = 10;           // Events per batch
const MAX_QUEUE_SIZE = 1000;     // Maximum queued events
const QUEUE_KEY = 'cruxstack';   // localStorage key
```

### Session Configuration
```typescript
// src/core/session.ts
const SESSION_DURATION = 30 * 60 * 1000;        // 30 minutes
const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
const SESSION_STORAGE_KEY = 'cruxstack_session';
```

## 🧪 Testing Strategy

### Unit Testing
- Test each module in isolation
- Mock dependencies for clean testing
- Test error scenarios and edge cases

### Integration Testing
- Test complete event flows
- Test queue persistence and recovery
- Test offline/online scenarios

### Browser Testing
- Test across different browsers
- Test with different network conditions
- Test with various privacy settings

## 🚀 Performance Considerations

### Bundle Size
- Tree-shaking friendly exports
- Minimal dependencies
- Efficient data structures

### Runtime Performance
- Throttled event handlers
- Debounced form events
- Efficient DOM queries
- Minimal memory footprint

### Network Efficiency
- Batch processing
- Compressed payloads
- Intelligent retry logic
- Connection-aware sending

## 🔒 Security Considerations

### Data Protection
- Input validation and sanitization
- Sensitive data filtering
- Secure storage practices
- XSS prevention

### Privacy Compliance
- GDPR compliance features
- Data minimization
- User consent handling
- Easy data deletion

## 📈 Monitoring and Debugging

### Debug Mode
```javascript
init({
  appId: 'your-app-id',
  debugLog: true
});
```

### Queue Monitoring
```javascript
const status = getQueueStatus();
console.log('Queue length:', status.length);
console.log('Queued events:', status.events);
```

### Session Monitoring
```javascript
const session = getSessionInfo();
console.log('Session ID:', session.sessionId);
console.log('User ID:', session.userId);
```
