# NetPulse (Manifest V3 Chrome Extension)

Production-ready cellular router telemetry monitor and automated Speedtest / Fast.com performance correlation engine. Built specifically for 5G/LTE gateway diagnostics (optimized for the **Zyxel NR5103E** and all gateways across `192.168.*.*`).

---

## Key Architecture & Capabilities

1. **Zyxel NR5103E & Gateway RF Telemetry Scraper (`scripts/router_scraper.js`)**
   - Automatically detects and monitors any router interface on `http` or `https` matching `192.168.*.*` (including iframes via `all_frames: true`).
   - Injects a sleek, non-intrusive status HUD in the router page header with live sync indicators and manual sync triggers.
   - Extracts: **RSRP**, **SINR**, **RSRQ**, **RSSI**, **Primary Band**, **Physical Cell ID (PCI)**, **Cell ID**, **DL/UL Bandwidth**, and **Carrier Aggregation (CA) secondary component carriers**.
   - Commits telemetry snapshots directly to `chrome.storage.local`.

2. **Automated Speedtest & Fast.com Completion Interceptor (`scripts/speedtest_scraper.js`)**
   - Auto-detects Speedtest.net and Fast.com as soon as they are opened.
   - Injects an on-page status HUD indicating active monitoring with an instant "Capture Now" button.
   - Utilizes `MutationObserver` to passively detect test completion states.
   - Extracts Download, Upload, Ping, and Jitter.
   - Pairs each finished test with the latest router RF snapshot and records a structured entry to `netpulse_history`.
   - Displays a subtle flat toast notification confirming paired metrics.

3. **Centralized Evaluation & Diagnostic Advice Engine (`shared/evaluator.js`)**
   - 3GPP and Cellular RF engineering standard benchmark evaluation:
     - **RSRP**: `>= -80` (Excellent) | `-80 to -90` (Good) | `-90 to -100` (Fair) | `< -100` (Poor)
     - **SINR**: `>= 20` (Excellent) | `13 to 19` (Good) | `5 to 12` (Fair) | `< 5` (Poor)
     - **RSRQ**: `>= -9` (Clean) | `-10 to -15` (Congested) | `< -15` (Heavy Load)
     - **RSSI**: `>= -65` (Strong) | `-66 to -75` (Good) | `-76 to -85` (Fair) | `< -85` (Weak)
   - Evaluates combinations of RF signal level vs. tower load to synthesize plain-text engineering advice (e.g. diagnosing whether throughput drops are caused by RF path loss or sector tower congestion).

4. **Complete Internationalization (i18n) & RTL Engine (`shared/i18n.js`)**
   - Full bilingual support for **English (LTR)** and **Arabic (العربية - RTL)** with persistent storage in `netpulse_lang`.
   - Complete technical translation coverage for RF metrics, diagnostic engineering advice, table headers, buttons, and confirmation dialogs.
   - Dynamic directional switching applying `dir="rtl"` and flipping grid alignments, paddings, and status badges.

5. **Flat Minimalist Dual-Theme Engine (Dark Mode & Light Mode)**
   - Zero-gradient flat design preserved across both dark (`#0b0f19` / `#111827`) and light (`#f8fafc` / `#ffffff`) palettes.
   - One-click theme toggle (Sun / Moon vector icons) in Popup and Dashboard with persistent storage in `netpulse_theme`.

6. **Interactive "Clear All Data" Confirmation Workflow**
   - Centered modal dialog with solid dark/light backdrop overlay.
   - Supports keyboard `Escape` dismissal, backdrop click dismissal, and cancel action.
   - Safely flushes telemetry history without wiping user preferences (preserves language and theme).

7. **Compact Quick Popup (`popup/popup.html`)**
   - 380px compact window with active tab auto-detection banner.
   - Language selector and theme toggle buttons.
   - **Dual Manual Scan Buttons**:
     - `Manual Check / Scan Router Tab`: Force-scrapes the active router gateway across all frames.
     - `Manual Capture Speedtest Tab`: Force-captures the current active or open Speedtest/Fast.com test results.
   - Fast summary of live RSRP, SINR, RSRQ, RSSI, Band, and Bandwidth.
   - Summary card of the most recent Speedtest run.
   - Flat Indigo button: "Open Full Analytics Dashboard".

8. **Full-Page Standalone Analytics Dashboard (`dashboard/dashboard.html`)**
   - Dedicated browser tab with live gauges, Carrier Aggregation breakdown, and Diagnostic Advice engine.
   - Topbar actions: `Scan Router Tab`, `Capture Speedtest Tab`, `Simulate Telemetry`, `Refresh`, `Language Selector`, `Theme Switcher`, and `Open Router GUI`.
   - Searchable, filterable, and sortable Speedtest and RF correlation history log.
   - One-click RFC-4180 CSV export and JSON export.
   - Interactive modal for "Clear All Data".

---

## Strict Aesthetic Compliance

- **ZERO GRADIENTS**: 100% solid, matte, flat colors across both Dark Mode and Light Mode.
- **ZERO UNICODE EMOJIS**: Strictly zero emoji characters across HTML, CSS, JavaScript, toasts, and alerts.
- **VECTOR ICONS ONLY**: Crisp, lightweight inline SVG icons with sharp geometric paths.
- **MONOSPACE TYPOGRAPHY**: Numeric telemetry, IPs, and timestamps rendered with monospace typography (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).

---

## Directory Structure

```
NetPulse/
├── manifest.json              # Manifest V3 configuration & permissions
├── background.js              # Service worker (lifecycle, badge updates, message bus)
├── shared/
│   ├── evaluator.js           # Centralized RF benchmarks and diagnostic advice engine
│   └── i18n.js                # Bilingual dictionary (EN/AR) & LTR/RTL translation engine
├── icons/
│   ├── icon.svg               # Vector source icon
│   ├── icon16.png             # 16x16 PNG extension icon
│   ├── icon48.png             # 48x48 PNG extension icon
│   └── icon128.png            # 128x128 PNG extension icon
├── popup/
│   ├── popup.html             # Compact popup view with active tab auto-detection
│   ├── popup.css              # Zero-gradient flat dark/light styling & RTL support
│   └── popup.js               # Quick metrics, router scan & speedtest capture triggers
├── dashboard/
│   ├── dashboard.html         # Dedicated full-browser analytics dashboard
│   ├── dashboard.css          # Modular grid layout with flat meters, themes & RTL
│   └── dashboard.js           # Live updates, modal workflow, CSV/JSON export
└── scripts/
    ├── router_scraper.js      # Zyxel NR5103E & 192.168.* scraper with on-page HUD & polling
    └── speedtest_scraper.js   # Automated observer for Speedtest.net & Fast.com with HUD
```

---

## Installation & Developer Mode Setup

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** (or click the circular refresh icon if already loaded).
4. Select the directory: `c:\Users\Gaming\Desktop\Folders-Z\userscript\NetPulse`.
5. NetPulse will now auto-detect router gateways on `192.168.*` and automatically monitor Speedtest.net and Fast.com with manual scan buttons available at all times.
