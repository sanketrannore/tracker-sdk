# Cruxstack SDK

A lightweight, privacy-focused JavaScript SDK for web analytics and event tracking. Built with TypeScript, featuring automatic event capture, intelligent queuing, and robust error handling.


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
  appId: 'your-app-id',
  userId: 'user-123',
  autoCapture: true,  // optional, defaults to true
  debugLog: false     // optional, defaults to false
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
  appId: string;           // Required: Your application identifier
  userId?: string;         // Optional: User identifier
  autoCapture?: boolean;   // Optional: Enable/disable automatic capture (default: true)
  debugLog?: boolean;      // Optional: Enable debug logging (default: false)
}
```

### Core Functions

#### `init(config: CruxstackConfig)`
Initializes the SDK with your configuration.

```javascript
init({
  appId: 'my-app-123',
  userId: 'user-456',
  autoCapture: true,
  debugLog: false
});
```

#### `cruxCustom(eventName: string, properties?: object, eventId?: string)`
Tracks custom events with optional properties and event ID.

```javascript
// Basic event
cruxCustom('button_clicked');

// Event with properties
cruxCustom('purchase_completed', {
  amount: 99.99,
  product: 'premium_plan',
  currency: 'USD'
});

// Event with custom ID
cruxCustom('order_placed', { orderId: '12345' }, 'custom-event-id');
```

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
- **Trigger**: Page load, navigation, SPA route changes
- **Data**: URL, title, performance metrics, navigation type
- **SPA Support**: Automatic detection of single-page applications

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
  appId: 'your-app-id',
  debugLog: true // Enable debug logging
});

// Check queue status in console
console.log(getQueueStatus());
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

1. **Events are queued** in localStorage when offline
2. **Automatic retry** when connection is restored
3. **Persistent storage** survives page refreshes
4. **Intelligent batching** for efficient network usage

## 🚨 Error Handling

### Network Failures
- **404/500 errors**: Events are retried automatically
- **400 errors**: Permanent failures (bad data) are not retried
- **Network timeouts**: Events are queued for later retry

### Queue Management
- **Maximum 1000 events** in queue to prevent memory issues
- **Automatic cleanup** of old events when limit is reached
- **Batch processing** of 10 events at a time

## 🌐 Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+
- **Features**: ES2017+, localStorage, fetch API, Performance API

## 🔧 Development

### TypeScript Support
```typescript
import { init, cruxCustom, CruxstackConfig } from '@sanketrannore/tracker-sdk';

const config: CruxstackConfig = {
  appId: 'my-app',
  userId: 'user-123'
};

init(config);
cruxCustom('test_event', { data: 'value' });
```

### Debug Mode
```javascript
init({
  appId: 'your-app-id',
  debugLog: true
});

// Check browser console for detailed logs