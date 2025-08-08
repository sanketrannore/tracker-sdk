# Cruxstack Web SDK

A lightweight, privacy-focused JavaScript SDK for web analytics and event tracking. Built with TypeScript, featuring automatic event capture, event-time environment snapshots, intelligent queuing, and robust error handling.

## 🚀 Quick Start

### Installation

```bash
npm install @sanketrannore/tracker-sdk
```

### Basic Setup

```javascript
import { init, cruxCustom } from '@sanketrannore/tracker-sdk';

// Initialize the SDK
init({
  clientId: 'your-client-id',
  customerId: 'customer-123',        // optional
  customerName: 'your-customer-name',// optional
  // userId: 'user-123',             // optional; omit to keep user anonymous
  autoCapture: true,                 // optional, defaults to true
  debugLog: false                    // optional, defaults to false
});

// Track custom events
cruxCustom('purchase_completed', {
  amount: 99.99,
  product: 'premium_plan',
  currency: 'USD'
});
```

## 📖 API Reference

### Configuration

```typescript
interface CruxstackConfig {
  clientId: string;         // Required: Your client identifier
  customerId?: string;      // Optional: Customer identifier
  customerName?: string;    // Optional: Human-readable customer name
  userId?: string;          // Optional: User identifier; omit for anonymous
  autoCapture?: boolean;    // Optional: Enable/disable automatic capture (default: true)
  debugLog?: boolean;       // Optional: Enable debug logging (default: false)
}
```

### Core Functions

#### `init(config: CruxstackConfig)`
Initializes the SDK with your configuration.

```javascript
init({
  clientId: 'my-client-123',
  customerId: 'customer-456',
  userId: 'user-456',
  autoCapture: true,
  debugLog: false
});
```

#### `cruxCustom(eventName: string, properties?: object)`
Tracks custom events with optional properties. Event IDs are automatically generated as UUIDs.

```javascript
// Basic event
cruxCustom('button_clicked');

// Event with properties
cruxCustom('purchase_completed', {
  amount: 99.99,
  product: 'premium_plan',
  currency: 'USD'
});

// Event with complex data
cruxCustom('user_action', {
  action: 'signup',
  source: 'homepage',
  campaign: 'summer-sale'
});
```

#### `getUserTraits(userId: string)`
Fetches user traits for the given user from the backend (API shape depends on your backend).

```javascript
// Get traits for specific user
const userTraits = await getUserTraits('user-123');

// Example response
{
  userId: 'user-123',
  traits: {
    totalSessions: 15,
    averageSessionDuration: 1200,
    favoritePages: ['homepage', 'products'],
    userType: 'premium',
    lastActive: '2024-01-15T10:30:00Z'
  },
  lastUpdated: '2024-01-15T10:30:00Z'
}
```

<!-- Intentionally no generic callApiMethod exported by the SDK. -->

### Utility Functions

#### `getSessionInfo()`
Returns current session information.

```javascript
const sessionInfo = getSessionInfo();
console.log(sessionInfo);
// {
//   sessionId: "abc-123-def",
//   userId: "user-456",
//   isInitialized: true
// }
```

#### `flushEvents()`
Manually flush queued events to the server.

```javascript
// Force send all queued events
await flushEvents();
```

#### `getQueueStatus()`
Check the status of the event queue.

```javascript
const queueStatus = getQueueStatus();
console.log(queueStatus);
// {
//   length: 5,
//   events: [...]
// }
```

#### `clearQueue()`
Clear all queued events (use with caution).

```javascript
clearQueue(); // Removes all pending events
```

#### `resetSession()`
Reset the current session (useful for logout scenarios).

```javascript
resetSession(); // Creates a new session
```

#### `cleanup()`
Clean up the SDK and remove event listeners.

```javascript
cleanup(); // Remove listeners and reset state
```

## 🎯 Automatic Event Capture

The SDK automatically captures the following events:

### Clicks
- **Trigger**: User clicks on actionable elements
- **Data**: Element info, position, timing, context
- **Privacy**: Sensitive elements (passwords, emails) are ignored

### Form Interactions
- **Events**: `form_change`, `form_focus`, `form_blur`, `form_submit`
- **Data**: Form structure, field data, validation status
- **Privacy**: Input values are redacted for sensitive fields

