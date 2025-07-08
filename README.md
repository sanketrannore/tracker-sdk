# @sanketrannore/tracker-sdk

Event tracking SDK for web applications.  
Includes auto-capture, button click tracking, and is designed to be modular, extensible, and privacy-aware.  
Built for the [audienz.ai](https://audienz.ai) platform, but can be used in any modern web project.

---

## Features

- **Automatic event capture:** Tracks page views, SPA route changes, and user activity
- **Button click tracking:** Automatically captures button click events (with enrichment)
- **Snowplow integration:** Events are enriched and forwarded using the Snowplow tracker
- **Plugin-based architecture:** Easily add or remove features (e.g., consent management, custom events)
- **TypeScript-first:** Full type safety and rich autocomplete in supported IDEs
- **Supports monitoring:** HyperDX integration for error/performance monitoring
- **Open-source, Apache 2.0 License**

---

## Installation

```sh
npm install @sanketrannore/tracker-sdk
```

Snowplow JavaScript Trackers Overview

import { initAnalytics } from '@sanketrannore/tracker-sdk';

const analytics = initAnalytics({
snowplow: {
collectorUrl: 'https://your-collector.com', // Snowplow collector endpoint
appId: 'audienz-web', // Your app ID
// ...other Snowplow config options
},
monitoring: {
// Optional: HyperDX or custom monitoring config
},
plugins: {
autoCapture: true,
buttonClicks: true,
consent: false // or provide options if using consent management
}
});

// Optionally, track custom events:
analytics.trackEvent('custom_event', { foo: 'bar' });

API Reference
initAnalytics(config): SDKApi
config.snowplow: Snowplow collector and app configuration

config.monitoring: Monitoring/HyperDX integration (optional)

config.plugins: Enable/disable core tracking features or plugins

Returns:
An SDK API object:

trackEvent(eventName, eventProps) — Manually track custom events

Plugins
Plugins are modular tracking features you can enable or disable.

autoCapture: Tracks page views, activity, and route changes automatically

buttonClicks: Tracks button click events sitewide

consent: Handles privacy consent (optional, coming soon)

Project Structure

src/
common/ # Types, utilities, constants
libraries/ # Core logic: Snowplow wrapper, emitter, monitoring
plugins/
tracker/ # Tracking plugins: autoCapture, buttonClicks, etc.
consent/ # Consent management plugin
web/ # Entry point for SDK
api-docs/ # Detailed API docs
dist/ # Built output (after build)

Development
Clone the repo:

sh
Copy
Edit
git clone https://github.com/sanketrannore/tracker-sdk.git
cd tracker-sdk
Install dependencies:

sh
Copy
Edit
npm install
Build:

sh
Copy
Edit
npm run build
Run tests:
(coming soon, Jest setup in progress)

Local test project:
See /api-docs/web.md for usage examples.

Publishing
Update version in package.json (npm version patch)

Publish:

sh
Copy
Edit
npm publish --access public
License
Apache 2.0

Contributing
Contributions and feedback are welcome!
Open issues or PRs for bugfixes, new plugins, or improvements
