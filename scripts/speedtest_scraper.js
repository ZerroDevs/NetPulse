/**
 * NetPulse - Speedtest & Fast.com Automation Scraper
 * Auto-detects test runs, extracts live bandwidth & latency,
 * pairs with concurrent router RF telemetry, and provides manual capture triggers.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__netpulse_speedtest_injected) return;
  window.__netpulse_speedtest_injected = true;

  const currentHost = window.location.hostname;
  const isSpeedtest = currentHost.includes('speedtest.net');
  const isFast = currentHost.includes('fast.com');

  if (!isSpeedtest && !isFast) return;

  const platformName = isSpeedtest ? 'Speedtest.net' : 'Fast.com';
  console.log(`[NetPulse] ${platformName} Scraper active on`, currentHost);

  let lastLoggedTestId = null;
  let isTestRunning = false;

  function parseSpeed(valStr, unitStr) {
    if (!valStr) return null;
    const num = parseFloat(String(valStr).replace(/[^\d.]/g, ''));
    if (isNaN(num)) return null;

    const unit = (unitStr || '').toLowerCase();
    if (unit.includes('kbps')) return parseFloat((num / 1000).toFixed(2));
    if (unit.includes('gbps')) return parseFloat((num * 1000).toFixed(2));
    return parseFloat(num.toFixed(2));
  }

  function parseLatency(valStr) {
    if (!valStr) return null;
    const num = parseFloat(String(valStr).replace(/[^\d.]/g, ''));
    return isNaN(num) ? null : Math.round(num);
  }

  /**
   * Display flat NetPulse toast notification in the DOM
   */
  function showToast(message, subtext, isSuccess = true) {
    const existing = document.getElementById('netpulse-toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'netpulse-toast-notification';
    toast.style.cssText = [
      'position: fixed',
      'bottom: 24px',
      'right: 24px',
      'z-index: 9999999',
      'background-color: #0b0f19',
      'border: 1px solid #1f2937',
      'border-left: 4px solid ' + (isSuccess ? '#10b981' : '#6366f1'),
      'border-radius: 6px',
      'padding: 12px 18px',
      'box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6)',
      'color: #f3f4f6',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 13px',
      'max-width: 400px',
      'display: flex',
      'flex-direction: column',
      'gap: 4px',
      'animation: netpulse-fadein 0.2s ease-out'
    ].join(';');

    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSuccess ? '#10b981' : '#6366f1'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span style="font-weight: 700; color: #f9fafb; font-size: 13px;">${message}</span>
        </div>
        <button id="netpulse-toast-close" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 2px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      ${subtext ? `<div style="font-family: ui-monospace, monospace; font-size: 11px; color: #9ca3af; margin-top: 2px;">${subtext}</div>` : ''}
    `;

    document.body.appendChild(toast);

    document.getElementById('netpulse-toast-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 8000);
  }

  /**
   * On-Page Speedtest NetPulse HUD
   */
  function injectSpeedtestHud() {
    if (document.getElementById('netpulse-speedtest-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'netpulse-speedtest-hud';
    hud.style.cssText = [
      'position: fixed',
      'top: 14px',
      'right: 14px',
      'z-index: 999999',
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
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
        <span style="font-weight: 700; color: #f9fafb;">NetPulse</span>
      </div>
      <div style="height: 14px; width: 1px; background-color: #1f2937;"></div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span id="netpulse-st-dot" style="width: 7px; height: 7px; border-radius: 50%; background-color: #10b981; display: inline-block;"></span>
        <span id="netpulse-st-status" style="font-family: ui-monospace, monospace; color: #9ca3af; font-size: 11px;">${platformName} Detected</span>
      </div>
      <button id="netpulse-st-capture-btn" style="background-color: #111827; border: 1px solid #1f2937; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-family: inherit;">Capture Now</button>
    `;

    document.body.appendChild(hud);

    document.getElementById('netpulse-st-capture-btn').addEventListener('click', () => {
      const extracted = extractCurrentSpeedtest();
      if (extracted && extracted.downloadMbps > 0) {
        recordSpeedtestResult(extracted);
      } else {
        showToast('NetPulse: No Active Result Yet', 'Test is either still running or has not started yet.', false);
      }
    });
  }

  function updateHudStatus(text, color = '#10b981') {
    const dot = document.getElementById('netpulse-st-dot');
    const status = document.getElementById('netpulse-st-status');
    if (dot) dot.style.backgroundColor = color;
    if (status) {
      status.textContent = text;
      status.style.color = '#f3f4f6';
    }
  }

  /**
   * Extract current speedtest metrics from the DOM (Speedtest.net or Fast.com)
   */
  function extractCurrentSpeedtest() {
    if (isSpeedtest) {
      const dlElem = document.querySelector('.download-speed') ||
                     document.querySelector('span[data-download-status-value]') ||
                     document.querySelector('.result-data-large.number.result-data-value.download-speed') ||
                     document.querySelector('.result-item-download .result-data-value');

      const ulElem = document.querySelector('.upload-speed') ||
                     document.querySelector('span[data-upload-status-value]') ||
                     document.querySelector('.result-data-large.number.result-data-value.upload-speed') ||
                     document.querySelector('.result-item-upload .result-data-value');

      const pingElem = document.querySelector('.ping-speed') ||
                       document.querySelector('.result-data-value.ping-speed') ||
                       document.querySelector('.result-item-ping .result-data-value');

      const jitterElem = document.querySelector('.jitter-speed') ||
                         document.querySelector('.result-data-value.jitter-speed') ||
                         document.querySelector('.result-item-jitter .result-data-value');

      const ispElem = document.querySelector('.js-data-isp');
      const serverElem = document.querySelector('.js-data-sponsor');
      const resultLink = document.querySelector('a.result-data-large[href*="/result/"]') ||
                         document.querySelector('a[href*="/result/"]');

      const dlVal = dlElem ? dlElem.innerText.trim() : null;
      const ulVal = ulElem ? ulElem.innerText.trim() : null;

      const downloadSpeed = parseSpeed(dlVal, 'mbps');
      const uploadSpeed = parseSpeed(ulVal, 'mbps');
      const ping = parseLatency(pingElem ? pingElem.innerText : null);
      const jitter = parseLatency(jitterElem ? jitterElem.innerText : null);

      if (downloadSpeed !== null && downloadSpeed > 0) {
        return {
          source: 'Speedtest.net',
          downloadMbps: downloadSpeed,
          uploadMbps: uploadSpeed || 0,
          pingMs: ping || 0,
          jitterMs: jitter || 0,
          isp: ispElem ? ispElem.innerText.trim() : 'Speedtest ISP',
          server: serverElem ? serverElem.innerText.trim() : 'Speedtest Server',
          resultUrl: resultLink ? resultLink.href : window.location.href
        };
      }
      return null;
    }

    if (isFast) {
      const speedValElem = document.getElementById('speed-value');
      const speedUnitElem = document.getElementById('speed-units');
      const uploadValElem = document.getElementById('upload-value');
      const uploadUnitElem = document.getElementById('upload-units');
      const latencyValElem = document.getElementById('latency-value');
      const bufferbloatValElem = document.getElementById('bufferbloat-value');

      if (!speedValElem) return null;

      const dlVal = speedValElem.innerText.trim();
      const dlUnit = speedUnitElem ? speedUnitElem.innerText.trim() : 'Mbps';
      const downloadSpeed = parseSpeed(dlVal, dlUnit);

      if (downloadSpeed !== null && downloadSpeed > 0) {
        const ulVal = uploadValElem ? uploadValElem.innerText.trim() : null;
        const ulUnit = uploadUnitElem ? uploadUnitElem.innerText.trim() : 'Mbps';
        const uploadSpeed = parseSpeed(ulVal, ulUnit);

        const ping = parseLatency(latencyValElem ? latencyValElem.innerText : null);
        const jitter = parseLatency(bufferbloatValElem ? bufferbloatValElem.innerText : null);

        return {
          source: 'Fast.com',
          downloadMbps: downloadSpeed,
          uploadMbps: uploadSpeed || 0,
          pingMs: ping || 0,
          jitterMs: jitter || 0,
          isp: 'Netflix / Fast.com CDN',
          server: 'Fast.com Edge',
          resultUrl: window.location.href
        };
      }
      return null;
    }

    return null;
  }

  /**
   * Save test result and pair with latest router telemetry
   */
  async function recordSpeedtestResult(testData) {
    if (!testData || !testData.downloadMbps) return;

    const testKey = `${testData.source}_${testData.downloadMbps}_${testData.uploadMbps}_${Math.floor(Date.now() / 15000)}`;
    if (lastLoggedTestId === testKey) {
      return; // Deduplicate
    }
    lastLoggedTestId = testKey;

    try {
      const storage = await chrome.storage.local.get(['netpulse_router_latest', 'netpulse_history']);
      const latestRouter = storage.netpulse_router_latest || null;
      const history = storage.netpulse_history || [];

      const routerMetrics = (latestRouter && latestRouter.metrics) ? latestRouter.metrics : null;

      let correlationAnalysis = 'No live router RF telemetry recorded at the time of this test.';
      if (window.NetPulseEvaluator && routerMetrics) {
        correlationAnalysis = window.NetPulseEvaluator.correlateSpeedtestWithRF(testData, routerMetrics);
      }

      const logEntry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        dateIso: new Date().toISOString(),
        source: testData.source,
        speedtest: testData,
        router: routerMetrics ? {
          rsrp: routerMetrics.rsrp,
          sinr: routerMetrics.sinr,
          rsrq: routerMetrics.rsrq,
          rssi: routerMetrics.rssi,
          band: routerMetrics.band,
          pci: routerMetrics.pci,
          dlBandwidth: routerMetrics.dlBandwidth,
          ulBandwidth: routerMetrics.ulBandwidth,
          caBands: routerMetrics.caBands || []
        } : null,
        correlationAnalysis: correlationAnalysis
      };

      history.unshift(logEntry);
      if (history.length > 500) history.length = 500;

      await chrome.storage.local.set({ netpulse_history: history });

      const pairedSignal = routerMetrics && routerMetrics.rsrp !== null
        ? `RSRP: ${routerMetrics.rsrp} dBm | SINR: ${routerMetrics.sinr} dB`
        : 'Router: Offline / Unpaired';

      updateHudStatus(`Logged: ${testData.downloadMbps} Mbps`, '#10b981');

      showToast(
        `NetPulse: ${testData.source} Captured`,
        `DL: ${testData.downloadMbps} Mbps | UL: ${testData.uploadMbps || '--'} Mbps | Ping: ${testData.pingMs || '--'} ms [${pairedSignal}]`,
        true
      );

      return logEntry;
    } catch (err) {
      console.error('[NetPulse] Failed to record speedtest log:', err);
      return null;
    }
  }

  // --- Speedtest.net Observers ---
  function initSpeedtestNet() {
    const checkDom = () => {
      const resultLink = document.querySelector('a.result-data-large[href*="/result/"]') ||
                         document.querySelector('a[href*="/result/"]') ||
                         document.querySelector('.result-item-id a');

      const dlElem = document.querySelector('.download-speed') ||
                     document.querySelector('span[data-download-status-value]') ||
                     document.querySelector('.result-data-large.number.result-data-value.download-speed');

      const ulElem = document.querySelector('.upload-speed') ||
                     document.querySelector('span[data-upload-status-value]') ||
                     document.querySelector('.result-data-large.number.result-data-value.upload-speed');

      const dlVal = dlElem ? dlElem.innerText.trim() : null;
      const ulVal = ulElem ? ulElem.innerText.trim() : null;

      const isCompleted = (resultLink && dlVal && dlVal !== '—' && dlVal !== '') ||
                          (dlVal && ulVal && dlVal !== '—' && ulVal !== '—' && !isNaN(parseFloat(dlVal)) && !isNaN(parseFloat(ulVal)) && parseFloat(dlVal) > 0);

      const isStillTesting = document.querySelector('.gauge-assembly') &&
                            !document.querySelector('.result-item-id') &&
                            (ulVal === '—' || ulVal === '');

      if (isStillTesting) {
        isTestRunning = true;
        updateHudStatus('Test in progress...', '#3b82f6');
        return;
      }

      if (isCompleted && (isTestRunning || resultLink)) {
        const extracted = extractCurrentSpeedtest();
        if (extracted) {
          isTestRunning = false;
          recordSpeedtestResult(extracted);
        }
      }
    };

    const observer = new MutationObserver(checkDom);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    setInterval(checkDom, 2000);
  }

  // --- Fast.com Observers ---
  function initFastCom() {
    let fastRecorded = false;

    const checkFast = () => {
      const speedValElem = document.getElementById('speed-value');
      const progressIndicator = document.getElementById('speed-progress-indicator');
      const speedContainer = document.getElementById('speed-container');

      if (!speedValElem) return;

      const isSucceeded = speedValElem.classList.contains('succeeded') ||
                          (progressIndicator && progressIndicator.classList.contains('succeeded')) ||
                          (speedContainer && speedContainer.classList.contains('succeeded'));

      if (!isSucceeded && speedValElem.innerText.trim() !== '') {
        fastRecorded = false;
        updateHudStatus('Measuring speed...', '#3b82f6');
      }

      if (isSucceeded && !fastRecorded) {
        setTimeout(() => {
          if (fastRecorded) return;
          fastRecorded = true;
          const extracted = extractCurrentSpeedtest();
          if (extracted) {
            recordSpeedtestResult(extracted);
          }
        }, 2500);
      }
    };

    const observer = new MutationObserver(checkFast);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    setInterval(checkFast, 1500);
  }

  // Global manual hook
  window.__netpulse_speedtest_scrape = function () {
    const extracted = extractCurrentSpeedtest();
    if (extracted) {
      return recordSpeedtestResult(extracted);
    }
    return Promise.resolve(null);
  };

  window.__netpulse_speedtest_extract_now = extractCurrentSpeedtest;

  // Runtime message handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRIGGER_SPEEDTEST_SCRAPE') {
      const extracted = extractCurrentSpeedtest();
      if (extracted) {
        recordSpeedtestResult(extracted).then((entry) => {
          sendResponse({ status: 'ok', data: entry || extracted });
        });
      } else {
        sendResponse({ status: 'no_data', message: 'No speed values active on test page' });
      }
      return true;
    }

    if (message.type === 'CHECK_SPEEDTEST_ACTIVE') {
      sendResponse({ status: 'active', platform: platformName });
      return true;
    }
  });

  // Init
  function init() {
    injectSpeedtestHud();
    if (isSpeedtest) initSpeedtestNet();
    if (isFast) initFastCom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
