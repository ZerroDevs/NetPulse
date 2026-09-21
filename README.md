# NetPulse (Manifest V3 Chrome Extension)

[![Developer](https://img.shields.io/badge/Developer-@ZerroDevs-6366f1.svg)](https://github.com/ZerroDevs)
[![License](https://img.shields.io/badge/License-MIT-10b981.svg)](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE)
[![Manifest](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-3b82f6.svg)](manifest.json)
[![I18n](https://img.shields.io/badge/Languages-English%20%7C%20العربية%20(RTL)-f59e0b.svg)](shared/i18n.js)
[![Documentation](https://img.shields.io/badge/Documentation-Interactive%20Guide-6366f1.svg)](docs/index.html)
[![Tests](https://img.shields.io/badge/Verification-217%2B%20Passing-10b981.svg)](verify_netpulse.js)

**NetPulse** is a production-grade cellular router RF telemetry monitor and automated performance correlation engine. Designed specifically for 5G / 4G LTE fixed-wireless broadband gateways (optimized for the **Zyxel NR5103E** and all routers across `192.168.*.*`, `10.*.*.*`, and `172.16.*.*`), NetPulse bridges the gap between physical radio-frequency (RF) signal conditions and actual network throughput benchmarks.

Developed and maintained by **[@ZerroDevs](https://github.com/ZerroDevs)**.

---

## Developer Attribution & Documentation

- **Interactive Documentation**: [Complete Guide & Manual](docs/index.html)
- **Lead Developer**: [@ZerroDevs](https://github.com/ZerroDevs)
- **Author & Creator**: Osama Abdallatif ([Contact via WhatsApp](https://wa.me/218916808225))
- **GitHub Profile**: [https://github.com/ZerroDevs](https://github.com/ZerroDevs)
- **Project Repository**: [https://github.com/ZerroDevs/NetPulse](https://github.com/ZerroDevs/NetPulse)
- **License**: [MIT License](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE)

---

## Key Capabilities & Engineering Architecture

```
                                ┌──────────────────────────────────────────────┐
                                │      4G/5G Cellular Gateway Web GUI          │
                                │    (Zyxel NR5103E, Huawei, ZTE, Nokia)       │
                                └──────────────────────┬───────────────────────┘
                                                       │ (Live Telemetry & Auto-Fill)
                                                       ▼
┌───────────────────────────────┐          ┌───────────────────────┐          ┌───────────────────────────────┐
│       Speedtest.net HUD       │          │    NetPulse Engine    │          │         Fast.com HUD          │
│    (speedtest_scraper.js)     │◄─────────┤    (background.js)    ├─────────►│    (speedtest_scraper.js)     │
│  Down / Up / Ping / Jitter    │          │  (router_scraper.js)  │          │  Down / Up / Ping / Jitter    │
└───────────────┬───────────────┘          └───────────┬───────────┘          └───────────────┬───────────────┘
                │                                      │                                      │
                └──────────────────────────┬───────────┴──────────────────────────────────────┘
                                           │ (Paired Telemetry Snapshots)
                                           ▼
                            ┌──────────────────────────────────────────┐
                            │          Central Storage Engine          │
                            │          (chrome.storage.local)          │
                            └────────────────────┬─────────────────────┘
                                                 │
        ┌──────────────────┬─────────────────────┼─────────────────────┬──────────────────┐
        ▼                  ▼                     ▼                     ▼                  ▼
┌─────────────────┐ ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐ ┌─────────────────┐
│   Popup View    │ │ Full Dashboard  │   │ Deep RF Studio  │   │  Hourly Audit   │ │ About & Author  │
│  (popup.html)   │ │ (dashboard.html)│   │ (analysis.html) │   │ (history.html)  │ │  (about.html)   │
│   380px Quick   │ │  Live Gauges &  │   │ Multi-Waveform  │   │ Hourly Rollups  │ │ Developer Info  │
│  Telemetry HUD  │ │ Telemetry Logs  │   │  Correlation    │   │   & AI Export   │ │  & Repo Links   │
└─────────────────┘ └─────────────────┘   └─────────────────┘   └─────────────────┘ └─────────────────┘
```

---

## 1. Zyxel NR5103E & Gateway Scraper (`scripts/router_scraper.js`)

- **Subnet Auto-Detection**: Monitors `http://` and `https://` interfaces across private subnets (`192.168.*.*`, `10.*.*.*`, `172.16.*.*`, `localhost`).
- **All-Frame Coverage**: Operates seamlessly across nested iframes and Single-Page Applications (`all_frames: true`).
- **Automated Credential Injection**:
  - Automatically identifies login fields for username and password.
  - Injects target credentials (`User: admin`, `Password: SKdigital8008@` or custom user credentials configured in Options).
  - Utilizes browser-native `document.execCommand('insertText')` combined with prototype property descriptors (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) to bypass modern frontend reactive frameworks (React, Vue, Angular) and ensure form validation succeeds.
  - Multi-phase anti-wipe protection timers (100ms and 350ms) prevent aggressive router firmware scripts from clearing passwords on input blur.
  - Login button `mousedown` safety interceptor guarantees credentials remain populated at the exact millisecond of submission.
- **Multi-Pass RF Metric Extraction**:
  - **RSRP** (Reference Signal Received Power in dBm)
  - **SINR** (Signal-to-Interference-plus-Noise Ratio in dB)
  - **RSRQ** (Reference Signal Received Quality in dB)
  - **RSSI** (Received Signal Strength Indicator in dBm)
  - **Primary Cellular Band** (e.g. `n78`, `n41`, `B1`, `B3`, `B20`, `B28`)
  - **Physical Cell ID (PCI)** & **Cell ID**
  - **Downlink & Uplink Channel Bandwidths** (e.g. `100MHz`, `20MHz`)
  - **Carrier Aggregation (CA)** secondary component carriers (`SCC1`, `SCC2`, `SCC3`, etc.)
- **On-Page Router HUD**: Displays an unobtrusive live telemetry badge in the top-right corner of the gateway page with live sync timestamps and a manual sync trigger.

---

## 2. High-Performance Speedtest & Fast.com Automation (`scripts/speedtest_scraper.js`)

- **Main-Thread Freeze Prevention**:
  - Completely eliminates heavy DOM `MutationObserver` loops that traditionally freeze benchmark canvases and 60fps animations.
  - Employs a non-blocking, debounced 1.5-second polling interval (`setInterval(checkDom, 1500)`).
  - **Fast-Path Idle Short-Circuit**: When Speedtest.net is idle on the home screen (`GO` button present and no results), the scraper short-circuits in `< 0.01ms`, leaving CPU usage at 0% and keeping the page 100% responsive for user clicks and interactions.
  - Replaces all synchronous layout-reflow calls (`innerText`) with non-blocking `textContent`.
- **Top-Level Window Guard**: Guarantees execution only in the primary benchmark tab (`window.top === window.self`), never running inside third-party advertising or analytics iframes.
- **Telemetry Pairing**: Intercepts completed tests, extracts Download, Upload, Ping, and Jitter, immediately couples the result with the active router RF signal state, and records the entry to `netpulse_history`.
- **Dismissible On-Page HUD Badge**:
  - Live status indicator: `Speedtest.net Ready`, `Fast.com Detected`, `Test in progress...`, `Measuring speed...`, or `Logged: XX.XX Mbps`.
  - Manual "Capture Now" button (`#netpulse-st-capture-btn`) to force instantaneous extraction at any stage.
  - Dismiss close button (`&times;`) to completely remove the HUD if desired.

---

## 3. Centralized Evaluation & Engineering Diagnostics (`shared/evaluator.js`)

Evaluates raw radio measurements against 3GPP and cellular RF engineering benchmarks:

| Metric | Excellent (Emerald) | Good (Blue) | Fair (Amber) | Poor (Rose) | Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSRP** | $\ge -80$ | $-80$ to $-90$ | $-90$ to $-100$ | $< -100$ | dBm |
| **SINR** | $\ge 20$ | $13$ to $19$ | $5$ to $12$ | $< 5$ | dB |
| **RSRQ** | $\ge -9$ (Clean) | — | $-10$ to $-15$ (Congested) | $< -15$ (Heavy Load) | dB |
| **RSSI** | $\ge -65$ | $-66$ to $-75$ | $-76$ to $-85$ | $< -85$ | dBm |

- **Cross-Layer Diagnostic Advice**: Synthesizes multi-variable relationships between RF signal level and cell tower load:
  - Distinguishes between **RF Path Loss** (weak signal, low RSRP) vs. **Sector Tower Congestion** (strong RSRP but degraded RSRQ / negative SINR).
  - Provides actionable physical placement recommendations (e.g. window reorientation, external antenna requirements, band locking considerations).

---

## 4. Standalone Analytics Dashboard (`dashboard/dashboard.html`)

- **Live RF Gauges**: Real-time visual progress meters for RSRP, SINR, RSRQ, and RSSI with dynamic status color coding.
- **Cellular & Carrier Aggregation Details**: Displays Primary Band, PCI, Cell ID, Channel Bandwidth, and aggregated secondary component carriers (SCCs).
- **Searchable & Filterable Telemetry Log**: Correlates Speedtest runs with paired RF signal metrics.
- **Multi-Select & Merge Records**:
  - Select 2 or more log rows via checkboxes to reveal the **Merge Action Bar**.
  - Merges multiple test runs into a single averaged record (averaging Download, Upload, Ping, and Jitter while pairing the latest cellular RF signal data).
- **Per-Row Delete Action**: Hovering over any record row reveals a trash icon button with an instant confirmation modal to delete single entries.
- **Export Capabilities**: 1-click **Export CSV** and **Export JSON** for offline analysis.
- **Interactive Modals**:
  - **Portals & Links Modal** (`#modal-portals-overlay`): Quick launch cards for `192.168.1.1`, `speedtest.net`, and `fast.com` with one-click credential reveal and copy-to-clipboard.
  - **Clear All Data Confirmation Modal** (`#modal-clear-overlay`): Wipes telemetry log history while safely preserving user preferences (language and theme).

---

## 5. Deep RF Correlation & Carrier Aggregation Studio (`analysis/analysis.html`)

A specialized statistical environment for in-depth RF performance investigation:
- **Signal vs. Throughput Scatter Matrix**: Visualizes RSRP and SINR correlation against achieved download bandwidth.
- **Carrier Aggregation Component Breakdown**: Inspects primary and secondary carrier contributions (`PCC` + `SCC1` + `SCC2`).
- **Real-Time Auto-Sync Engine**: Actively synchronizes with Dashboard storage changes via a continuous 3-second loop and `chrome.storage.onChanged` listener.
- **Interactive "Clear History" Confirmation Modal**: High-contrast confirmation modal with backdrop dismissal and instant visual feedback.
- **Manual Sync Button with Toast Banner**: "Sync with Dashboard" actively triggers router tab scraping and displays a bilingual toast notification.

---

## 6. Hourly History Audit Studio (`history/history.html`)

- **Hourly Block Rollups**: Groups telemetry into 1-hour time blocks (e.g., `2026-09-21 02:00 - 02:59`) with collapsible accordion cards.
- **1-Click "Copy for AI Analysis" Generator**:
  - Formats hourly cellular RF telemetry, band parameters, Cell IDs, and speed test runs into structured Markdown diagnostic reports.
  - Generates prompts tuned for LLMs (ChatGPT, Claude, Gemini) in English and Arabic.
- **Filtering & Search Engine**: Search by test ID, platform (`Speedtest.net`, `Fast.com`), or filter by date.
- **Screenshot Viewer Modal**: View captured result screenshots with full-screen preview.
- **CSV Audit Export**: Export hourly rollups to standard CSV.

---

## 7. About & Developer Studio (`about/about.html`)

- **Developer & Author Attribution**:
  - **Made by Osama Abdallatif**: Clickable WhatsApp tile connecting directly to `+218 916808225` ([https://wa.me/218916808225](https://wa.me/218916808225)).
  - **GitHub Developer Profile**: [@ZerroDevs](https://github.com/ZerroDevs) ([https://github.com/ZerroDevs](https://github.com/ZerroDevs)).
- **Project Documentation & License**:
  - Direct repository link: [ZerroDevs/NetPulse](https://github.com/ZerroDevs/NetPulse).
  - Clickable hyperlink to official [MIT License](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE).
- **Full Bilingual i18n & Theme Sync**: All strings, badges, feature blocks, and footer licenses are fully translated and synchronized in real-time across open tabs.

---

## 8. Options & Configuration Studio (`options/options.html`)

Customizable settings page accessible directly via Chrome Extension Options (`options_ui`):
- **Gateway Network Configuration**: Custom gateway IP/subnet definition (e.g. `192.168.1.1`, `192.168.8.1`, `10.0.0.1`).
- **Router Credential Manager**: Secure local storage of gateway administrative username and password.
- **Telemetry Polling Rates**: Configurable refresh intervals (High Performance: 2s, Balanced: 5s, Low Overhead: 15s).
- **Granular Automation Toggles**: Independent toggles for Speedtest.net auto-capture, Fast.com auto-capture, and router auto-fill.
- **RF Threshold Sliders**: Custom warning alert triggers for critical RSRP and SINR degradation.

---

## 9. Compact Quick Popup (`popup/popup.html`)

- Lightweight 380px extension popup for instant status checks.
- Live active-tab detection banner (identifies when the user is currently viewing a router interface or benchmark site).
- Quick summary cards for current RF metrics and the latest Speedtest record.
- Instant action buttons: `Scan Router Tab`, `Capture Speedtest Tab`, `Deep RF Analysis`, `Settings`, `View History Reports`, and `Open Full Analytics Dashboard`.

---

## 10. Internationalization (i18n) & Arabic RTL Engine (`shared/i18n.js`)

- Native bilingual translation engine supporting **English (LTR)** and **العربية (Arabic - RTL)**.
- Full UI translation coverage across popup, dashboard, options, analysis studio, hourly audit, about page, on-page HUDs, and toast alerts.
- Automatic layout flipping: dynamically sets `dir="rtl"`, reverses navigation margins, and mirrors grid columns.
- State is preserved persistently in `chrome.storage.local` under `netpulse_lang`.

---

## 11. Flat Dual-Theme Engine (Dark & Eye-Comfort Light)

Strict minimalist aesthetic philosophy across all pages:
- **Zero Gradients**: Exclusively 100% solid, flat, matte color fills.
- **Zero Unicode Emojis**: Strictly zero emojis; all visual indicators use crisp, lightweight inline SVG vector icons.
- **Dark Mode**: Sleek obsidian canvas (`#0b0f19`) with dark slate cards (`#111827`) and high-contrast borders (`#1f2937`).
- **Eye-Comfort Light Mode**: Soothing, soft slate-grey canvas (`#dbe0e6`) with elevated comfort grey cards (`#eaedf1`), refined borders (`#bcc4cf`), and dark charcoal text (`#111827`). Eliminates harsh, glaring white backgrounds for effortless readability during nighttime or extended diagnostic sessions.
- State is preserved persistently in `chrome.storage.local` under `netpulse_theme`.

---

## Strict Design & Engineering Standards

- **Zero Gradients**: No `linear-gradient`, `radial-gradient`, or CSS gradient functions permitted in source code.
- **Zero Emojis**: Zero unicode emojis across markup, scripts, and logs.
- **Pure Vector Icons**: Scalable, geometrically aligned inline SVGs.
- **Monospace Telemetry**: All RF measurements, IP addresses, cell IDs, and timestamps are rendered in monospace typography (`ui-monospace, SFMono-Regular, Consolas, monospace`).
- **Manifest V3 Compliant**: Built strictly on Chrome Extension Manifest V3 with event-driven background service workers and non-persistent storage listeners.

---

## Repository Structure

```
NetPulse/
├── LICENSE                    # MIT License (Copyright 2026 ZerroDevs)
├── README.md                  # Comprehensive technical documentation
├── manifest.json              # Chrome Manifest V3 configuration & permissions
├── background.js              # Service worker (lifecycle, badge, router & speedtest bus)
├── verify_netpulse.js         # Automated verification suite (217+ passing tests)
├── generate_icons.js          # PNG icon generation utility
│
├── release/
│   └── NetPulse.zip           # Production extension release package
│
├── shared/
│   ├── evaluator.js           # Centralized 3GPP RF benchmarks & diagnostic advice engine
│   └── i18n.js                # Bilingual dictionary (EN/AR) & dynamic RTL switching engine
│
├── popup/
│   ├── popup.html             # 380px compact popup view
│   ├── popup.css              # Zero-gradient flat dark/light styles & RTL rules
│   └── popup.js               # Quick metrics, tab detection, and manual triggers
│
├── dashboard/
│   ├── dashboard.html         # Full-page analytics dashboard & live RF gauges
│   ├── dashboard.css          # Modular grid layout with flat meters, themes & RTL
│   └── dashboard.js           # Live updates, multi-select merge, per-row delete, CSV/JSON export
│
├── history/
│   ├── history.html           # Hourly audit studio, date filters & AI report generator
│   ├── history.css            # Hourly time block accordions & AI prompt copy styles
│   └── history.js             # Hourly bucket builder, AI markdown generator & screenshot viewer
│
├── about/
│   ├── about.html             # Author & developer info, WhatsApp contact & repo details
│   ├── about.css              # Author tiles, GitHub link & responsive cards
│   └── about.js               # Bilingual i18n & live netpulse_theme / netpulse_lang sync
│
├── options/
│   ├── options.html           # Gateway subnets, credentials & threshold settings
│   ├── options.css            # Options layout, toggles & sliders
│   └── options.js             # Options storage synchronization & validation
│
├── analysis/
│   ├── analysis.html          # Deep RF correlation & Carrier Aggregation studio
│   ├── analysis.css           # Analytical scatter plots, charts & modal styling
│   └── analysis.js            # Auto-sync engine, correlation math & confirmation dialogs
│
├── scripts/
│   ├── router_scraper.js      # Zyxel NR5103E & 192.168.* scraper with auto-fill & HUD
│   └── speedtest_scraper.js   # Non-blocking Speedtest.net & Fast.com automation scraper
│
└── icons/
    ├── icon.svg               # Vector master source icon
    ├── icon16.png             # 16x16 PNG extension icon
    ├── icon48.png             # 48x48 PNG extension icon
    └── icon128.png            # 128x128 PNG extension icon
```

---

## Installation & Developer Setup

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/ZerroDevs/NetPulse.git
   ```
2. **Open Chrome Extensions Page**:
   - Open Google Chrome and navigate to `chrome://extensions`.
3. **Enable Developer Mode**:
   - Toggle the **Developer mode** switch in the top-right corner.
4. **Load Unpacked Extension**:
   - Click **Load unpacked** in the top-left toolbar.
   - Select the `NetPulse` project folder (`c:\Users\Gaming\Desktop\Folders-Z\userscript\NetPulse`).
5. **Pin NetPulse**:
   - Click the puzzle-piece extensions menu in Chrome and pin **NetPulse** to your browser toolbar.

---

## Automated Verification Suite

NetPulse includes a comprehensive, standalone Node.js automated test suite (`verify_netpulse.js`) that validates:
- Manifest V3 permission structures and host permissions.
- File existence and integrity across all components.
- RF evaluation grading algorithms across 3GPP threshold ranges.
- Full English and Arabic translation key parity.
- Multi-column Speedtest.net and Fast.com regex parsing engines.
- Strict **Zero-Gradient** compliance across all `.html`, `.css`, and `.js` source files.
- Strict **Zero-Emoji** compliance across all project files.
- Main-thread freeze prevention (validates absence of runaway `MutationObserver` on benchmark pages and verifies non-blocking `textContent` usage).

To execute the test suite:
```bash
node verify_netpulse.js
```

Expected output:
```
=== NETPULSE VERIFICATION SUITE ===
...
Verification Complete: 217 passed, 0 failed.
ALL TESTS PASSED SUCCESSFULLY.
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE) file for complete details.

Copyright (c) 2026 **ZerroDevs** ([https://github.com/ZerroDevs](https://github.com/ZerroDevs)).
