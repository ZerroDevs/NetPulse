# NetPulse (Manifest V3 Chrome Extension)

[![Developer](https://img.shields.io/badge/Developer-@ZerroDevs-6366f1.svg)](https://github.com/ZerroDevs)
[![License](https://img.shields.io/badge/License-MIT-10b981.svg)](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE)
[![Manifest](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-3b82f6.svg)](manifest.json)
[![I18n](https://img.shields.io/badge/Languages-English%20%7C%20العربية%20(RTL)-f59e0b.svg)](shared/i18n.js)
[![Documentation](https://img.shields.io/badge/Documentation-Interactive%20Guide-6366f1.svg)](docs/index.html)
[![Tests](https://img.shields.io/badge/Verification-499%2B%20Passing-10b981.svg)](verify_netpulse.js)

**NetPulse** is a production-grade cellular router RF telemetry monitor, internal speedtest benchmark suite, and competitive gaming latency diagnostics engine. Designed specifically for 5G / 4G LTE fixed-wireless broadband gateways (optimized for the **Zyxel NR5103E**, Huawei, ZTE, and all gateways across `192.168.*.*`, `10.*.*.*`, and `172.16.*.*`), NetPulse bridges the gap between physical radio-frequency (RF) signal conditions and actual network throughput benchmarks.

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
        ┌──────────────────┬─────────────────────┼─────────────────────┬──────────────────┬──────────────────┐
        ▼                  ▼                     ▼                     ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐ ┌─────────────────┐  ┌─────────────────┐
│   Popup View    │ │ Full Dashboard  │   │ Deep RF Studio  │   │  Hourly Audit   │ │ Mini Speedtest  │  │ About & Author  │
│  (popup.html)   │ │ (dashboard.html)│   │ (analysis.html) │   │ (history.html)  │ │(speedtest.html) │  │  (about.html)   │
│   380px Quick   │ │ Gaming Radar &  │   │ Multi-Waveform  │   │ Hourly Rollups  │ │ Radial Gauge &  │  │ Developer Info  │
│  Telemetry HUD  │ │ Bufferbloat HUD │   │  Correlation    │   │   & AI Export   │ │ Bufferbloat CSI │  │  & Repo Links   │
└─────────────────┘ └─────────────────┘   └─────────────────┘   └─────────────────┘ └─────────────────┘  └─────────────────┘
```

---

## 1. Semi-Circular Speedometer Canvas & Internal Speedtest Suite (`speedtest/`)

A completely self-contained, offline-compatible pure JavaScript speedtest engine that measures network performance directly in the browser:

- **240-Degree High-DPI Canvas Gauge**:
  - Semi-circular radial gauge sweeping from `150°` to `390°` with razor-sharp rendering on Retina and 4K displays (`devicePixelRatio` scaling).
  - **Zero Gradients**: Solid matte dark slate base track (`#1f2937`) with solid Emerald (`#10b981`) for Download, Solid Blue (`#3b82f6`) for Upload, and Solid Amber (`#f59e0b`) for Ping.
  - **Non-Linear / Logarithmic Scale Ticks**: Piecewise distribution across `0, 5, 10, 50, 100, 250, 500, 1000 Mbps` ensures fine readability for both lower rates (< 50 Mbps) and gigabit speeds.
  - **Smooth Spring/Inertia Needle**: Animated tapered pointer rotating with fluid `requestAnimationFrame` cubic easing and zero jitter.
- **Center Gauge HUD Overlay**:
  - Positioned with ample breathing room above the needle pivot to eliminate visual overlap.
  - Features real-time phase pill badge with inline vector SVG icons, large 52px monospace numeric readout, and uppercase `Mbps` / `ms` label.
- **Multi-Stream Multi-Endpoint Download Engine (`speedtest_worker.js`)**:
  - Multi-threaded chunk reader using parallel ReadableStreams with adaptive 10MB/25MB chunks.
  - Resilient error handling with `res.ok` validation and automatic Anycast mirror fallback to prevent rate-limit loops.
  - Clean stream cancellation (`reader.cancel()`) on phase transition to prevent socket leaks.
- **Instant Bufferbloat & CSI Evaluation Preview**:
  - Concurrently probes loaded latency against independent Anycast edge nodes (`1.1.1.1`, `google.com`, `amazonaws.com`) to evaluate queue delay without socket contention.
  - Instantly computes Bufferbloat Grade (A+ to F) and Competitive Gaming Stability Index (CSI).
- **Paired Cellular RF Telemetry**:
  - Captures real-time RSRP, SINR, RSRQ, RSSI, Band, PCI, and Cell ID directly from the router and auto-logs the run into history under `"NetPulse Test"`.

---

## 2. Competitive Gaming & Latency Diagnostics Suite (`dashboard/`)

A 5-part power-user latency diagnostic engine built directly into the main Telemetry Dashboard:

### A. Bufferbloat & Loaded Latency Scoring Engine
- Evaluates queue delay during network congestion by comparing idle baseline ping against download-loaded and upload-loaded latency.
- Grades buffer management from **Grade A+** (< 5ms delta) to **Grade F** (> 80ms delta) based on 3GPP and SQM industry standards:
  - **Grade A+**: Exceptional buffer management (< 5ms delta). Real-time gaming unaffected.
  - **Grade A**: Good traffic shaping (<= 15ms delta). Minimal latency penalty.
  - **Grade B**: Minor latency inflation (<= 35ms delta).
  - **Grade C**: Noticeable queue buildup (<= 60ms delta). Gameplay micro-stutter likely.
  - **Grade D**: High queue buildup (<= 80ms delta).
  - **Grade F**: Severe bufferbloat (> 80ms delta). Critical gaming freezes and rubberbanding.

### B. Competitive Gaming Stability Index (CSI: 0 - 100%)
- Composite algorithm evaluating real-time gaming suitability:
  $$\text{CSI} = 100 - (\text{Jitter Penalty}) - (\text{Packet Loss Penalty}) - (\text{Ping Penalty}) - (\text{Bufferbloat Penalty})$$
- Tiers: **Tournament Ready** ($\ge 90\%$), **Competitive Tier** ($75 - 89\%$), **Casual Playable** ($60 - 74\%$), and **High Lag / Spike Risk** ($< 60\%$).

### C. Real-Time Latency Spike & Route Deviation Radar
- Detects micro-spikes and route deviations (+15ms over 60s baseline).
- Classifies root causes into:
  - **Local Network Saturation**: Buffer queue delay from concurrent household downloads.
  - **Cell Tower RF Contention**: Sudden SINR degradation or physical tower load.
  - **External ISP Peering Flap**: Core internet backbone route instability.

### D. Pre-Match 15s Connection Flight Check
- Automated 15-second high-rate readiness audit before joining competitive ranked matches.
- Provides immediate actionable verdicts: **Safe to Queue**, **Play with Caution**, or **Do Not Queue** with comprehensive min/max/jitter/loss telemetry.

### E. Household Capacity & Concurrency Headroom Estimator
- Computes simultaneous 4K UHD video streams, 1080p video calls, and low-latency gaming headroom based on active bandwidth and traffic shaping.

---

## 3. Live Gaming Jitter & Packet Loss HUD (`dashboard/dashboard.js`)

- Real-time precision latency probe targeting high-availability Anycast and gaming edge relays:
  - **Cloudflare Ultra-Fast Edge** (Frankfurt / EU): `https://1.1.1.1/cdn-cgi/trace`
  - **Google Cloud Global Edge** (Zero Overhead): `https://www.google.com/generate_204`
  - **AWS European Gaming Hub** (Frankfurt): `https://checkip.amazonaws.com/`
- Real-time sparkline canvas visualizing jitter variance, minimum/maximum RTT, and 60-second rolling packet loss.

---

## 4. Zyxel NR5103E & Gateway Scraper (`scripts/router_scraper.js`)

- **Subnet Auto-Detection**: Monitors `http://` and `https://` interfaces across private subnets (`192.168.*.*`, `10.*.*.*`, `172.16.*.*`, `localhost`).
- **Automated Credential Injection**:
  - Automatically identifies login fields for username and password.
  - Injects target credentials (`admin` / user configured password).
  - Uses `document.execCommand('insertText')` combined with prototype property descriptors to bypass reactive frameworks (React, Vue, Angular).
  - Multi-phase anti-wipe protection timers (100ms and 350ms) prevent router scripts from clearing credentials on input blur.
- **Multi-Pass RF Metric Extraction**:
  - **RSRP** (Reference Signal Received Power in dBm)
  - **SINR** (Signal-to-Interference-plus-Noise Ratio in dB)
  - **RSRQ** (Reference Signal Received Quality in dB)
  - **RSSI** (Received Signal Strength Indicator in dBm)
  - **Primary Cellular Band** (e.g. `n78`, `n41`, `B1`, `B3`, `B20`, `B28`)
  - **Physical Cell ID (PCI)** & **Cell ID**
  - **Downlink & Uplink Channel Bandwidths** (e.g. `100MHz`, `20MHz`)
  - **Carrier Aggregation (CA)** secondary component carriers (`SCC1`, `SCC2`, `SCC3`, etc.)

---

## 5. High-Performance Speedtest & Fast.com Automation (`scripts/speedtest_scraper.js`)

- **Main-Thread Freeze Prevention**: Eliminates heavy DOM `MutationObserver` loops; uses non-blocking debounced 1.5s polling.
- **Fast-Path Idle Short-Circuit**: When Speedtest.net is idle on the home screen (`GO` button present), the scraper short-circuits in `< 0.01ms`, leaving CPU usage at 0%.
- **Telemetry Pairing**: Intercepts completed tests, extracts Download, Upload, Ping, and Jitter, and immediately couples the result with active RF signal state.
- **Dismissible On-Page HUD Badge**: Live status indicator with manual "Capture Now" button.

---

## 6. Centralized Evaluation & Engineering Diagnostics (`shared/evaluator.js`)

Evaluates raw radio measurements against 3GPP cellular RF engineering benchmarks:

| Metric | Excellent (Emerald) | Good (Blue) | Fair (Amber) | Poor (Rose) | Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSRP** | $\ge -80$ | $-80$ to $-90$ | $-90$ to $-100$ | $< -100$ | dBm |
| **SINR** | $\ge 20$ | $13$ to $19$ | $5$ to $12$ | $< 5$ | dB |
| **RSRQ** | $\ge -9$ (Clean) | — | $-10$ to $-15$ (Congested) | $< -15$ (Heavy Load) | dB |
| **RSSI** | $\ge -65$ | $-66$ to $-75$ | $-76$ to $-85$ | $< -85$ | dBm |

- **Link Spectral Efficiency & Sector Capacity**: Computes theoretical peak capacity against channel bandwidth and 256-QAM 4x4 MIMO modulation.
- **Privacy & Public Sharing Mode**: 1-click toggle to redact sensitive IP addresses, Physical Cell IDs (PCIs), and Cell IDs for public screenshots.
- **Export PNG Diagnostic Card**: Generates a high-resolution standalone diagnostic report card image.

---

## 7. Hourly History Audit Studio (`history/history.html`)

- **Hourly Block Rollups**: Groups telemetry into 1-hour time blocks (e.g. `2026-09-21 06:00 - 06:59`) with collapsible accordion cards.
- **ISP Peak vs. Off-Peak Discrepancy Matrix**: Compares throughput and tower load between evening peak hours (19:00 - 01:00) and morning off-peak hours (02:00 - 08:00) to diagnose ISP throttling vs. tower saturation.
- **1-Click "Copy for AI Analysis" Generator**:
  - Formats hourly cellular RF telemetry, band parameters, theoretical capacity, spectral efficiency, bufferbloat grades, and speed test runs into clean, markdown diagnostic reports for LLMs (ChatGPT, Claude, Gemini).
- **Filtering & Search Engine**: Search by test ID, platform (`Speedtest.net`, `Fast.com`, `NetPulse Test`), or filter by date.
- **CSV Audit Export**: Export hourly rollups to standard CSV format.

---

## 8. Internationalization (i18n) & Arabic RTL Engine (`shared/i18n.js`)

- Native bilingual translation engine supporting **English (LTR)** and **العربية (Arabic - RTL)**.
- 100% UI translation coverage across popup, dashboard, options, analysis studio, hourly audit, speedtest, about page, and toast alerts.
- Automatic layout flipping: dynamically sets `dir="rtl"`, reverses navigation margins, and mirrors grid columns.
- State is preserved persistently in `chrome.storage.local` under `netpulse_lang`.

---

## 9. Flat Dual-Theme Engine (Dark & Eye-Comfort Light)

Strict minimalist aesthetic philosophy across all pages:
- **Zero Gradients**: Exclusively 100% solid, flat, matte color fills.
- **Zero Unicode Emojis**: Strictly zero emojis; all visual indicators use crisp, lightweight inline SVG vector icons.
- **Dark Mode**: Sleek obsidian canvas (`#0b0f19`) with dark slate cards (`#111827`) and high-contrast borders (`#1f2937`).
- **Eye-Comfort Light Mode**: Soothing, soft slate-grey canvas (`#f3f4f6`) with elevated comfort cards (`#ffffff`), refined borders (`#e5e7eb`), and dark charcoal text (`#111827`).
- State is preserved persistently in `chrome.storage.local` under `netpulse_theme`.

---

## Repository Structure

```
NetPulse/
├── LICENSE                    # MIT License (Copyright 2026 ZerroDevs)
├── README.md                  # Comprehensive technical documentation
├── manifest.json              # Chrome Manifest V3 configuration & permissions
├── background.js              # Service worker (lifecycle, badge, speedtest & router bus)
├── verify_netpulse.js         # Automated verification suite (499+ passing tests)
├── generate_icons.js          # PNG icon generation utility
│
├── release/
│   └── NetPulse.zip           # Production extension release package
│
├── shared/
│   ├── evaluator.js           # 3GPP RF benchmarks, CSI, Bufferbloat, Spectral & PNG card generator
│   └── i18n.js                # Bilingual dictionary (EN/AR) & dynamic RTL switching engine
│
├── speedtest/
│   ├── speedtest.html         # Mini Speedtest suite & radial canvas gauge
│   ├── speedtest.css          # Speedometer styling, center HUD overlay & themes
│   ├── speedtest.js           # Radial gauge renderer, needle easing & controller
│   └── speedtest_worker.js    # Multi-stream pure JS download/upload/ping engine
│
├── popup/
│   ├── popup.html             # 380px compact popup view
│   ├── popup.css              # Zero-gradient flat dark/light styles & RTL rules
│   └── popup.js               # Quick metrics, tab detection, and manual triggers
│
├── dashboard/
│   ├── dashboard.html         # Analytics dashboard, Gaming Radar, Bufferbloat & CSI HUD
│   ├── dashboard.css          # Modular grid layout with flat meters, themes & RTL
│   └── dashboard.js           # Live updates, gaming probe, multi-select merge, CSV/JSON export
│
├── history/
│   ├── history.html           # Hourly audit studio, Peak vs Off-Peak matrix & AI report generator
│   ├── history.css            # Hourly time block accordions & AI prompt copy styles
│   └── history.js             # Hourly bucket builder, AI markdown generator & screenshot viewer
│
├── analysis/
│   ├── analysis.html          # Deep RF correlation & Carrier Aggregation studio
│   ├── analysis.css           # Analytical scatter plots, charts & modal styling
│   └── analysis.js            # Auto-sync engine, correlation math & confirmation dialogs
│
├── options/
│   ├── options.html           # Gateway subnets, credentials & threshold settings
│   ├── options.css            # Options layout, toggles & sliders
│   └── options.js             # Options storage synchronization & validation
│
├── about/
│   ├── about.html             # Author & developer info, WhatsApp contact & repo details
│   ├── about.css              # Author tiles, GitHub link & responsive cards
│   └── about.js               # Bilingual i18n & live netpulse_theme / netpulse_lang sync
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
- Bufferbloat grading, CSI scoring, Headroom estimation, and Peak/Off-Peak discrepancy formulas.
- Semi-circular speedometer gauge geometry, non-linear tick scale points, and HUD overlays.
- Multi-column Speedtest.net and Fast.com regex parsing engines.
- Strict **Zero-Gradient** compliance across all `.html`, `.css`, and `.js` source files.
- Strict **Zero-Emoji** compliance across all project files.
- Main-thread freeze prevention.

To execute the test suite:
```bash
node verify_netpulse.js
```

Expected output:
```
=== NETPULSE VERIFICATION SUITE ===
...
Verification Complete: 499 passed, 0 failed.
ALL TESTS PASSED SUCCESSFULLY.
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/ZerroDevs/NetPulse/blob/main/LICENSE) file for complete details.

Copyright (c) 2026 **ZerroDevs** ([https://github.com/ZerroDevs](https://github.com/ZerroDevs)).
