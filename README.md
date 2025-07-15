# @sanketrannore/tracker-sdk

A powerful, lightweight JavaScript SDK for comprehensive web analytics and event tracking. Automatically captures user interactions, page views, and custom events with rich contextual data.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Autocapture Features](#autocapture-features)
- [Custom Event Tracking](#custom-event-tracking)
- [API Reference](#api-reference)
- [Examples](#examples)
- [TypeScript Support](#typescript-support)
- [License](#license)

---

## Features

✅ **Automatic Event Capture**
- Button click tracking with comprehensive context
- Page view tracking with performance metrics
- Time-on-page tracking with formatted periods
- Browser, device, and environment information

✅ **Custom Event Tracking**
- Send custom business events with structured data
- Category-based event organization
- Flexible data payload support

✅ **Rich Data Collection**
- Element information (ID, classes, text, ARIA labels)
- Mouse interaction details (coordinates, modifiers)
- Form context and DOM hierarchy
- Performance timing and network information
- Meta tags and document properties

✅ **Developer Experience**
- TypeScript support with full type definitions
- Comprehensive error handling with custom error types
- Debug logging for development
- Configurable sampling and event limits
- ESM/CJS compatibility

---

## Installation

```bash
npm install @sanketrannore/tracker-sdk
```

---

## Quick Start

### Basic Setup

```javascript
import { cruxstack } from '@sanketrannore/tracker-sdk';

// Initialize the SDK
await cruxstack.init({
  appId: 'your-app-id',        // Required
  userId: 'user-123',          // Optional
  autoCapture: true,           // Optional (default: true)
  debugLog: false              // Optional (default: false)
});

// Track custom events
await cruxstack.trackCustom('purchase', {
  productId: '123',
  amount: 99.99,
  currency: 'USD'
});
```

### With Error Handling

```javascript
import { cruxstack, CruxSDKError } from '@sanketrannore/tracker-sdk';

try {
  await cruxstack.init({
    appId: 'your-app-id',
    userId: 'user-123',
    debugLog: true
  });
  
  await cruxstack.trackCustom('user_signup', {
    source: 'homepage',
    method: 'email'
  });
} catch (error) {
  if (error instanceof CruxSDKError) {
    console.error('SDK Error:', error.message, error.type, error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Configuration

### CruxstackConfig Interface

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appId` | `string` | ✅ **Yes** | - | Unique identifier for your application |
| `userId` | `string` | ❌ No | `undefined` | User identifier for session tracking |
| `autoCapture` | `boolean` | ❌ No | `true` | Enable automatic event capture |
| `debugLog` | `boolean` | ❌ No | `false` | Enable debug logging to console |

### Minimal Configuration

```javascript
// Only required parameter
await cruxstack.init({
  appId: 'my-app'
});
```

### Full Configuration

```javascript
await cruxstack.init({
  appId: 'my-app',
  userId: 'user-123',
  autoCapture: true,
  debugLog: true
});
```

---

## Autocapture Features

When `autoCapture` is enabled (default), the SDK automatically tracks:

### Button Click Tracking

Captures comprehensive data for all button clicks:

```javascript
// Automatically captured data includes:
{
  type: 'CLICK',
  timestamp: 1640995200000,
  elementInfo: {
    tagName: 'button',
    id: 'submit-btn',
    className: 'btn btn-primary',
    textContent: 'Submit Form',
    ariaLabel: 'Submit the form',
    // ... more element data
  },
  eventData: {
    buttonId: 'submit-btn',
    buttonText: 'Submit Form',
    buttonType: 'submit',
    clickCoordinates: {
      clientX: 150,
      clientY: 200,
      // ... more coordinates
    },
    // ... comprehensive event data
  }
}
```

### Page View Tracking

Captures detailed page view information:

```javascript
// Automatically captured data includes:
{
  type: 'PAGE_VIEW',
  timestamp: 1640995200000,
  eventData: {
    pageUrl: 'https://example.com/page',
    pageTitle: 'Page Title',
    referrer: 'https://google.com',
    performanceTiming: {
      navigationStart: 1640995200000,
      domContentLoadedEventEnd: 1640995201500,
      loadEventEnd: 1640995202000,
      // ... complete timing data
    },
    viewport: {
      width: 1920,
      height: 1080,
      // ... viewport data
    },
    // ... comprehensive page data
  }
}
```

### Disable Autocapture

```javascript
await cruxstack.init({
  appId: 'my-app',
  autoCapture: false  // Only custom events will be tracked
});
```

---

## Custom Event Tracking

### Basic Custom Events

```javascript
// Track a simple event
await cruxstack.trackCustom('button_click', {
  buttonId: 'hero-cta',
  section: 'homepage'
});

// Track an e-commerce event
await cruxstack.trackCustom('purchase', {
  orderId: 'order-123',
  productId: 'prod-456',
  amount: 99.99,
  currency: 'USD',
  quantity: 2
});
```

### Advanced Custom Events

```javascript
// Track user behavior
await cruxstack.trackCustom('feature_usage', {
  featureName: 'export_data',
  userId: 'user-123',
  timestamp: new Date().toISOString(),
  metadata: {
    fileFormat: 'csv',
    recordCount: 1500
  }
});

// Track form interactions
await cruxstack.trackCustom('form_submission', {
  formId: 'contact-form',
  fields: ['name', 'email', 'message'],
  validationErrors: [],
  submissionTime: Date.now()
});
```

### Custom Event Categories

Organize events by category for better analytics:

```javascript
// User actions
await cruxstack.trackCustom('user_action', { action: 'login', method: 'google' });

// Business events
await cruxstack.trackCustom('business_event', { event: 'subscription_upgrade' });

// Technical events
await cruxstack.trackCustom('technical_event', { event: 'api_error', code: 500 });
```

---


## API Reference

### cruxstack.init(config)

Initialize the SDK with configuration options.

**Parameters:**
- `config` (CruxstackConfig): Configuration object

**Returns:** `Promise<void>`

**Throws:** `CruxSDKError` if initialization fails

### cruxstack.trackCustom(category, data)

Send a custom event with category and data.

**Parameters:**
- `category` (string): Event category (required)
- `data` (Record<string, any>): Event data object (required)

**Returns:** `Promise<void>`

**Throws:** `CruxSDKError` if validation fails or sending fails

**Example:**
```javascript
await cruxstack.trackCustom('purchase', {
  productId: '123',
  amount: 99.99
});
```

---

## Examples

### E-commerce Tracking

```javascript
// Product view
await cruxstack.trackCustom('product_view', {
  productId: 'prod-123',
  productName: 'Premium Widget',
  category: 'electronics',
  price: 99.99,
  currency: 'USD'
});

// Add to cart
await cruxstack.trackCustom('add_to_cart', {
  productId: 'prod-123',
  quantity: 2,
  cartValue: 199.98
});

// Purchase
await cruxstack.trackCustom('purchase', {
  orderId: 'order-456',
  products: [
    { id: 'prod-123', quantity: 2, price: 99.99 }
  ],
  total: 199.98,
  currency: 'USD',
  paymentMethod: 'credit_card'
});
```

### User Journey Tracking

```javascript
// User registration
await cruxstack.trackCustom('user_registration', {
  userId: 'user-789',
  registrationMethod: 'email',
  source: 'homepage_banner',
  timestamp: new Date().toISOString()
});

// Feature usage
await cruxstack.trackCustom('feature_usage', {
  featureName: 'dashboard_export',
  userId: 'user-789',
  exportFormat: 'pdf',
  dataRange: '30_days'
});
```

### Error and Performance Tracking

```javascript
// Track application errors
await cruxstack.trackCustom('app_error', {
  errorType: 'javascript_error',
  errorMessage: error.message,
  errorStack: error.stack,
  userAgent: navigator.userAgent,
  url: window.location.href
});

// Track performance metrics
await cruxstack.trackCustom('performance_metric', {
  metricName: 'page_load_time',
  value: 1500,
  unit: 'milliseconds',
  page: '/dashboard'
});
```

---

## TypeScript Support

The SDK is built with TypeScript and provides comprehensive type definitions:

```typescript
import { cruxstack, CruxstackConfig } from '@sanketrannore/tracker-sdk';

// Type-safe configuration
const config: CruxstackConfig = {
  appId: 'my-app',
  userId: 'user-123',
  autoCapture: true,
  debugLog: false
};

// Type-safe custom events
interface PurchaseEvent {
  productId: string;
  amount: number;
  currency: string;
}

const purchaseData: PurchaseEvent = {
  productId: 'prod-123',
  amount: 99.99,
  currency: 'USD'
};

await cruxstack.trackCustom('purchase', purchaseData);
```

---


## License

Apache License 2.0

---

## Keywords

`analytics` `event-tracking` `web-analytics` `user-behavior` `javascript-sdk` `typescript`
