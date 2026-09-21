/**
 * NetPulse - Speedtest Controller & Runner Script
 * Manages test execution, live RF pairing, UI updates, and storage persistence under "NetPulse Test".
 */

(function () {
  'use strict';

  let currentLang = 'en';
  let currentTheme = 'dark';
  let privacyMode = false;
  let currentRouterData = null;
  let activeRunner = null;

  // DOM Element References
  const btnStart = document.getElementById('btn-start-speedtest');
  const btnAbort = document.getElementById('btn-abort-speedtest');
  const btnViewHistory = document.getElementById('btn-view-history');
  const saveNotice = document.getElementById('speedtest-save-notice');

  const phaseBadge = document.getElementById('speedtest-phase-badge');
  const phaseText = document.getElementById('speedtest-phase-text');
  const progressFill = document.getElementById('arena-progress-fill');

  const focusLabel = document.getElementById('focus-metric-label');
  const focusValue = document.getElementById('focus-metric-value');
  const focusUnit = document.getElementById('focus-metric-unit');

  const statPing = document.getElementById('stat-ping-val');
  const statJitter = document.getElementById('stat-jitter-val');
  const statDl = document.getElementById('stat-dl-val');
  const statUl = document.getElementById('stat-ul-val');

  const rfHealthBadge = document.getElementById('rf-health-badge');
  const rfRsrp = document.getElementById('rf-rsrp-val');
  const rfSinr = document.getElementById('rf-sinr-val');
  const rfRsrq = document.getElementById('rf-rsrq-val');
  const rfRssi = document.getElementById('rf-rssi-val');
  const rfBand = document.getElementById('rf-band-val');
  const rfPci = document.getElementById('rf-pci-val');
  const rfCell = document.getElementById('rf-cell-val');

  const previewBbGrade = document.getElementById('preview-bb-grade');
  const previewCsiScore = document.getElementById('preview-csi-score');
  const previewDlLoaded = document.getElementById('preview-dl-loaded');

  const btnPrivacyToggle = document.getElementById('btn-privacy-toggle');
  const privacyToggleText = document.getElementById('privacy-toggle-text');
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const toastBanner = document.getElementById('toast-banner');

  const routerPill = document.getElementById('router-connection-pill');
  const routerPillLabel = document.getElementById('router-connection-label');
  const syncIndicator = document.getElementById('live-sync-indicator');

  /* ==========================================================================
     INITIALIZATION & STORAGE SYNC
     ========================================================================= */
  async function init() {
    try {
      const data = await chrome.storage.local.get([
        'netpulse_lang',
        'netpulse_theme',
        'netpulse_privacy_mode',
        'netpulse_router_latest'
      ]);

      if (data.netpulse_lang) currentLang = data.netpulse_lang;
      if (data.netpulse_theme) currentTheme = data.netpulse_theme;
      if (data.netpulse_privacy_mode !== undefined) privacyMode = !!data.netpulse_privacy_mode;
      if (data.netpulse_router_latest) currentRouterData = data.netpulse_router_latest;

      applyTheme(currentTheme);
      applyLanguage(currentLang);
      applyPrivacyMode(privacyMode);
      renderRfSnapshot(currentRouterData ? currentRouterData.metrics : null);

      setupListeners();
    } catch (err) {
      console.error('[NetPulse Speedtest] Init error:', err);
    }
  }

  function setupListeners() {
    if (btnStart) btnStart.addEventListener('click', startSpeedtest);
    if (btnAbort) btnAbort.addEventListener('click', abortSpeedtest);

    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'ar' : 'en';
        applyLanguage(nextLang);
        chrome.storage.local.set({ netpulse_lang: nextLang });
      });
    }

    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        chrome.storage.local.set({ netpulse_theme: nextTheme });
      });
    }

    if (btnPrivacyToggle) {
      btnPrivacyToggle.addEventListener('click', () => {
        privacyMode = !privacyMode;
        applyPrivacyMode(privacyMode);
        chrome.storage.local.set({ netpulse_privacy_mode: privacyMode });
      });
    }

    // Chrome Storage Listener for real-time router sync
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if (changes.netpulse_router_latest) {
        currentRouterData = changes.netpulse_router_latest.newValue;
        renderRfSnapshot(currentRouterData ? currentRouterData.metrics : null);
      }

      if (changes.netpulse_lang && changes.netpulse_lang.newValue !== currentLang) {
        applyLanguage(changes.netpulse_lang.newValue);
      }

      if (changes.netpulse_theme && changes.netpulse_theme.newValue !== currentTheme) {
        applyTheme(changes.netpulse_theme.newValue);
      }

      if (changes.netpulse_privacy_mode !== undefined && changes.netpulse_privacy_mode.newValue !== privacyMode) {
        applyPrivacyMode(changes.netpulse_privacy_mode.newValue);
      }
    });
  }

  /* ==========================================================================
     THEME & LANGUAGE & PRIVACY
     ========================================================================= */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  function applyLanguage(lang) {
    currentLang = lang;
    if (window.NetPulseI18n) {
      window.NetPulseI18n.applyLanguage(lang, document);
    }
    if (langToggleText) {
      langToggleText.textContent = lang === 'en' ? 'العربية' : 'English';
    }
  }

  function applyPrivacyMode(enabled) {
    privacyMode = enabled;
    if (privacyToggleText) {
      privacyToggleText.textContent = enabled ? 'Privacy: ON' : 'Privacy: OFF';
    }
    if (btnPrivacyToggle) {
      btnPrivacyToggle.style.borderColor = enabled ? '#10b981' : '';
      btnPrivacyToggle.style.color = enabled ? '#10b981' : '';
    }
    renderRfSnapshot(currentRouterData ? currentRouterData.metrics : null);
  }

  function showToast(msg) {
    if (!toastBanner) return;
    toastBanner.textContent = msg;
    toastBanner.style.display = 'block';
    setTimeout(() => {
      toastBanner.style.display = 'none';
    }, 3800);
  }

  /* ==========================================================================
     RF TELEMETRY SNAPSHOT
     ========================================================================= */
  function renderRfSnapshot(m) {
    const evaluator = window.NetPulseEvaluator;
    const isAr = currentLang === 'ar';

    if (!m) {
      if (rfRsrp) rfRsrp.textContent = '--';
      if (rfSinr) rfSinr.textContent = '--';
      if (rfRsrq) rfRsrq.textContent = '--';
      if (rfRssi) rfRssi.textContent = '--';
      if (rfBand) rfBand.textContent = '--';
      if (rfPci) rfPci.textContent = '--';
      if (rfCell) rfCell.textContent = '--';
      if (rfHealthBadge) {
        rfHealthBadge.className = 'badge-status badge-neutral';
        rfHealthBadge.textContent = isAr ? 'بانتظار الإشارة' : 'Awaiting Telemetry';
      }
      if (routerPill) {
        routerPill.className = 'pill pill-unknown';
        if (routerPillLabel) routerPillLabel.textContent = isAr ? 'البوابة: قيد الاستماع' : 'Gateway: 192.168.* (Listening)';
      }
      return;
    }

    if (routerPill) {
      routerPill.className = 'pill pill-connected';
      if (routerPillLabel) routerPillLabel.textContent = isAr ? 'الموجه متصل (192.168.1.1)' : 'Gateway Connected (192.168.1.1)';
    }

    if (syncIndicator) {
      const d = new Date();
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      syncIndicator.textContent = `${isAr ? 'آخر مزامنة: ' : 'Last Sync: '}${timeStr}`;
    }

    if (rfRsrp) rfRsrp.textContent = m.rsrp !== null && m.rsrp !== undefined ? `${m.rsrp} dBm` : '--';
    if (rfSinr) rfSinr.textContent = m.sinr !== null && m.sinr !== undefined ? `${m.sinr} dB` : '--';
    if (rfRsrq) rfRsrq.textContent = m.rsrq !== null && m.rsrq !== undefined ? `${m.rsrq} dB` : '--';
    if (rfRssi) rfRssi.textContent = m.rssi !== null && m.rssi !== undefined ? `${m.rssi} dBm` : '--';

    let bandText = m.band || m.primaryBand || '--';
    if (Array.isArray(m.secondaryBands) && m.secondaryBands.length > 0) {
      bandText += ` + ${m.secondaryBands.join(' + ')}`;
    }
    if (rfBand) rfBand.textContent = bandText;

    const pciDisplay = (privacyMode && evaluator)
      ? evaluator.redactSensitiveData(m.pci, 'pci')
      : (m.pci !== null && m.pci !== undefined ? String(m.pci) : '--');
    const cellDisplay = (privacyMode && evaluator)
      ? evaluator.redactSensitiveData(m.cellId, 'cell_id')
      : (m.cellId || '--');

    if (rfPci) rfPci.textContent = pciDisplay;
    if (rfCell) rfCell.textContent = cellDisplay;

    if (rfHealthBadge && evaluator) {
      const health = evaluator.getOverallHealth(m.rsrp, m.sinr, m.rsrq);
      rfHealthBadge.textContent = health.status;
      rfHealthBadge.style.color = health.color;
      rfHealthBadge.style.borderColor = health.color;
    }
  }

  /* ==========================================================================
     SPEEDTEST RUNNER ORCHESTRATION
     ========================================================================= */
  function startSpeedtest() {
    if (activeRunner) {
      activeRunner.abort();
    }

    // Reset UI
    if (btnStart) btnStart.style.display = 'none';
    if (btnAbort) btnAbort.style.display = 'inline-flex';
    if (btnViewHistory) btnViewHistory.style.display = 'none';
    if (saveNotice) saveNotice.style.display = 'none';

    if (statPing) statPing.textContent = '--';
    if (statJitter) statJitter.textContent = '--';
    if (statDl) statDl.textContent = '--';
    if (statUl) statUl.textContent = '--';

    if (previewBbGrade) previewBbGrade.textContent = '--';
    if (previewCsiScore) previewCsiScore.textContent = '--';
    if (previewDlLoaded) previewDlLoaded.textContent = '--';

    const isAr = currentLang === 'ar';
    const i18n = window.NetPulseI18n;

    activeRunner = new window.NetPulseSpeedtestRunner({
      pingProbes: 10,
      downloadDurationMs: 8000,
      uploadDurationMs: 6000,
      downloadStreams: 4,
      uploadStreams: 3,
      onProgress: (evt) => handleTestProgress(evt),
      onComplete: (results) => handleTestComplete(results),
      onError: (err) => handleTestError(err)
    });

    activeRunner.run();
  }

  function abortSpeedtest() {
    if (activeRunner) {
      activeRunner.abort();
      activeRunner = null;
    }

    if (phaseBadge) phaseBadge.className = 'phase-badge phase-ready';
    if (phaseText) {
      phaseText.textContent = window.NetPulseI18n
        ? window.NetPulseI18n.t('test_state_aborted', currentLang)
        : 'Speedtest Aborted';
    }

    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnAbort) btnAbort.style.display = 'none';
  }

  function handleTestProgress(evt) {
    const { phase, progress, results } = evt;
    const isAr = currentLang === 'ar';
    const i18n = window.NetPulseI18n;

    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (phaseBadge) {
      phaseBadge.className = phase === 'completed' ? 'phase-badge phase-completed' : 'phase-badge phase-running';
    }

    let phaseKey = 'test_state_ready';
    if (phase === 'ping') phaseKey = 'test_state_ping';
    else if (phase === 'download') phaseKey = 'test_state_download';
    else if (phase === 'upload') phaseKey = 'test_state_upload';
    else if (phase === 'completed') phaseKey = 'test_state_completed';

    if (phaseText) {
      phaseText.textContent = i18n ? i18n.t(phaseKey, currentLang) : phase;
    }

    // Update numbers on cards
    if (results.pingMs > 0 && statPing) statPing.textContent = results.pingMs;
    if (results.jitterMs > 0 && statJitter) statJitter.textContent = results.jitterMs;
    if (results.downloadMbps > 0 && statDl) statDl.textContent = results.downloadMbps.toFixed(1);
    if (results.uploadMbps > 0 && statUl) statUl.textContent = results.uploadMbps.toFixed(1);

    // Update Big Main Dial
    if (phase === 'ping') {
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_idle_latency', currentLang) : 'PING / RTT';
      if (focusValue) focusValue.textContent = results.pingMs || '--';
      if (focusUnit) focusUnit.textContent = 'ms';
    } else if (phase === 'download') {
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_dl_throughput', currentLang) : 'DOWNLOAD SPEED';
      if (focusValue) focusValue.textContent = results.downloadMbps.toFixed(1);
      if (focusUnit) focusUnit.textContent = 'Mbps';
    } else if (phase === 'upload') {
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_ul_throughput', currentLang) : 'UPLOAD SPEED';
      if (focusValue) focusValue.textContent = results.uploadMbps.toFixed(1);
      if (focusUnit) focusUnit.textContent = 'Mbps';
    }
  }

  async function handleTestComplete(results) {
    activeRunner = null;
    const isAr = currentLang === 'ar';
    const i18n = window.NetPulseI18n;
    const evaluator = window.NetPulseEvaluator;

    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnAbort) btnAbort.style.display = 'none';
    if (btnViewHistory) btnViewHistory.style.display = 'inline-flex';
    if (saveNotice) saveNotice.style.display = 'flex';

    if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_dl_throughput', currentLang) : 'DOWNLOAD SPEED';
    if (focusValue) focusValue.textContent = results.downloadMbps.toFixed(1);
    if (focusUnit) focusUnit.textContent = 'Mbps';

    // Live calculations for Bufferbloat & CSI
    const bb = evaluator ? evaluator.evaluateBufferbloat(results) : null;
    if (bb && previewBbGrade) {
      previewBbGrade.textContent = `Grade ${bb.grade}`;
      previewBbGrade.style.color = bb.color;
      previewBbGrade.style.borderColor = bb.color;
    }

    if (evaluator && previewCsiScore) {
      const csi = evaluator.calculateCSI({
        ping: results.pingMs,
        jitter: results.jitterMs,
        packetLossPct: 0,
        worstDelta: bb ? bb.worstDelta : 0
      });
      previewCsiScore.textContent = `${csi.score}% (${csi.tier})`;
      previewCsiScore.style.color = csi.color;
    }

    if (results.downloadLoadedPing && previewDlLoaded) {
      previewDlLoaded.textContent = `${results.downloadLoadedPing} ms`;
    }

    // Auto-Save into chrome.storage.local netpulse_history
    try {
      const newEntry = {
        id: `netpulse_test_${Date.now()}`,
        timestamp: Date.now(),
        source: 'NetPulse Test',
        downloadMbps: results.downloadMbps,
        uploadMbps: results.uploadMbps,
        pingMs: results.pingMs,
        jitterMs: results.jitterMs,
        downloadLoadedPing: results.downloadLoadedPing,
        uploadLoadedPing: results.uploadLoadedPing,
        speedtest: {
          source: 'NetPulse Test',
          downloadMbps: results.downloadMbps,
          uploadMbps: results.uploadMbps,
          pingMs: results.pingMs,
          jitterMs: results.jitterMs,
          downloadLoadedPing: results.downloadLoadedPing,
          uploadLoadedPing: results.uploadLoadedPing
        },
        router: currentRouterData ? currentRouterData.metrics : null,
        pairedRouter: currentRouterData ? currentRouterData.metrics : null
      };

      const storageData = await chrome.storage.local.get(['netpulse_history']);
      const currentHistory = Array.isArray(storageData.netpulse_history) ? storageData.netpulse_history : [];
      currentHistory.unshift(newEntry);

      // Keep up to 500 records
      const trimmedHistory = currentHistory.slice(0, 500);
      await chrome.storage.local.set({ netpulse_history: trimmedHistory });

      const msg = isAr
        ? 'تم حفظ نتائج الفحص في السجل الزمني تحت اسم NetPulse Test.'
        : 'Speedtest result saved to Hourly History under "NetPulse Test".';
      showToast(msg);

    } catch (saveErr) {
      console.error('[NetPulse Speedtest] Error saving result:', saveErr);
    }
  }

  function handleTestError(err) {
    activeRunner = null;
    if (btnStart) btnStart.style.display = 'inline-flex';
    if (btnAbort) btnAbort.style.display = 'none';

    if (phaseBadge) phaseBadge.className = 'phase-badge phase-ready';
    if (phaseText) phaseText.textContent = currentLang === 'ar' ? 'حدث خطأ أثناء الفحص' : 'Error during measurement';

    showToast(currentLang === 'ar' ? 'فشل فحص السرعة. تأكد من اتصال الإنترنت.' : 'Speedtest failed. Verify internet connectivity.');
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