### Page Views
- **Trigger**: Page load, SPA route changes (pushState/replaceState/popstate/hashchange)
- **Data (ev only)**: session metrics, timing, scroll depth percentage
- **SPA Support**: Automatic detection for SPA navigations

## 🔧 Advanced Usage

### Custom Event Properties

```javascript
cruxCustom('user_action', {
  // User context
  userId: 'user-123',
  userType: 'premium',
  
  // Business data
  productId: 'prod-456',
  category: 'electronics',
  price: 299.99,
  
  // Custom metadata
  source: 'homepage',
  campaign: 'summer-sale',
  timestamp: Date.now()
});
```

### Session Management

```javascript
// Get current session info
const session = getSessionInfo();

// Reset session (useful for logout)
resetSession();

// Check if SDK is initialized
if (isInitialized()) {
  // SDK is ready
}
```

### Debug Mode

```javascript
init({
  clientId: 'your-client-id',
  debugLog: true // Enable debug logging
});

// Check queue status in console
console.log(getQueueStatus());
```

### API Data Fetching

```javascript
// Fetch user traits for personalization
async function loadUserProfile() {
  try {
    const traits = await getUserTraits();
    console.log('User traits:', traits);
    
    // Use traits for personalization
    if (traits.traits.userType === 'premium') {
      showPremiumFeatures();
    }
  } catch (error) {
    console.error('Failed to load user traits:', error);
  }
}

// Fetch multiple data sources
async function loadDashboardData() {
  try {
    const [traits, analytics] = await Promise.all([
      getUserTraits(),
      callApiMethod('getUserAnalytics', { dateRange: 'last_7_days' })
    ]);
    
    console.log('Dashboard loaded:', { traits, analytics });
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

// Dynamic method calls
async function callDynamicMethod(methodName, params) {
  try {
    const result = await callApiMethod(methodName, params);
    return result;
  } catch (error) {
    console.error(`Method ${methodName} failed:`, error);
    throw error;
  }
}
```

## 🛡️ Privacy & Security

### Automatic Data Filtering
- **Password fields** are never tracked
- **Email addresses** are redacted
- **Credit card data** is filtered
- **Sensitive form fields** are ignored

### GDPR Compliance
- **Session-based tracking** with automatic expiration
- **No persistent user identification** without explicit consent
- **Easy data deletion** via `clearQueue()` and `resetSession()`

### Custom Privacy Controls
```javascript
// Add data attributes to ignore elements
<button data-cruxstack-ignore>Don't track this</button>

// Ignore sensitive forms
<form data-cruxstack-ignore>
  <input type="password" />
</form>
```

## 🔄 Offline Support

The SDK automatically handles offline scenarios:

1. **Events are queued** in localStorage when offline or on network errors
2. **Automatic retry** when connection is restored; SDK also flushes once on init
3. **Persistent storage** survives page refreshes
4. **Batch processing** for efficient network usage

## 🚨 Error Handling

### Network Failures
- **5xx/Network**: Events are queued and retried
- **4xx**: Treated as permanent failures (not retried)

### Queue Management
- **Maximum 1000 events** in queue to prevent memory issues
- **Automatic cleanup** of old events when limit is reached
- **Batch processing** of 10 events at a time

## 🌐 Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+
- **Features**: ES2017+, localStorage, fetch API, Performance API

## 📦 Build Outputs

The SDK is built with Rollup and provides multiple output formats:

- **CommonJS** (`dist/index.js`): For Node.js environments
- **ES Modules** (`dist/index.mjs`): For modern bundlers
- **UMD** (`dist/index.min.js`): For browser CDN usage (minified)

## 🔧 Development

### TypeScript Support
```typescript
import { init, cruxCustom, CruxstackConfig } from '@sanketrannore/tracker-sdk';

const config: CruxstackConfig = {
  clientId: 'my-client',
  userId: 'user-123'
};

init(config);
cruxCustom('test_event', { data: 'value' });
```

### Debug Mode
```javascript
init({
  clientId: 'your-client-id',
  debugLog: true
});

// Check browser console for detailed logs
```