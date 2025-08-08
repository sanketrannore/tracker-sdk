# Cruxstack Web SDK – Developer Guide

Internal documentation for contributors. See README for user-facing usage.

## Architecture

```
src/
├── index.ts              # Public API exports
├── common/types.ts       # Shared TypeScript interfaces
├── core/                 # Core SDK functionality
│   ├── init.ts           # SDK initialization and public API
│   ├── tracker.ts        # Event tracking orchestration
│   ├── apiClient.ts      # HTTP communication
│   ├── queue.ts          # Event queuing and persistence
│   ├── session.ts        # Session management
│   └── utils/env.ts      # Environment snapshot utilities
├── features/autocapture/ # Automatic event capture
│   ├── index.ts          # Autocapture setup
│   ├── common/           # Shared utilities
│   ├── clicks/           # Click tracking
│   ├── forms/            # Form tracking
│   └── pageViews/        # Page view tracking
└── trackers/
    └── customEvents.ts   # Manual event tracking
```

## Data Model

### Internal Event
```typescript
interface Event {
  id: string;
  type: string;
  data: Record<string, any>;        // ev payload
  timestamp: number;
  sessionId: string;
  userId: string | undefined;
  clientId: string;
  customerId?: string;
  env: EnvSnapshot;                 // Required by sender
}
```

### Wire ApiEvent
```typescript
interface ApiEvent {
  // Envelope
  cid?: string;                     // customerId
  cna?: string;                     // customerName
  uid?: string;                     // userId (undefined if anonymous)
  eid: string;                      // eventId
  dtm: number;                      // timestamp
  e: string;                        // event type (snake_case)
  tv: string;                       // version
  sid: string;                      // sessionId
  tna: string;                      // tracker name

  // Flattened environment snapshot (short keys)
  ua: string;                       // userAgent
  sh: number;                       // screen height
  sw: number;                       // screen width
  l: string;                        // language
  tz: string;                       // timezone
  p: string;                        // platform
  an: boolean;                      // anonymous
  vh: number;                       // viewport height
  vw: number;                       // viewport width
  pt: string;                       // page title
  pu: string;                       // page url
  pp: string;                       // page path
  pd: string;                       // page domain
  pl: number | null;                // page load time
  pr: string | null;                // page referrer
  ip: string | null;                // ip address

  ev: Record<string, any>;          // Event-specific payload only
}
```

**Key Rule**: Environment snapshot is captured once at event time and must be present for all events (queued or immediate). Sender never reads from the DOM.

## Event Lifecycle

1. **Capture**: Autocapture handler extracts ev-only data and sanitizes via `privacy.ts`
2. **Create**: `EventTracker.track()` creates event, captures `env` via `captureEnvSnapshot(userId, apiClient.getCachedIp())`
3. **Send**: Immediate send via `apiClient.sendEvent(event)`
4. **Queue**: On retryable error, event is persisted to queue; queue is flushed on `online` and once on next `init()`

## Core Modules

### Initialization (`init.ts`)
- Validates configuration and prevents multiple initializations
- Initializes core modules (SessionManager, EventQueue, ApiClient, EventTracker)
- Sets up autocapture tracking and event listeners
- Flushes queue once on init to ensure delivery of persisted events

### Event Tracker (`tracker.ts`)
- Orchestrates event creation, sending, and queue management
- Captures immutable env snapshot at event time
- Attempts immediate send, queues on failure

### API Client (`apiClient.ts`)
- Transport layer with response handling
- Requires `event.env` and never re-reads live DOM
- Tolerates non-JSON success bodies (e.g., plain "ok")
- `tna = 'web'`, `tv = 'v1'`

### Event Queue (`queue.ts`)
- LocalStorage-backed queue with batching (batch size: 10, max: 1000)
- Persists events across page reloads
- Automatic cleanup of oldest events when limit reached

### Session Manager (`session.ts`)
- Session lifecycle: 30min inactivity, 4hr max duration
- sessionStorage persistence with memory fallback
- Generates session IDs and manages user IDs from config

## Autocapture System

### Event Types
- **Clicks**: Actionable elements only, throttled, privacy-filtered, includes position/context/timing
- **Forms**: change/focus/blur/submit events, debounced, redacted values, includes field/submission/context/timing
- **Page Views**: Initial + SPA navigation, includes session/timing/scrollDepthPercent

### Privacy & Filtering
- Sensitive selectors (passwords, emails, credit cards) are ignored
- Input values are redacted for sensitive fields
- `data-cruxstack-ignore` attributes respected
- Rate limiting and debouncing applied

### Adding New Autocapture

1. Create `features/autocapture/<feature>/{handlers,index,types}.ts`
2. Emit ev-only shape; sanitize via `cleanEventData`
3. Wire setup in `features/autocapture/index.ts` and add tracker to `AutocaptureTrackers`
4. Use snake_case event name; keep common fields out of ev

## Configuration

```typescript
interface CruxstackConfig {
  clientId: string;         // Required
  customerId?: string;      // Optional
  customerName?: string;    // Optional
  userId?: string;          // Optional (omit for anonymous)
  autoCapture?: boolean;    // Optional (default: true)
  debugLog?: boolean;       // Optional (default: false)
}
```

## Queue & Retry

- **Storage**: LocalStorage, max 1000 events (oldest trimmed), batch size 10
- **Flush triggers**: `online` listener and once on SDK `init()`
- **Error handling**: 4xx = permanent (not retried), 5xx/network = retryable

## IP Address

- Client-side fetch via `api.ipify.org` (3s timeout) cached in `ApiClient`
- Snapshot includes IP if available; not retroactively patched

## Debugging

- Enable `debugLog` to log requests and queue actions
- `getQueueStatus()` to inspect queue, `flushEvents()` to send now, `resetSession()` for testing

## Coding Standards

- TypeScript with meaningful names and early returns
- Keep public API stable; use short keys only in wire payload and `EnvSnapshot`
- Prefer small, testable functions; avoid inline comments; add concise comments above complex logic
