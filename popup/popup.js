/**
 * NetPulse - Quick Popup Controller
 * Connects to chrome.storage.local for live telemetry synchronization,
 * provides one-click manual scan for both Router Gateway and Speedtest tabs,
 * and integrates bilingual i18n (English/Arabic RTL) with dual theme (Dark/Light).
 */

document.addEventListener('DOMContentLoaded', () => {
  const evaluator = window.NetPulseEvaluator;
  const i18n = window.NetPulseI18n;

  let currentLang = 'en';
  let currentTheme = 'dark';
  let latestRouterPayload = null;
  let latestHistoryList = [];

  // DOM Elements - Theme & Language
  const btnPopupTheme = document.getElementById('btn-popup-theme');
  const popupThemeIcon = document.getElementById('popup-theme-icon');
  const btnPopupLang = document.getElementById('btn-popup-lang');
  const popupLangText = document.getElementById('popup-lang-text');

  // DOM Elements - Status & Health
  const connectionPill = document.getElementById('connection-pill');
  const connectionLabel = document.getElementById('connection-label');
  const rfLastUpdated = document.getElementById('rf-last-updated');
  const overallHealthBadge = document.getElementById('overall-health-badge');
  const overallHealthText = document.getElementById('overall-health-text');
  const routerIpText = document.getElementById('router-ip-text');

  // DOM Elements - Active Tab Banner
  const activeTabBanner = document.getElementById('active-tab-banner');
  const activeTabText = document.getElementById('active-tab-text');

  // DOM Elements - Manual Scan (Router)
  const btnManualScan = document.getElementById('btn-manual-scan');
  const btnScanLabel = document.getElementById('btn-scan-label');
  const scanStatusMsg = document.getElementById('scan-status-msg');

  // DOM Elements - Manual Scan (Speedtest)
  const btnManualSpeedtest = document.getElementById('btn-manual-speedtest');
  const btnSpeedtestLabel = document.getElementById('btn-speedtest-label');
  const stScanStatus = document.getElementById('st-scan-status');

  // DOM Elements - Metrics
  const rsrpValue = document.getElementById('rsrp-value');
  const rsrpBadge = document.getElementById('rsrp-badge');
  const sinrValue = document.getElementById('sinr-value');
  const sinrBadge = document.getElementById('sinr-badge');
  const rsrqValue = document.getElementById('rsrq-value');
  const rsrqBadge = document.getElementById('rsrq-badge');
  const rssiValue = document.getElementById('rssi-value');
  const rssiBadge = document.getElementById('rssi-badge');

  // DOM Elements - CA
  const caPrimaryBand = document.getElementById('ca-primary-band');
  const caBandwidth = document.getElementById('ca-bandwidth');
  const caCarriersCount = document.getElementById('ca-carriers-count');

  // DOM Elements - Speedtest
  const stSourceTime = document.getElementById('st-source-time');
  const stDownVal = document.getElementById('st-down-val');
  const stUpVal = document.getElementById('st-up-val');
  const stPingVal = document.getElementById('st-ping-val');
  const stPairedIndicator = document.getElementById('st-paired-indicator');

  // Action Button
  const openDashboardBtn = document.getElementById('open-dashboard-btn');

  /* ==========================================================================
     THEME & LANGUAGE HANDLING
     ========================================================================== */
  const SUN_SVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_SVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function applyTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    popupThemeIcon.innerHTML = currentTheme === 'light' ? MOON_SVG : SUN_SVG;
  }

  btnPopupTheme.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    chrome.storage.local.set({ netpulse_theme: nextTheme });
  });

  function applyLanguage(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';
    if (i18n) {
      i18n.applyLanguage(currentLang);
    }
    popupLangText.textContent = currentLang === 'ar' ? 'EN' : 'AR';

    renderRouterTelemetry(latestRouterPayload);
    renderLatestSpeedtest(latestHistoryList);
    detectActiveTabContext();
  }

  btnPopupLang.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(nextLang);
    chrome.storage.local.set({ netpulse_lang: nextLang });
  });

  /* ==========================================================================
     FORMATTERS
     ========================================================================== */
  function formatTime(timestamp) {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return i18n ? i18n.t('no_tests_recorded', currentLang) : 'No tests recorded';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US');
  }

  function getTranslatedTier(grade) {
    if (!i18n) return grade || '--';
    const g = (grade || '').toLowerCase();
    if (g === 'excellent') return i18n.t('tier_excellent', currentLang);
    if (g === 'good') return i18n.t('tier_good', currentLang);
    if (g === 'fair') return i18n.t('tier_fair', currentLang);
    if (g === 'poor') return i18n.t('tier_poor', currentLang);
    if (g === 'clean') return i18n.t('tier_clean', currentLang);
    if (g === 'congested') return i18n.t('tier_congested', currentLang);
    if (g === 'heavy load') return i18n.t('tier_heavy_load', currentLang);
    if (g === 'strong') return i18n.t('tier_strong', currentLang);
    if (g === 'weak') return i18n.t('tier_weak', currentLang);
    return grade || '--';
  }

  function updateTierBadge(element, evalResult) {
    if (!element) return;
    element.className = 'badge-tier';
    element.textContent = getTranslatedTier(evalResult.grade);

    const grade = (evalResult.grade || '').toLowerCase();
    if (grade === 'excellent' || grade === 'clean' || grade === 'strong') {
      element.classList.add('tier-excellent');
    } else if (grade === 'good') {
      element.classList.add('tier-good');
    } else if (grade === 'fair' || grade === 'congested') {
      element.classList.add('tier-fair');
    } else if (grade === 'poor' || grade === 'heavy load' || grade === 'weak') {
      element.classList.add('tier-poor');
    }
  }

  function renderRouterTelemetry(latestData) {
    latestRouterPayload = latestData;

    if (!latestData || !latestData.metrics || (latestData.metrics.rsrp === null && latestData.metrics.rssi === null)) {
      connectionPill.className = 'status-pill status-unknown';
      connectionLabel.textContent = i18n ? i18n.t('awaiting_router', currentLang) : 'Awaiting Router';
      overallHealthBadge.className = 'health-badge';
      overallHealthText.textContent = i18n ? i18n.t('no_signal_telemetry', currentLang) : 'No Signal Telemetry';
      rfLastUpdated.textContent = '--:--:--';

      rsrpValue.textContent = '--';
      sinrValue.textContent = '--';
      rsrqValue.textContent = '--';
      rssiValue.textContent = '--';

      rsrpBadge.textContent = '--';
      sinrBadge.textContent = '--';
      rsrqBadge.textContent = '--';
      rssiBadge.textContent = '--';

      caPrimaryBand.textContent = '--';
      caBandwidth.textContent = '--';
      caCarriersCount.textContent = '--';
      return;
    }

    const m = latestData.metrics;

    connectionPill.className = 'status-pill status-connected';
    connectionLabel.textContent = i18n
      ? i18n.t('gateway_connected', currentLang, { source: latestData.source || 'Router' })
      : `Connected (${latestData.source || 'Router'})`;
    rfLastUpdated.textContent = formatTime(latestData.timestamp);

    if (latestData.routerUrl) {
      try {
        const u = new URL(latestData.routerUrl);
        routerIpText.textContent = u.hostname;
      } catch (e) {
        routerIpText.textContent = '192.168.*';
      }
    }

    const health = evaluator ? evaluator.getOverallHealth(m.rsrp, m.sinr, m.rsrq) : { status: 'Optimal RF', badgeClass: 'status-optimal' };
    overallHealthBadge.className = `health-badge ${health.badgeClass}`;

    let healthStatusText = health.status;
    if (i18n) {
      if (health.status === 'Optimal RF') healthStatusText = i18n.t('status_optimal', currentLang);
      else if (health.status === 'Good Connection') healthStatusText = i18n.t('status_good', currentLang);
      else if (health.status === 'Sector Congestion') healthStatusText = i18n.t('status_warning_congestion', currentLang);
      else if (health.status === 'RF Interference') healthStatusText = i18n.t('status_warning_interference', currentLang);
      else if (health.status.includes('Critical') || health.status.includes('Loss')) healthStatusText = i18n.t('status_critical', currentLang);
      else healthStatusText = i18n.t('status_fair', currentLang);
    }
    overallHealthText.textContent = healthStatusText;

    rsrpValue.textContent = m.rsrp !== null && m.rsrp !== undefined ? m.rsrp : '--';
    sinrValue.textContent = m.sinr !== null && m.sinr !== undefined ? m.sinr : '--';
    rsrqValue.textContent = m.rsrq !== null && m.rsrq !== undefined ? m.rsrq : '--';
    rssiValue.textContent = m.rssi !== null && m.rssi !== undefined ? m.rssi : '--';

    if (evaluator) {
      updateTierBadge(rsrpBadge, evaluator.evaluateMetric('rsrp', m.rsrp));
      updateTierBadge(sinrBadge, evaluator.evaluateMetric('sinr', m.sinr));
      updateTierBadge(rsrqBadge, evaluator.evaluateMetric('rsrq', m.rsrq));
      updateTierBadge(rssiBadge, evaluator.evaluateMetric('rssi', m.rssi));
    }

    caPrimaryBand.textContent = m.band || 'N/A';
    caBandwidth.textContent = m.dlBandwidth || '20 MHz';
    if (m.caBands && m.caBands.length > 1) {
      caCarriersCount.textContent = i18n
        ? i18n.t('ca_multi_carrier', currentLang, { count: m.caBands.length })
        : `${m.caBands.length}x CA (${m.caBands.join('+')})`;
    } else {
      caCarriersCount.textContent = i18n ? i18n.t('ca_single_carrier', currentLang) : '1x Component Carrier';
    }
  }

  function renderLatestSpeedtest(history) {
    latestHistoryList = history || [];

    if (!history || !Array.isArray(history) || history.length === 0) {
      stSourceTime.textContent = i18n ? i18n.t('no_tests_recorded', currentLang) : 'No tests recorded';
      stDownVal.textContent = '--';
      stUpVal.textContent = '--';
      stPingVal.textContent = '--';
      stPairedIndicator.innerHTML = `<span class="mono text-muted">${i18n ? i18n.t('rf_pairing_placeholder', currentLang) : 'RF telemetry pairing will appear here.'}</span>`;
      return;
    }

    const latest = history[0];
    const st = latest.speedtest || {};

    stSourceTime.textContent = `${latest.source || 'Speedtest'} (${formatRelativeTime(latest.timestamp)})`;
    stDownVal.textContent = st.downloadMbps !== undefined ? st.downloadMbps : '--';
    stUpVal.textContent = st.uploadMbps !== undefined ? st.uploadMbps : '--';
    stPingVal.textContent = st.pingMs !== undefined ? st.pingMs : '--';

    if (latest.router && (latest.router.rsrp !== null || latest.router.rssi !== null)) {
      const pairedLabel = i18n ? i18n.t('rf_paired', currentLang) : 'RF Paired:';
      stPairedIndicator.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: var(--accent-emerald);">${pairedLabel}</span>
          <span class="mono" style="color: var(--text-primary);">RSRP ${latest.router.rsrp !== null ? latest.router.rsrp + ' dBm' : '--'} | RSRQ ${latest.router.rsrq !== null ? latest.router.rsrq + ' dB' : '--'} (${latest.router.band || 'Cellular'})</span>
        </div>
      `;
    } else {
      stPairedIndicator.innerHTML = `<span class="mono text-muted">${i18n ? i18n.t('rf_unpaired', currentLang) : 'Test ran without simultaneous router RF lock.'}</span>`;
    }
  }

  /**
   * Auto-Detect Context on Active Tab
   */
  async function detectActiveTabContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;

      const urlObj = new URL(tab.url);
      const host = urlObj.hostname;

      if (host.includes('speedtest.net')) {
        activeTabBanner.style.display = 'flex';
        activeTabText.textContent = i18n
          ? i18n.t('detected_active_tab', currentLang, { platform: 'Speedtest.net' })
          : 'Detected: Speedtest.net active in current tab';
        btnSpeedtestLabel.textContent = currentLang === 'ar' ? 'التقاط Speedtest.net الآن' : 'Capture Speedtest.net Now';
      } else if (host.includes('fast.com')) {
        activeTabBanner.style.display = 'flex';
        activeTabText.textContent = i18n
          ? i18n.t('detected_active_tab', currentLang, { platform: 'Fast.com' })
          : 'Detected: Fast.com active in current tab';
        btnSpeedtestLabel.textContent = currentLang === 'ar' ? 'التقاط Fast.com الآن' : 'Capture Fast.com Now';
      } else if (host.startsWith('192.168.') || host.includes('router')) {
        activeTabBanner.style.display = 'flex';
        activeTabText.textContent = i18n
          ? i18n.t('detected_router', currentLang, { host: host })
          : `Detected Router: ${host}`;
        routerIpText.textContent = host;
      } else {
        activeTabBanner.style.display = 'none';
      }
    } catch (err) {
      console.warn('Context detection:', err);
    }
  }

  /* ==========================================================================
     MANUAL ROUTER SCAN
     ========================================================================== */
  btnManualScan.addEventListener('click', async () => {
    btnManualScan.classList.add('scanning');
    btnScanLabel.textContent = i18n ? i18n.t('scanning_active_tab', currentLang) : 'Scanning Router Tab...';
    scanStatusMsg.className = 'scan-status';
    scanStatusMsg.textContent = currentLang === 'ar' ? 'جاري الاتصال بصفحة الموجه...' : 'Connecting to router DOM...';

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        scanStatusMsg.className = 'scan-status warning';
        scanStatusMsg.textContent = currentLang === 'ar' ? 'لم يتم اكتشاف علامة تبويب نشطة.' : 'No active tab detected.';
        resetScanButton(btnManualScan, btnScanLabel, i18n ? i18n.t('manual_check_router', currentLang) : 'Manual Check / Scan Router Tab');
        return;
      }

      let host = 'gateway';
      try {
        const u = new URL(activeTab.url);
        host = u.hostname;
        routerIpText.textContent = host;
      } catch (e) {}

      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id, allFrames: true },
          files: ['shared/evaluator.js', 'scripts/router_scraper.js']
        });
      } catch (err) {}

      const executionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id, allFrames: true },
        func: () => {
          if (typeof window.__netpulse_manual_scrape === 'function') {
            return window.__netpulse_manual_scrape();
          }
          if (typeof window.__netpulse_extract_now === 'function') {
            return window.__netpulse_extract_now();
          }
          return null;
        }
      });

      let scrapedPayload = null;
      if (executionResults && Array.isArray(executionResults)) {
        for (const frameRes of executionResults) {
          const res = frameRes.result;
          if (res && res.metrics && (res.metrics.rsrp !== null || res.metrics.rssi !== null || res.metrics.rsrq !== null)) {
            scrapedPayload = res;
            break;
          } else if (res && (res.rsrp !== null || res.rssi !== null || res.rsrq !== null)) {
            scrapedPayload = {
              timestamp: Date.now(),
              status: 'connected',
              source: 'manual_scan',
              routerUrl: activeTab.url,
              metrics: res
            };
            break;
          }
        }
      }

      if (scrapedPayload && scrapedPayload.metrics) {
        renderRouterTelemetry(scrapedPayload);
        scanStatusMsg.className = 'scan-status success';
        const m = scrapedPayload.metrics;
        const details = [
          m.rsrp !== null ? `RSRP ${m.rsrp} dBm` : null,
          m.rsrq !== null ? `RSRQ ${m.rsrq} dB` : null,
          m.band ? `Band ${m.band}` : null
        ].filter(Boolean).join(' | ');
        scanStatusMsg.textContent = `${currentLang === 'ar' ? 'تم فحص' : 'Scanned'} ${host}! ${details}`;
      } else {
        scanStatusMsg.className = 'scan-status warning';
        scanStatusMsg.textContent = currentLang === 'ar'
          ? `تم فحص ${host}، لكن لم يتم العثور على أرقام الإشارة. تأكد من صفحة Cellular Info.`
          : `Scanned ${host}, but no RF metrics (RSRP/RSRQ) found. Check Cellular Info page.`;
      }
    } catch (error) {
      scanStatusMsg.className = 'scan-status error';
      scanStatusMsg.textContent = `${currentLang === 'ar' ? 'خطأ في الفحص' : 'Scan error'}: ${error.message || 'Could not access tab'}`;
    } finally {
      resetScanButton(btnManualScan, btnScanLabel, i18n ? i18n.t('manual_check_router', currentLang) : 'Manual Check / Scan Router Tab');
    }
  });

  /* ==========================================================================
     MANUAL SPEEDTEST CAPTURE
     ========================================================================== */
  btnManualSpeedtest.addEventListener('click', async () => {
    btnManualSpeedtest.classList.add('scanning');
    btnSpeedtestLabel.textContent = i18n ? i18n.t('searching_speedtest_tab', currentLang) : 'Searching Speedtest Tab...';
    stScanStatus.className = 'scan-status';
    stScanStatus.textContent = currentLang === 'ar' ? 'جاري تحديد جلسة الاختبار...' : 'Locating active Speedtest / Fast.com session...';

    try {
      const allTabs = await chrome.tabs.query({});
      let targetTab = null;

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url && (activeTab.url.includes('speedtest.net') || activeTab.url.includes('fast.com'))) {
        targetTab = activeTab;
      } else {
        targetTab = allTabs.find(t => t.url && (t.url.includes('speedtest.net') || t.url.includes('fast.com')));
      }

      if (!targetTab) {
        stScanStatus.className = 'scan-status warning';
        stScanStatus.textContent = currentLang === 'ar'
          ? 'لا توجد علامة تبويب لـ Speedtest أو Fast.com مفتوحة حالياً.'
          : 'No Speedtest.net or Fast.com tab currently open. Please open one to capture.';
        resetScanButton(btnManualSpeedtest, btnSpeedtestLabel, i18n ? i18n.t('manual_capture_speedtest', currentLang) : 'Manual Capture Speedtest Tab');
        return;
      }

      const host = new URL(targetTab.url).hostname;
      stScanStatus.textContent = currentLang === 'ar' ? `جاري قراءة النتائج من ${host}...` : `Extracting results from ${host}...`;

      try {
        await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          files: ['shared/evaluator.js', 'scripts/speedtest_scraper.js']
        });
      } catch (e) {}

      const executionResults = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        func: () => {
          if (typeof window.__netpulse_speedtest_scrape === 'function') {
            return window.__netpulse_speedtest_scrape();
          }
          if (typeof window.__netpulse_speedtest_extract_now === 'function') {
            return window.__netpulse_speedtest_extract_now();
          }
          return null;
        }
      });

      let capturedEntry = null;
      if (executionResults && executionResults[0] && executionResults[0].result) {
        capturedEntry = executionResults[0].result;
      }

      chrome.storage.local.get(['netpulse_history'], (res) => {
        const hist = res.netpulse_history || [];
        renderLatestSpeedtest(hist);

        if (hist.length > 0 && hist[0].speedtest && hist[0].speedtest.downloadMbps > 0) {
          const st = hist[0].speedtest;
          stScanStatus.className = 'scan-status success';
          stScanStatus.textContent = `${currentLang === 'ar' ? 'تم الالتقاط!' : 'Captured!'} DL: ${st.downloadMbps} Mbps | UL: ${st.uploadMbps || '--'} Mbps | Ping: ${st.pingMs || '--'} ms`;
        } else if (capturedEntry && capturedEntry.downloadMbps > 0) {
          stScanStatus.className = 'scan-status success';
          stScanStatus.textContent = `${currentLang === 'ar' ? 'تم الالتقاط!' : 'Captured!'} DL: ${capturedEntry.downloadMbps} Mbps | UL: ${capturedEntry.uploadMbps || '--'} Mbps`;
        } else {
          stScanStatus.className = 'scan-status warning';
          stScanStatus.textContent = currentLang === 'ar'
            ? `تم العثور على ${host}، لكن لم تنتهِ نتائج القياس بعد.`
            : `Found ${host}, but no finished speed numbers visible yet.`;
        }
      });
    } catch (err) {
      console.error('Speedtest scan failed:', err);
      stScanStatus.className = 'scan-status error';
      stScanStatus.textContent = `${currentLang === 'ar' ? 'خطأ في الالتقاط' : 'Capture error'}: ${err.message || 'Failed to read tab'}`;
    } finally {
      resetScanButton(btnManualSpeedtest, btnSpeedtestLabel, i18n ? i18n.t('manual_capture_speedtest', currentLang) : 'Manual Capture Speedtest Tab');
    }
  });

  function resetScanButton(btn, labelElem, defaultText) {
    setTimeout(() => {
      btn.classList.remove('scanning');
      labelElem.textContent = defaultText;
    }, 400);
  }

  // Initial Load from Storage
  chrome.storage.local.get([
    'netpulse_router_latest',
    'netpulse_history',
    'netpulse_theme',
    'netpulse_lang'
  ], (result) => {
    if (result.netpulse_theme) {
      applyTheme(result.netpulse_theme);
    }
    if (result.netpulse_lang) {
      applyLanguage(result.netpulse_lang);
    }

    renderRouterTelemetry(result.netpulse_router_latest);
    renderLatestSpeedtest(result.netpulse_history);
    detectActiveTabContext();
  });

  // Storage Change Listener
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes.netpulse_theme) {
      applyTheme(changes.netpulse_theme.newValue);
    }
    if (changes.netpulse_lang) {
      applyLanguage(changes.netpulse_lang.newValue);
    }
    if (changes.netpulse_router_latest) {
      renderRouterTelemetry(changes.netpulse_router_latest.newValue);
    }
    if (changes.netpulse_history) {
      renderLatestSpeedtest(changes.netpulse_history.newValue);
    }
  });

  // Navigation Handlers
  openDashboardBtn.addEventListener('click', () => {
    const dashboardUrl = chrome.runtime.getURL('dashboard/dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
  });

  const btnOpenAnalysis = document.getElementById('btn-open-analysis');
  if (btnOpenAnalysis) {
    btnOpenAnalysis.addEventListener('click', () => {
      const analysisUrl = chrome.runtime.getURL('analysis/analysis.html');
      chrome.tabs.create({ url: analysisUrl });
    });
  }

  const btnOpenOptions = document.getElementById('btn-open-options');
  if (btnOpenOptions) {
    btnOpenOptions.addEventListener('click', () => {
      const optionsUrl = chrome.runtime.getURL('options/options.html');
      chrome.tabs.create({ url: optionsUrl });
    });
  }
});
