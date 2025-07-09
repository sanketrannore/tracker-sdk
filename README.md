# @sanketrannore/tracker-sdk

A modern, modular, privacy-aware JavaScript SDK for web analytics.  
Auto-captures user activity and button clicks, with plugin support, out-of-the-box event enrichment, and easy integration with [audienz.ai](https://audienz.ai) or any web app.

---

## Table of Contents

- [@sanketrannore/tracker-sdk](#sanketrannoretracker-sdk)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Basic Installation](#basic-installation)
  - [Custom Event Tracking](#custom-event-tracking)
  - [Configuration Options](#configuration-options)
  - [Plugins](#plugins)
  - [Example enabling plugins:](#example-enabling-plugins)
  - [API](#api)
  - [Example: Advanced Usage](#example-advanced-usage)
  - [License](#license)
  - [Keywords](#keywords)

---

## Features

- Automatic page view and button click tracking
- Snowplow-based event enrichment (user, device, session, geo, etc.)
- Pluggable architecture for custom analytics
- Consent and privacy controls (plugin)
- TypeScript types and ESM/CJS compatibility
- Monitoring integration (HyperDX)

---

## Installation

```sh
npm install @sanketrannore/tracker-sdk
```

## Basic Installation

```js
import { initAnalytics } from "@sanketrannore/tracker-sdk";

// Minimal config for web tracking
const analytics = initAnalytics({
  snowplow: {
    collectorUrl: "https://your-snowplow-collector.com",
    appId: "your-app-id",
    // See configuration below for advanced options
  },
  plugins: {
    autoCapture: true,
    buttonClicks: true,
    // consent: { ... }
  },
  monitoring: {
    // hyperdxConfig: { ... }
  },
});
```

## Custom Event Tracking

```js
analytics.trackEvent("purchase", {
  productId: "123",
  value: 49.99,
  currency: "USD",
});
```

## Configuration Options

| Option         | Type   | Description                                    |
| -------------- | ------ | ---------------------------------------------- |
| `collectorUrl` | string | Your Snowplow collector endpoint               |
| `appId`        | string | Unique app identifier                          |
| `plugins`      | object | Which plugins/features to enable               |
| `monitoring`   | object | HyperDX or custom monitoring config (optional) |

## Plugins

Our SDK is plugin-first. Toggle features as needed.

`autoCapture`:
Tracks page views, SPA route changes, and general user activity.

`buttonClicks`:
Tracks all button click events and enriches with context.

`consent`:
GDPR/CCPA consent plugin (coming soon).

## Example enabling plugins:

```js
plugins: {
  autoCapture: true,
  buttonClicks: true,
  consent: { required: true }
}
```

## API

`initAnalytics(config)`
Initializes the SDK and returns the tracking API.

Returns
| Method | Description |
| ------------------------- | ------------------------------------------------ |
| `trackEvent(name, props)` | Track custom events |
| `setUserId(userId)` | Set or update the current user ID |
| `optOut()` | Disable all tracking (if consent plugin enabled) |
| `shutdown()` | Cleanup listeners and stop tracking |

## Example: Advanced Usage

```js
const analytics = initAnalytics({
  snowplow: {
    collectorUrl: "https://collector.mycompany.com",
    appId: "audienz-ai",
  },
  plugins: {
    autoCapture: true,
    buttonClicks: true,
  },
});

// Set user ID
analytics.setUserId("user-789");

// Track a custom event
analytics.trackEvent("newsletter_signup", { email: "user@email.com" });

// Opt out (if consent enabled)
analytics.optOut();
```

## License

Apache License 2.0

---

## Keywords

`tracking` `web analytics` `events` `open source`
