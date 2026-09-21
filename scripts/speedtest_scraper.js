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

  // Only execute in the top-level benchmark window, never inside ad/tracker iframes
  if (window.top !== window.self) return;

  const platformName = isSpeedtest ? 'Speedtest.net' : 'Fast.com';
  console.log(`[NetPulse] ${platformName} Scraper active on`, currentHost);

  let lastLoggedTestId = null;
  let isTestRunning = false;

  /**
   * Check if the extension context is still valid.
   * Returns false after the extension is reloaded/updated while this tab is open.
   */
  function isExtensionContextValid() {
    try {
      // Accessing chrome.runtime.id throws if context is invalidated
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }


  /**
   * Parse speed values robustly, handling multi-number strings and units
   */
  function parseSpeed(valStr, unitStr) {
    if (!valStr) return null;
    const str = String(valStr).trim();
    if (!str || str === '—' || str === '-') return null;

    const match = str.match(/\b\d+(?:\.\d+)?\b/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    if (isNaN(num) || num <= 0) return null;

    const unit = (unitStr || '').toLowerCase();
    if (unit.includes('kbps')) return parseFloat((num / 1000).toFixed(2));
    if (unit.includes('gbps')) return parseFloat((num * 1000).toFixed(2));
    return parseFloat(num.toFixed(2));
  }

  /**
   * Parse latency values robustly
   */
  function parseLatency(valStr) {
    if (!valStr) return null;
    const str = String(valStr).trim();
    if (!str || str === '—' || str === '-') return null;

    const match = str.match(/\b\d+(?:\.\d+)?\b/);
    if (!match) return null;
    let num = parseFloat(match[0]);
    if (isNaN(num) || num < 0) return null;

    // Safety guard against concatenated digits like "16130238" (16 idle, 130 dl, 238 ul) or "16360"
    if (num > 1000) {
      const s = String(Math.round(num));
      if (s.length >= 7) {
        // e.g. 16130238 -> 16
        num = parseInt(s.substring(0, s.length - 6), 10);
      } else if (s.length >= 5) {
        // e.g. 16360, 16130 -> 16
        num = parseInt(s.substring(0, s.length - 3), 10);
      }
    }

    return Math.round(num);
  }

  /**
   * Display flat NetPulse toast notification in the DOM (Strict zero-gradient, zero-emoji)
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
      'max-width: 420px',
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
  /**
   * On-Page Speedtest NetPulse HUD
   */
  function injectSpeedtestHud() {
    if (document.getElementById('netpulse-speedtest-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'netpulse-speedtest-hud';
    hud.style.cssText = [
      'position: fixed !important',
      'top: 14px !important',
      'right: 14px !important',
      'width: auto !important',
      'height: auto !important',
      'max-width: 400px !important',
      'z-index: 999999 !important',
      'background-color: #0b0f19 !important',
      'border: 1px solid #1f2937 !important',
      'border-radius: 6px !important',
      'padding: 7px 11px !important',
      'color: #f3f4f6 !important',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
      'font-size: 12px !important',
      'display: flex !important',
      'align-items: center !important',
      'gap: 8px !important',
      'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6) !important',
      'user-select: none !important',
      'pointer-events: auto !important',
      'box-sizing: border-box !important'
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
      <button id="netpulse-st-capture-btn" type="button" style="background-color: #111827; border: 1px solid #1f2937; color: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-family: inherit;">Capture Now</button>
      <button id="netpulse-st-close-btn" type="button" title="Dismiss NetPulse Badge" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 0 3px; font-size: 15px; line-height: 1; margin-left: 2px;">&times;</button>
    `;

    document.body.appendChild(hud);

    document.getElementById('netpulse-st-capture-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const extracted = extractCurrentSpeedtest();
      if (extracted && extracted.downloadMbps > 0) {
        recordSpeedtestResult(extracted, true);
      } else {
        showToast('NetPulse: No Active Result Yet', 'Test is either still running or has not started yet.', false);
      }
    });

    const closeBtn = document.getElementById('netpulse-st-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.remove();
      });
    }
  }

  let currentHudText = '';
  let currentHudColor = '';
  function updateHudStatus(text, color = '#10b981') {
    if (currentHudText === text && currentHudColor === color) return;
    currentHudText = text;
    currentHudColor = color;
    const dot = document.getElementById('netpulse-st-dot');
    const status = document.getElementById('netpulse-st-status');
    if (dot) dot.style.backgroundColor = color;
    if (status) {
      status.textContent = text;
      status.style.color = '#f3f4f6';
    }
  }

  /**
   * Helper to scan candidate DOM selectors for a valid numeric value
   */
  function findNumericFromSelectors(selectors, isLatency = false) {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const rawText = (el.textContent || '').trim();
          if (!rawText || rawText === '—' || rawText === '-') continue;

          // Check direct parse
          const val = isLatency ? parseLatency(rawText) : parseSpeed(rawText);
          if (val !== null && val > 0) return val;

          // Check lines within container if label is included
          const lines = rawText.split(/[\r\n]+/);
          for (const line of lines) {
            const lineVal = isLatency ? parseLatency(line) : parseSpeed(line);
            if (lineVal !== null && lineVal > 0) return lineVal;
          }
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
    return null;
  }

  /**
   * Helper to extract Speedtest.net Result ID and full Result URL.
   * Returns null if test has not completed yet.
   */
  function getSpeedtestResultInfo() {
    // 1. URL Path: Speedtest pushes '/result/19696435847' upon test completion
    const path = window.location.pathname || '';
    const href = window.location.href || '';
    const urlMatch = path.match(/\/result\/(?:c\/)?(\d+)/i) || href.match(/\/result\/(?:c\/)?(\d+)/i);
    if (urlMatch) {
      return {
        resultId: urlMatch[1],
        resultUrl: `https://www.speedtest.net/result/${urlMatch[1]}`
      };
    }

    // 2. DOM Links: Share buttons or result links
    const linkElem = document.querySelector('a.result-data-large[href*="/result/"]') ||
                     document.querySelector('a[href*="/result/"]') ||
                     document.querySelector('a[href*="speedtest.net/result/"]') ||
                     document.querySelector('.result-item-id a') ||
                     document.querySelector('[data-result-id]');
    if (linkElem) {
      const linkHref = linkElem.getAttribute('href') || linkElem.href || '';
      const m = linkHref.match(/\/result\/(?:c\/)?(\d+)/i);
      if (m) {
        return {
          resultId: m[1],
          resultUrl: `https://www.speedtest.net/result/${m[1]}`
        };
      }
      const dataId = linkElem.getAttribute('data-result-id');
      if (dataId && /^\d+$/.test(dataId.trim())) {
        return {
          resultId: dataId.trim(),
          resultUrl: `https://www.speedtest.net/result/${dataId.trim()}`
        };
      }
    }

    // 3. Text rendered on test completion: "Result ID: 19696435847"
    const bodyText = (document.body ? document.body.textContent : '') || '';
    const idMatch = bodyText.match(/Result\s*ID:?\s*(\d+)/i);
    if (idMatch) {
      return {
        resultId: idMatch[1],
        resultUrl: `https://www.speedtest.net/result/${idMatch[1]}`
      };
    }

    return null;
  }

  /**
   * Multi-strategy Speedtest.net extractor
   * Supports modern React / Tailwind / Material-UI DOM, legacy selectors, and full-page text fallbacks.
   */
  function extractSpeedtestNetMetrics() {
    let downloadSpeed = null;
    let uploadSpeed = null;
    let ping = null;
    let jitter = null;
    let resultId = null;
    let resultUrl = window.location.href;
    let isp = 'Speedtest ISP';
    let server = 'Speedtest Server';

    // 1. Result ID & URL from completion link
    const resInfo = getSpeedtestResultInfo();
    if (resInfo) {
      resultId = resInfo.resultId;
      resultUrl = resInfo.resultUrl;
    }

    // 2. DOM Strategy A: Modern React Speedtest Components
    // Modern Speedtest renders speed in h3 with font-mono text-5xl inside container with "Download" / "Upload"
    const allContainers = Array.from(document.querySelectorAll('div, section, p, [class*="flex"]'));
    for (const c of allContainers) {
      const text = (c.textContent || '').trim();
      // Check if container labels download
      if ((/^\s*download\b/i.test(text) || /\bdownload\s+mbps/i.test(text)) && !downloadSpeed) {
        const numElem = c.querySelector('h3, [class*="text-5xl"], [class*="font-mono"], [class*="result-data"]') ||
                        c.parentElement?.querySelector('h3, [class*="text-5xl"], [class*="font-mono"]');
        if (numElem) {
          const val = parseSpeed(numElem.textContent);
          if (val !== null && val > 0) downloadSpeed = val;
        }
      }
      // Check if container labels upload
      if ((/^\s*upload\b/i.test(text) || /\bupload\s+mbps/i.test(text)) && !uploadSpeed) {
        const numElem = c.querySelector('h3, [class*="text-5xl"], [class*="font-mono"], [class*="result-data"]') ||
                        c.parentElement?.querySelector('h3, [class*="text-5xl"], [class*="font-mono"]');
        if (numElem) {
          const val = parseSpeed(numElem.textContent);
          if (val !== null && val > 0) uploadSpeed = val;
        }
      }
    }

    // DOM Strategy B: Direct H3 / text-5xl numeric extraction
    if (!downloadSpeed || !uploadSpeed) {
      const numericH3s = Array.from(document.querySelectorAll('h3, [class*="text-5xl"], [class*="font-mono"]'))
        .map(el => parseSpeed(el.textContent))
        .filter(val => val !== null && val > 0);

      if (numericH3s.length >= 2) {
        if (!downloadSpeed) downloadSpeed = numericH3s[0];
        if (!uploadSpeed) uploadSpeed = numericH3s[1];
      } else if (numericH3s.length === 1 && !downloadSpeed) {
        downloadSpeed = numericH3s[0];
      }
    }

    // DOM Strategy C: Legacy class selectors
    if (!downloadSpeed) {
      downloadSpeed = findNumericFromSelectors([
        '.result-item-download .result-data-value',
        '.result-item-download [class*="result-data"]',
        '.result-item-download span',
        '.result-item-download',
        'span[data-download-status-value]',
        '.result-data-large.download-speed',
        '.result-view-data .download-speed',
        '.result-container .download-speed',
        '.download-speed',
        '[class*="download-speed" i]',
        '[id*="download-speed" i]',
        '[data-test-id="download-speed"]'
      ], false);
    }

    if (!uploadSpeed) {
      uploadSpeed = findNumericFromSelectors([
        '.result-item-upload .result-data-value',
        '.result-item-upload [class*="result-data"]',
        '.result-item-upload span',
        '.result-item-upload',
        'span[data-upload-status-value]',
        '.result-data-large.upload-speed',
        '.result-view-data .upload-speed',
        '.result-container .upload-speed',
        '.upload-speed',
        '[class*="upload-speed" i]',
        '[id*="upload-speed" i]',
        '[data-test-id="upload-speed"]'
      ], false);
    }

    // Strategy D: Text Regex Extraction across page
    let bodyText = null;
    function getBodyText() {
      if (bodyText === null) {
        bodyText = (document.body ? document.body.textContent : '') || '';
      }
      return bodyText;
    }

    if (!downloadSpeed || !uploadSpeed) {
      const bt = getBodyText();

      // Look for Download Mbps followed by numbers
      if (!downloadSpeed) {
        const dlMatch = bt.match(/DOWNLOAD(?:\s+Mbps)?[\s\r\n]+([\d.]+)/i) ||
                        bt.match(/Download(?:\s*Speed)?\s*[:\s\r\n]+([\d.]+)/i) ||
                        bt.match(/([\d.]+)\s*(?:Mbps)?\s*DOWNLOAD/i);
        if (dlMatch) downloadSpeed = parseSpeed(dlMatch[1]);
      }

      // Look for Upload Mbps followed by numbers
      if (!uploadSpeed) {
        const ulMatch = bt.match(/UPLOAD(?:\s+Mbps)?[\s\r\n]+([\d.]+)/i) ||
                        bt.match(/Upload(?:\s*Speed)?\s*[:\s\r\n]+([\d.]+)/i) ||
                        bt.match(/([\d.]+)\s*(?:Mbps)?\s*UPLOAD/i);
        if (ulMatch) uploadSpeed = parseSpeed(ulMatch[1]);
      }

      // Multi-column layout fallback
      if (!downloadSpeed || !uploadSpeed) {
        const multiCol = bt.match(/DOWNLOAD[^\r\n]*UPLOAD[^\r\n]*[\r\n]+[\s]*([\d.]+)[\s]+([\d.]+)/i);
        if (multiCol) {
          if (!downloadSpeed) downloadSpeed = parseSpeed(multiCol[1]);
          if (!uploadSpeed) uploadSpeed = parseSpeed(multiCol[2]);
        }
      }
    }

    // Ping / Latency Extraction
    // Strategy A: Legacy CSS selectors
    ping = findNumericFromSelectors([
      '.result-item-ping .result-data-value',
      '.result-item-ping [class*="result-data"]',
      '.result-item-ping span',
      '.result-item-ping',
      '.result-data-value.ping-speed',
      '.ping-speed',
      '[class*="ping-speed" i]'
    ], true);

    // Strategy B: Modern Speedtest DOM — find the "Idle" label, take its sibling number
    if (!ping || ping > 1000) {
      const allLeafs = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0);
      // Look for an element whose text is exactly "Idle"
      const idleEl = allLeafs.find(el => (el.textContent || '').trim().toLowerCase() === 'idle');
      if (idleEl) {
        // Walk to parent container, find the first numeric sibling
        let container = idleEl.parentElement;
        while (container && container.querySelectorAll('*').length < 3) {
          container = container.parentElement;
        }
        if (container) {
          const numLeafs = Array.from(container.querySelectorAll('*'))
            .filter(el => el.children.length === 0)
            .map(el => (el.textContent || '').trim())
            .filter(t => /^\d+$/.test(t))
            .map(t => parseInt(t, 10))
            .filter(n => n > 0 && n <= 999);
          if (numLeafs.length > 0) ping = numLeafs[0]; // first number = Idle ping
        }
      }
    }

    // Strategy C: "Ping ms" row — take ONLY the FIRST integer (Idle), not DL or UL numbers
    if (!ping || ping > 1000) {
      // Find the element whose direct text content (not children's) contains "Ping ms"
      const allElems = Array.from(document.querySelectorAll('div, span, p, td, h4, h5, label'));
      const pingLabel = allElems.find(el => {
        const ownText = Array.from(el.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent.trim())
          .join('');
        return /ping\s*ms/i.test(ownText) || /^ping\s*ms$/i.test((el.textContent || '').trim());
      });
      if (pingLabel) {
        // Walk up to find a container that holds the numeric siblings
        let row = pingLabel.parentElement;
        // Try up to 3 levels up
        for (let i = 0; i < 3 && row; i++) {
          const nums = Array.from(row.querySelectorAll('*'))
            .filter(el => el.children.length === 0)
            .map(el => (el.textContent || '').trim())
            .filter(t => /^\d{1,4}$/.test(t))
            .map(t => parseInt(t, 10))
            .filter(n => n > 0 && n <= 999);
          if (nums.length >= 1) {
            ping = nums[0]; // first = Idle
            if (nums.length >= 2) jitter = nums[1]; // second = Download jitter
            break;
          }
          row = row.parentElement;
        }
      }
    }

    // Strategy D: Text regex — skip any non-digit chars between "Ping ms" and first number
    if (!ping || ping > 1000) {
      const bt = getBodyText();
      // [^\d]*? skips icon/symbol characters that appear between label and values in modern Speedtest UI
      const pingMatch = bt.match(/Ping\s*ms[^\d]*?(\d{1,4})/i);
      if (pingMatch) {
        const val = parseInt(pingMatch[1], 10);
        if (val > 0 && val <= 999) ping = val;
      }
      // If still nothing, try just finding "Ping" followed by a reasonable number
      if (!ping || ping > 999) {
        const fallback = bt.match(/\bping\b[^\d]*?(\d{1,3})\s*ms/i);
        if (fallback) {
          const val = parseInt(fallback[1], 10);
          if (val > 0 && val <= 999) ping = val;
        }
      }
    }

    // Jitter — same approach: look for Download jitter (2nd number in the Ping ms row)
    jitter = findNumericFromSelectors([
      '.result-item-jitter .result-data-value',
      '.result-item-jitter span',
      '.result-item-jitter',
      '.jitter-speed',
      '.result-data-value.jitter-speed',
      '[class*="jitter-speed" i]'
    ], true);

    if (!jitter) {
      // Try to find "Download" jitter from ping row (2nd integer)
      const pingLabel = Array.from(document.querySelectorAll('div, span, p, td'))
        .find(el => /^ping\s*(ms)?$/i.test((el.textContent || '').trim()) && el.children.length <= 1);
      if (pingLabel) {
        const row = pingLabel.closest('div, tr, section, [class*="flex"]') || pingLabel.parentElement;
        if (row) {
          const nums = Array.from(row.querySelectorAll('*'))
            .filter(el => el.children.length === 0)
            .map(el => (el.textContent || '').trim())
            .filter(t => /^\d{1,4}$/.test(t))
            .map(t => parseInt(t, 10))
            .filter(n => n > 0 && n <= 999);
          if (nums.length >= 2) jitter = nums[1]; // 2nd = Download jitter
        }
      }
    }

    if (!jitter) {
      const bt = getBodyText();
      // [^\d]*? skips icon characters between label and value
      const jitterMatch = bt.match(/Jitter\s*(?:ms)?[^\d]*?(\d{1,4})/i);
      if (jitterMatch) {
        const val = parseInt(jitterMatch[1], 10);
        if (val >= 0 && val <= 999) jitter = val;
      }
    }

    if (ping) ping = parseLatency(String(ping));

    // Result ID from text if still not found
    if (!resultId) {
      const bt = getBodyText();
      const idMatch = bt.match(/Result\s*ID:?\s*(\d+)/i);
      if (idMatch) {
        resultId = idMatch[1];
        resultUrl = `https://www.speedtest.net/result/${resultId}`;
      }
    }

    // ISP
    const ispElem = document.querySelector('.js-data-isp') ||
                    document.querySelector('[data-isp]') ||
                    document.querySelector('.result-data-source') ||
                    document.querySelector('.result-item-host .result-data-value');
    if (ispElem && ispElem.textContent.trim()) {
      isp = ispElem.textContent.trim();
    } else if (window.__CLIENT_CONFIG__ && window.__CLIENT_CONFIG__.userSession && window.__CLIENT_CONFIG__.userSession.ispName) {
      isp = window.__CLIENT_CONFIG__.userSession.ispName;
    } else {
      const bt = getBodyText();
      const ispMatch = bt.match(/Connections[\s\r\n]+(?:Multi|Single)[\s\r\n]+([^\r\n]+)/i);
      if (ispMatch) {
        isp = ispMatch[1].trim();
      }
    }

    // Server
    const serverElem = document.querySelector('.js-data-sponsor') ||
                       document.querySelector('.host-location') ||
                       document.querySelector('.server-name') ||
                       document.querySelector('.server-current') ||
                       document.querySelector('[data-server]');
    if (serverElem && serverElem.textContent.trim()) {
      server = serverElem.textContent.trim();
    } else {
      const bt = getBodyText();
      const ipBlock = bt.match(/(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})[\s\r\n]+([^\r\n]*?)\s*Change Server/i);
      if (ipBlock && ipBlock[1]) {
        server = ipBlock[1].trim().split(/[\r\n]+/).map(s => s.trim()).filter(Boolean).join(' ');
      } else {
        const beforeChange = bt.match(/([\s\S]*?)\s*Change Server/i);
        if (beforeChange && beforeChange[1]) {
          const lines = beforeChange[1].trim().split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
          if (lines.length > 0) server = lines.slice(-2).join(' ');
        }
      }
    }

    if (downloadSpeed !== null && downloadSpeed > 0) {
      return {
        source: 'Speedtest.net',
        downloadMbps: downloadSpeed,
        uploadMbps: uploadSpeed || 0,
        pingMs: ping || 0,
        jitterMs: jitter || 0,
        isp: isp,
        server: server,
        resultUrl: resultUrl,
        resultId: resultId
      };
    }
    return null;
  }

  /**
   * Fast.com extractor
   */

  function extractFastComMetrics() {
    const speedValElem = document.getElementById('speed-value');
    const speedUnitElem = document.getElementById('speed-units');
    const uploadValElem = document.getElementById('upload-value');
    const uploadUnitElem = document.getElementById('upload-units');
    const latencyValElem = document.getElementById('latency-value');
    const bufferbloatValElem = document.getElementById('bufferbloat-value');

    if (!speedValElem) return null;

    const dlVal = (speedValElem.textContent || '').trim();
    const dlUnit = speedUnitElem ? (speedUnitElem.textContent || '').trim() : 'Mbps';
    const downloadSpeed = parseSpeed(dlVal, dlUnit);

    if (downloadSpeed !== null && downloadSpeed > 0) {
      const ulVal = uploadValElem ? (uploadValElem.textContent || '').trim() : null;
      const ulUnit = uploadUnitElem ? (uploadUnitElem.textContent || '').trim() : 'Mbps';
      const uploadSpeed = parseSpeed(ulVal, ulUnit);

      const ping = parseLatency(latencyValElem ? latencyValElem.textContent : null);
      const jitter = parseLatency(bufferbloatValElem ? bufferbloatValElem.textContent : null);

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

  /**
   * Extract current speedtest metrics from the DOM (Speedtest.net or Fast.com)
   */
  function extractCurrentSpeedtest() {
    if (isSpeedtest) return extractSpeedtestNetMetrics();
    if (isFast) return extractFastComMetrics();
    return null;
  }

  /**
   * Save test result and pair with latest router telemetry
   */
  async function recordSpeedtestResult(testData, isManual = false) {
    if (!isExtensionContextValid()) return null; // Extension was reloaded, stop gracefully
    if (!testData || !testData.downloadMbps) return;

    // Automatic capture on Speedtest.net requires a valid resultId!
    // This guarantees that we ONLY capture at the end from the result link, never intermediate test ticks.
    if (testData.source === 'Speedtest.net' && !isManual && !testData.resultId) {
      return null;
    }

    // Check configuration settings if triggered automatically
    if (!isManual) {
      try {
        const cfgStorage = await chrome.storage.local.get(['netpulse_settings']);
        const settings = cfgStorage.netpulse_settings || {};
        if (testData.source === 'Speedtest.net' && settings.autoCaptureSpeedtest === false) return;
        if (testData.source === 'Fast.com' && settings.autoCaptureFast === false) return;
        if (settings.minSpeedThreshold && testData.downloadMbps < settings.minSpeedThreshold) return;
      } catch (e) {}
    }

    const testKey = testData.resultId
      ? `${testData.source}_${testData.resultId}`
      : `${testData.source}_${testData.downloadMbps}_${testData.uploadMbps}_${Math.floor(Date.now() / 60000)}`;

    if (lastLoggedTestId === testKey) {
      if (isManual) {
        showToast(
          'NetPulse: Result Already Logged',
          `DL: ${testData.downloadMbps} Mbps | UL: ${testData.uploadMbps || '--'} Mbps | Ping: ${testData.pingMs || '--'} ms (Recorded)`,
          true
        );
      }
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
          cellId: routerMetrics.cellId || null,
          dlBandwidth: routerMetrics.dlBandwidth,
          ulBandwidth: routerMetrics.ulBandwidth,
          caBands: routerMetrics.caBands || [],
          secondaryBands: routerMetrics.secondaryBands || []
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
    // Intercept pushState & replaceState to detect instant result URL navigation!
    try {
      const origPush = history.pushState;
      history.pushState = function (...args) {
        origPush.apply(this, args);
        // Wait 1800ms so React can finish rendering the result page (ping/jitter appear later than DL/UL)
        setTimeout(checkDom, 1800);
      };
      const origReplace = history.replaceState;
      history.replaceState = function (...args) {
        origReplace.apply(this, args);
        setTimeout(checkDom, 1800);
      };
      window.addEventListener('popstate', () => setTimeout(checkDom, 1800));
    } catch (e) {}

    const checkDom = () => {
      // Stop silently if extension was reloaded
      if (!isExtensionContextValid()) return;
      // 1. Completed state check:
      // A Speedtest is completed ONLY when a Result ID / Result URL exists (e.g. https://www.speedtest.net/result/19696435847)!
      const resultInfo = getSpeedtestResultInfo();
      if (resultInfo && resultInfo.resultId) {
        const extracted = extractCurrentSpeedtest();
        if (extracted && extracted.downloadMbps > 0) {
          isTestRunning = false;

          // If ping is 0 but we have a result ID, the page may not have fully rendered yet.
          // Retry once after 2 seconds to get the real ping value before logging.
          if (extracted.pingMs === 0 && !extracted._retried) {
            updateHudStatus('Capturing result...', '#f59e0b');
            setTimeout(() => {
              if (!isExtensionContextValid()) return;
              const retried = extractCurrentSpeedtest();
              if (retried && retried.downloadMbps > 0) {
                retried._retried = true;
                updateHudStatus(`Speedtest Logged: ${retried.downloadMbps} Mbps`, '#10b981');
                recordSpeedtestResult(retried, false);
              } else {
                // Log with what we have
                extracted._retried = true;
                updateHudStatus(`Speedtest Logged: ${extracted.downloadMbps} Mbps`, '#10b981');
                recordSpeedtestResult(extracted, false);
              }
            }, 2000);
            return;
          }

          updateHudStatus(`Speedtest Logged: ${extracted.downloadMbps} Mbps`, '#10b981');
          recordSpeedtestResult(extracted, false);
          return;
        }
      }


      // 2. Active test check:
      // When resultId does not exist yet, check if test is currently running:
      const isGaugeActive = !!document.querySelector(
        '.gauge-assembly.testing, .test-mode-progress, .gauge-speed-download, .gauge-speed-upload, [class*="gauge-assembly"]'
      );
      const fullText = (document.body ? document.body.textContent : '') || '';
      const isTestingText = /Testing download|Testing upload|Finding optimal server/i.test(fullText);
      const extractedNow = extractCurrentSpeedtest();
      const hasLiveSpeeds = extractedNow && (extractedNow.downloadMbps > 0 || extractedNow.uploadMbps > 0);

      if (isGaugeActive || isTestingText || hasLiveSpeeds) {
        isTestRunning = true;
        updateHudStatus('Test in progress...', '#3b82f6');
        return;
      }

      // 3. Idle state on home screen
      isTestRunning = false;
      updateHudStatus('Speedtest.net Ready', '#10b981');
    };

    // Run periodic non-blocking check every 1.5 seconds.
    // Zero MutationObserver on document.body, keeping browser event loop 100% fluid and responsive.
    setInterval(checkDom, 1500);
    setTimeout(checkDom, 1000);
  }

  // --- Fast.com Observers ---
  function initFastCom() {
    let fastRecorded = false;

    const checkFast = () => {
      // Stop silently if extension was reloaded
      if (!isExtensionContextValid()) return;

      const speedValElem = document.getElementById('speed-value');
      const progressIndicator = document.getElementById('speed-progress-indicator');
      const speedContainer = document.getElementById('speed-container');

      if (!speedValElem) return;

      const isSucceeded = speedValElem.classList.contains('succeeded') ||
                          (progressIndicator && progressIndicator.classList.contains('succeeded')) ||
                          (speedContainer && speedContainer.classList.contains('succeeded'));

      const rawVal = (speedValElem.textContent || '').trim();

      if (!isSucceeded && rawVal !== '') {
        fastRecorded = false;
        updateHudStatus('Measuring speed...', '#3b82f6');
      }

      if (isSucceeded && !fastRecorded) {
        fastRecorded = true;
        // Wait briefly for Fast.com to finish calculating final upload/latency if expanded
        setTimeout(() => {
          const extracted = extractCurrentSpeedtest();
          if (extracted) {
            recordSpeedtestResult(extracted, false);
          }
        }, 1500);
      }
    };

    // Run periodic non-blocking check every 1.5 seconds.
    // Zero MutationObserver on document.body, keeping Fast.com animations smooth and clicks responsive.
    setInterval(checkFast, 1500);
    setTimeout(checkFast, 1000);
  }

  // Global manual hook
  window.__netpulse_speedtest_scrape = function () {
    const extracted = extractCurrentSpeedtest();
    if (extracted) {
      return recordSpeedtestResult(extracted, true);
    }
    return Promise.resolve(null);
  };

  window.__netpulse_speedtest_extract_now = extractCurrentSpeedtest;

  // Runtime message handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TRIGGER_SPEEDTEST_SCRAPE') {
      const extracted = extractCurrentSpeedtest();
      if (extracted) {
        recordSpeedtestResult(extracted, true).then((entry) => {
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
