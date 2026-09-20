/**
 * NetPulse - Resilient Cellular Router Scraper
 * Optimized for Zyxel NR5103E and all 192.168.*.* gateway interfaces.
 * Supports http and https, iframes, multi-pass DOM extraction, live mutation observation,
 * and manual scan triggering from extension popup or dashboard.
 */

(function () {
  'use strict';

  // Only execute on 192.168.*.* private subnets or common router gateway hostnames
  const host = window.location.hostname;
  const isRouter = host.startsWith('192.168.') ||
                   host.startsWith('10.') ||
                   host.startsWith('172.16.') ||
                   host.startsWith('172.17.') ||
                   host.startsWith('172.18.') ||
                   host.startsWith('172.19.') ||
                   host.startsWith('172.2') ||
                   host.startsWith('172.3') ||
                   host.includes('router') ||
                   host === 'localhost';

  if (!isRouter) {
    return;
  }

  // Prevent duplicate execution within same frame
  if (window.__netpulse_router_injected) return;
  window.__netpulse_router_injected = true;

  console.log('[NetPulse] Router Scraper active on', window.location.href);

  let lastCommittedData = null;
  let pollTimer = null;

  function parseNumeric(val) {
    if (val === null || val === undefined) return null;
    const clean = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  /**
   * Multi-Pass Extraction Engine
   * Handles Zyxel NR5103E column layouts, tables, stacked text lines, and forms.
   */
  function extractRouterMetrics() {
    const doc = document;
    const bodyText = doc.body ? doc.body.innerText : '';

    const metrics = {
      rsrp: null,
      sinr: null,
      rsrq: null,
      rssi: null,
      band: null,
      pci: null,
      cellId: null,
      dlBandwidth: null,
      ulBandwidth: null,
      caBands: [],
      networkType: null
    };

    // --- PASS 1: Line-by-Line Token Scanning (Matches Zyxel NR5103E Service Information view) ---
    const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      const nextNextLine = lines[i + 2] || '';

      // RSRP
      if (/^RSRP$/i.test(line) && metrics.rsrp === null) {
        const val = parseNumeric(nextLine) !== null ? nextLine : nextNextLine;
        metrics.rsrp = parseNumeric(val);
      }
      // RSRQ
      if (/^RSRQ$/i.test(line) && metrics.rsrq === null) {
        const val = parseNumeric(nextLine) !== null ? nextLine : nextNextLine;
        metrics.rsrq = parseNumeric(val);
      }
      // SINR / SNR
      if (/^(?:SINR|SNR)$/i.test(line) && metrics.sinr === null) {
        const val = parseNumeric(nextLine) !== null ? nextLine : nextNextLine;
        metrics.sinr = parseNumeric(val);
      }
      // RSSI
      if (/^RSSI$/i.test(line) && metrics.rssi === null) {
        const val = parseNumeric(nextLine) !== null ? nextLine : nextNextLine;
        metrics.rssi = parseNumeric(val);
      }
      // Physical Cell ID / PCI
      if (/^(?:Physical Cell ID|PCI)$/i.test(line) && metrics.pci === null) {
        const pciNum = parseInt(nextLine, 10);
        if (!isNaN(pciNum)) metrics.pci = pciNum;
      }
      // Cell ID / eNodeB / gNodeB
      if (/^(?:Cell ID|eNB ID|gNB ID)$/i.test(line) && metrics.cellId === null) {
        if (/^[0-9a-fA-F]+$/.test(nextLine)) metrics.cellId = nextLine;
      }
      // Band / Frequency Band
      if (/^(?:Band|Frequency Band|Serving Band)$/i.test(line) && metrics.band === null) {
        if (/^[a-zA-Z0-9_-]+$/.test(nextLine) && !/width/i.test(nextLine)) {
          metrics.band = nextLine.toUpperCase();
        }
      }
      // Access Technology
      if (/^Access Technology$/i.test(line) && metrics.networkType === null) {
        metrics.networkType = nextLine;
      }
      // DL Bandwidth
      if (/^DL Bandwidth(?:\s*\(MHz\))?$/i.test(line) && metrics.dlBandwidth === null) {
        metrics.dlBandwidth = nextLine.includes('MHz') ? nextLine : `${nextLine} MHz`;
      }
      // UL Bandwidth
      if (/^UL Bandwidth(?:\s*\(MHz\))?$/i.test(line) && metrics.ulBandwidth === null) {
        metrics.ulBandwidth = nextLine.includes('MHz') ? nextLine : `${nextLine} MHz`;
      }
    }

    // --- PASS 2: Table Rows & Key-Value Sibling Elements ---
    const allElements = doc.querySelectorAll('tr, div, li, dl, td, th');
    allElements.forEach((elem) => {
      const text = elem.innerText || '';
      if (text.length > 250) return;

      // Table row cells
      if (elem.tagName === 'TR') {
        const cells = elem.querySelectorAll('td, th');
        if (cells.length >= 2) {
          const label = cells[0].innerText.trim();
          const val = cells[1].innerText.trim();

          if (/RSRP/i.test(label) && metrics.rsrp === null) metrics.rsrp = parseNumeric(val);
          if (/RSRQ/i.test(label) && metrics.rsrq === null) metrics.rsrq = parseNumeric(val);
          if (/SINR/i.test(label) && metrics.sinr === null) metrics.sinr = parseNumeric(val);
          if (/RSSI/i.test(label) && metrics.rssi === null) metrics.rssi = parseNumeric(val);
          if (/Physical Cell ID|PCI/i.test(label) && metrics.pci === null) metrics.pci = parseInt(val, 10);
          if (/Cell ID/i.test(label) && metrics.cellId === null) metrics.cellId = val;
          if (/Band/i.test(label) && !/width/i.test(label) && metrics.band === null) metrics.band = val.toUpperCase();
          if (/Access Technology/i.test(label) && metrics.networkType === null) metrics.networkType = val;
          if (/DL Bandwidth/i.test(label) && metrics.dlBandwidth === null) metrics.dlBandwidth = val.includes('MHz') ? val : `${val} MHz`;
          if (/UL Bandwidth/i.test(label) && metrics.ulBandwidth === null) metrics.ulBandwidth = val.includes('MHz') ? val : `${val} MHz`;
        }
      }

      // Next sibling pattern
      if (elem.nextElementSibling) {
        const label = elem.innerText.trim();
        const nextVal = elem.nextElementSibling.innerText ? elem.nextElementSibling.innerText.trim() : '';

        if (/^RSRP$/i.test(label) && metrics.rsrp === null) metrics.rsrp = parseNumeric(nextVal);
        if (/^RSRQ$/i.test(label) && metrics.rsrq === null) metrics.rsrq = parseNumeric(nextVal);
        if (/^SINR$/i.test(label) && metrics.sinr === null) metrics.sinr = parseNumeric(nextVal);
        if (/^RSSI$/i.test(label) && metrics.rssi === null) metrics.rssi = parseNumeric(nextVal);
        if (/^(?:Physical Cell ID|PCI)$/i.test(label) && metrics.pci === null) metrics.pci = parseInt(nextVal, 10);
        if (/^Cell ID$/i.test(label) && metrics.cellId === null) metrics.cellId = nextVal;
        if (/^Band$/i.test(label) && metrics.band === null) metrics.band = nextVal.toUpperCase();
        if (/^Access Technology$/i.test(label) && metrics.networkType === null) metrics.networkType = nextVal;
      }
    });

    // --- PASS 3: Resilient Global Regex on full text ---
    if (metrics.rsrp === null) {
      const m = bodyText.match(/RSRP[\s:\t\r\n]+(-?\d+(?:\.\d+)?)\s*(?:dBm)?/i);
      if (m) metrics.rsrp = parseNumeric(m[1]);
    }
    if (metrics.rsrq === null) {
      const m = bodyText.match(/RSRQ[\s:\t\r\n]+(-?\d+(?:\.\d+)?)\s*(?:dB)?/i);
      if (m) metrics.rsrq = parseNumeric(m[1]);
    }
    if (metrics.sinr === null) {
      const m = bodyText.match(/(?:SINR|SNR)[\s:\t\r\n]+(-?\d+(?:\.\d+)?)\s*(?:dB)?/i);
      if (m) metrics.sinr = parseNumeric(m[1]);
    }
    if (metrics.rssi === null) {
      const m = bodyText.match(/RSSI[\s:\t\r\n]+(-?\d+(?:\.\d+)?)\s*(?:dBm)?/i);
      if (m) metrics.rssi = parseNumeric(m[1]);
    }
    if (metrics.band === null) {
      const m = bodyText.match(/(?:Serving Band|Band)[\s:\t\r\n]+(n\d+|B\d+)/i);
      if (m) metrics.band = m[1].toUpperCase();
    }
    if (metrics.pci === null) {
      const m = bodyText.match(/(?:Physical Cell ID|PCI)[\s:\t\r\n]+(\d+)/i);
      if (m) metrics.pci = parseInt(m[1], 10);
    }
    if (metrics.cellId === null) {
      const m = bodyText.match(/(?:Cell ID)[\s:\t\r\n]+([0-9a-fA-F]+)/i);
      if (m) metrics.cellId = m[1].trim();
    }
    if (metrics.dlBandwidth === null) {
      const m = bodyText.match(/DL\s*Bandwidth(?:\s*\(MHz\))?[\s:\t\r\n]+([0-9.]+(?:\s*MHz)?)/i);
      if (m) metrics.dlBandwidth = m[1].includes('MHz') ? m[1] : `${m[1]} MHz`;
    }
    if (metrics.ulBandwidth === null) {
      const m = bodyText.match(/UL\s*Bandwidth(?:\s*\(MHz\))?[\s:\t\r\n]+([0-9.]+(?:\s*MHz)?)/i);
      if (m) metrics.ulBandwidth = m[1].includes('MHz') ? m[1] : `${m[1]} MHz`;
    }

    // --- PASS 4: Carrier Aggregation detection ---
    const caMatches = bodyText.match(/(?:SCC\d|Secondary Carrier|Carrier Aggregation)[\s:=]+([A-Za-z0-9]+)/gi);
    if (caMatches) {
      metrics.caBands = caMatches.map(m => m.split(/[\s:=]+/).pop().trim().toUpperCase());
    } else if (metrics.band) {
      metrics.caBands = [metrics.band];
    }

    // Defaults / Inferences
    if (!metrics.networkType && metrics.band) {
      metrics.networkType = metrics.band.startsWith('N') ? '5G NR' : 'LTE-Advanced';
    }
    if (!metrics.dlBandwidth && metrics.band) {
      metrics.dlBandwidth = metrics.band.startsWith('N') ? '100 MHz' : '20 MHz';
    }
    if (!metrics.ulBandwidth && metrics.band) {
      metrics.ulBandwidth = '20 MHz';
    }

    return metrics;
  }

  /**
   * Commit telemetry payload to chrome.storage.local
   */
  async function commitTelemetry(metrics, source = 'zyxel_nr5103e') {
    const hasData = metrics && (metrics.rsrp !== null || metrics.rssi !== null || metrics.rsrq !== null);

    let evalResult = {
      overallGrade: 'Unknown',
      overallColor: '#9ca3af',
      rsrpGrade: 'Unknown',
      sinrGrade: 'Unknown',
      rsrqGrade: 'Unknown',
      advice: 'No router RF signal metrics currently registered.'
    };

    if (window.NetPulseEvaluator && hasData) {
      const health = window.NetPulseEvaluator.getOverallHealth(metrics.rsrp, metrics.sinr, metrics.rsrq);
      const rsrpEval = window.NetPulseEvaluator.evaluateMetric('rsrp', metrics.rsrp);
      const sinrEval = window.NetPulseEvaluator.evaluateMetric('sinr', metrics.sinr);
      const rsrqEval = window.NetPulseEvaluator.evaluateMetric('rsrq', metrics.rsrq);
      const advice = window.NetPulseEvaluator.generateDiagnosticAdvice(metrics);

      evalResult = {
        overallGrade: health.status,
        overallColor: health.color,
        rsrpGrade: rsrpEval.grade,
        sinrGrade: sinrEval.grade,
        rsrqGrade: rsrqEval.grade,
        advice: advice
      };
    }

    const payload = {
      timestamp: Date.now(),
      status: hasData ? 'connected' : 'listening',
      source: source,
      routerUrl: window.location.origin,
      metrics: metrics,
      eval: evalResult
    };

    lastCommittedData = payload;

    try {
      await chrome.storage.local.set({ netpulse_router_latest: payload });
      chrome.runtime.sendMessage({ type: 'ROUTER_TELEMETRY_COMMITTED', data: payload });
      updateHud(payload);
    } catch (err) {
      console.error('[NetPulse] Storage save failed:', err);
    }

    return payload;
  }

  /**
   * On-Page HUD Overlay (only in top-level window)
   */
  function injectHud() {
    if (window.self !== window.top) return; // Skip inside iframes
    if (document.getElementById('netpulse-router-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'netpulse-router-hud';
    hud.style.cssText = [
      'position: fixed',
      'top: 14px',
      'right: 14px',
      'z-index: 9999999',
      'background-color: #0b0f19',
      'border: 1px solid #1f2937',
      'border-radius: 6px',
      'padding: 8px 12px',
      'color: #f3f4f6',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 12px',
      'display: flex',
      'align-items: center',
      'gap: 10px',
      'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6)',
      'user-select: none'
    ].join(';');

    hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span style="font-weight: 700; color: #f9fafb;">NetPulse</span>
      </div>
      <div style="height: 14px; width: 1px; background-color: #1f2937;"></div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span id="netpulse-hud-dot" style="width: 7px; height: 7px; border-radius: 50%; background-color: #f59e0b; display: inline-block;"></span>
        <span id="netpulse-hud-label" style="font-family: ui-monospace, monospace; color: #9ca3af; font-size: 11px;">Listening...</span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button id="netpulse-hud-sync-btn" style="background-color: #111827; border: 1px solid #1f2937; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-family: inherit;">Scan Now</button>
      </div>
    `;

    document.body.appendChild(hud);

    document.getElementById('netpulse-hud-sync-btn').addEventListener('click', () => {
      const metrics = extractRouterMetrics();
      commitTelemetry(metrics);
    });
  }

  function updateHud(payload) {
    if (window.self !== window.top) return;
    const dot = document.getElementById('netpulse-hud-dot');
    const label = document.getElementById('netpulse-hud-label');
    if (!dot || !label) return;

    if (payload.status === 'connected' && payload.metrics && payload.metrics.rsrp !== null) {
      dot.style.backgroundColor = payload.eval.overallColor || '#10b981';
      label.style.color = '#f3f4f6';
      label.textContent = `RSRP: ${payload.metrics.rsrp} dBm | RSRQ: ${payload.metrics.rsrq !== null ? payload.metrics.rsrq : '--'} dB`;
    } else {
      dot.style.backgroundColor = '#f59e0b';
      label.style.color = '#9ca3af';
      label.textContent = 'Scanning 192.168 Gateway...';
    }
  }

  // Polling cycle
  function runExtraction() {
    const extracted = extractRouterMetrics();
    if (extracted.rsrp !== null || extracted.rssi !== null) {
      commitTelemetry(extracted);
    }
  }

  // MutationObserver to capture asynchronous AJAX / SPA page updates
  function observeMutations() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runExtraction();
      }, 1000);
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  // Expose global manual scrape hook for chrome.scripting or popup injection
  window.__netpulse_manual_scrape = function () {
    const m = extractRouterMetrics();
    return commitTelemetry(m, 'manual_scan');
  };

  window.__netpulse_extract_now = extractRouterMetrics;

  // Runtime message listener for on-demand scans
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRIGGER_ROUTER_SCRAPE') {
      const metrics = extractRouterMetrics();
      commitTelemetry(metrics).then((payload) => {
        sendResponse({ status: 'ok', payload: payload });
      });
      return true;
    }
  });

  // Initialization
  function init() {
    injectHud();
    runExtraction();
    observeMutations();

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(runExtraction, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
