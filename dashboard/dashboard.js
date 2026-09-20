/**
 * NetPulse - Full-Page Analytics Dashboard Controller
 * Real-time RF telemetry monitoring, Speedtest correlation, filtering, data export,
 * Internationalization (English/Arabic RTL), Dual Theme Engine, and Clear Data Modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const evaluator = window.NetPulseEvaluator;
  const i18n = window.NetPulseI18n;

  // Preferences & Local State
  let currentLang = 'en';
  let currentTheme = 'dark';
  let currentRouterData = null;
  let allHistory = [];
  let filteredHistory = [];

  // DOM Elements - Header & Toggles
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');
  const themeIconContainer = document.getElementById('theme-icon-container');

  // DOM Elements - Connection & Health
  const routerConnectionPill = document.getElementById('router-connection-pill');
  const routerConnectionLabel = document.getElementById('router-connection-label');
  const liveSyncIndicator = document.getElementById('live-sync-indicator');
  const overallRfBadge = document.getElementById('overall-rf-badge');

  // DOM Elements - Gauges
  const valRsrp = document.getElementById('val-rsrp');
  const badgeRsrp = document.getElementById('badge-rsrp');
  const barRsrp = document.getElementById('bar-rsrp');

  const valSinr = document.getElementById('val-sinr');
  const badgeSinr = document.getElementById('badge-sinr');
  const barSinr = document.getElementById('bar-sinr');

  const valRsrq = document.getElementById('val-rsrq');
  const badgeRsrq = document.getElementById('badge-rsrq');
  const barRsrq = document.getElementById('bar-rsrq');

  const valRssi = document.getElementById('val-rssi');
  const badgeRssi = document.getElementById('badge-rssi');
  const barRssi = document.getElementById('bar-rssi');

  // DOM Elements - Carrier Aggregation
  const caServingBand = document.getElementById('ca-serving-band');
  const caDlBw = document.getElementById('ca-dl-bw');
  const caUlBw = document.getElementById('ca-ul-bw');
  const caPci = document.getElementById('ca-pci');
  const caCellId = document.getElementById('ca-cell-id');
  const caComponentCount = document.getElementById('ca-component-count');
  const caTagsList = document.getElementById('ca-tags-list');
  const caModeBadge = document.getElementById('ca-mode-badge');

  // DOM Elements - Diagnostic Advice Engine
  const diagnosticText = document.getElementById('diagnostic-text');

  // DOM Elements - History Table & Filters
  const historyTbody = document.getElementById('history-tbody');
  const historyCountBadge = document.getElementById('history-count-badge');
  const inputSearch = document.getElementById('input-search');
  const selectSource = document.getElementById('select-source');
  const selectSort = document.getElementById('select-sort');

  // Action Buttons
  const btnScanRouter = document.getElementById('btn-scan-router');
  const btnScanRouterLabel = document.getElementById('btn-scan-router-label');
  const btnScanSpeedtest = document.getElementById('btn-scan-speedtest');
  const btnScanSpeedtestLabel = document.getElementById('btn-scan-speedtest-label');
  const btnRefresh = document.getElementById('btn-refresh-telemetry');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnOpenClearModal = document.getElementById('btn-open-clear-modal');

  // Clear Modal Elements
  const modalClearOverlay = document.getElementById('modal-clear-overlay');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // Network Portals Modal Elements
  const btnOpenPortals = document.getElementById('btn-open-portals');
  const modalPortalsOverlay = document.getElementById('modal-portals-overlay');
  const btnPortalsClose = document.getElementById('btn-portals-close');
  const btnPortalsCloseX = document.getElementById('btn-portals-close-x');
  const btnToggleCredPass = document.getElementById('btn-toggle-cred-pass');
  const credDisplayPass = document.getElementById('cred-display-pass');
  const credDisplayUser = document.getElementById('cred-display-user');
  let configuredRouterPass = 'SKdigital8008@';
  let isPassRevealed = false;

  // Toast Element
  const toastBanner = document.getElementById('toast-banner');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  /* ==========================================================================
     THEME ENGINE (Dark / Light with Zero Gradients)
     ========================================================================== */
  const SUN_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function applyTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'light') {
      themeIconContainer.innerHTML = MOON_SVG;
      themeLabelText.textContent = 'Dark';
    } else {
      themeIconContainer.innerHTML = SUN_SVG;
      themeLabelText.textContent = 'Light';
    }
  }

  btnThemeToggle.addEventListener('click', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    chrome.storage.local.set({ netpulse_theme: nextTheme });
  });

  /* ==========================================================================
     INTERNATIONALIZATION (English LTR / Arabic RTL)
     ========================================================================== */
  function applyLanguage(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';

    if (i18n) {
      i18n.applyLanguage(currentLang);
    }

    langToggleText.textContent = currentLang === 'ar' ? 'English' : 'العربية';

    // Refresh dynamically computed labels
    renderLiveTelemetry(currentRouterData);
    applyFiltersAndSort();
  }

  btnLangToggle.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(nextLang);
    chrome.storage.local.set({ netpulse_lang: nextLang });
  });

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(text) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = text;
    toastBanner.classList.add('active');
    toastTimer = setTimeout(() => {
      toastBanner.classList.remove('active');
    }, 4500);
  }

  /* ==========================================================================
     CLEAR ALL DATA CONFIRMATION MODAL WORKFLOW
     ========================================================================== */
  function openClearModal() {
    modalClearOverlay.classList.add('active');
    btnModalCancel.focus();
  }

  function closeClearModal() {
    modalClearOverlay.classList.remove('active');
  }

  btnOpenClearModal.addEventListener('click', openClearModal);
  btnModalCancel.addEventListener('click', closeClearModal);

  // Close modal when clicking directly on the backdrop overlay
  modalClearOverlay.addEventListener('click', (e) => {
    if (e.target === modalClearOverlay) {
      closeClearModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalClearOverlay.classList.contains('active')) {
      closeClearModal();
    }
  });

  /* ==========================================================================
     NETWORK PORTALS & QUICK LINKS MODAL WORKFLOW
     ========================================================================== */
  function openPortalsModal() {
    modalPortalsOverlay.classList.add('active');
    if (btnPortalsClose) btnPortalsClose.focus();
  }

  function closePortalsModal() {
    modalPortalsOverlay.classList.remove('active');
  }

  if (btnOpenPortals) {
    btnOpenPortals.addEventListener('click', openPortalsModal);
  }
  if (btnPortalsClose) {
    btnPortalsClose.addEventListener('click', closePortalsModal);
  }
  if (btnPortalsCloseX) {
    btnPortalsCloseX.addEventListener('click', closePortalsModal);
  }

  modalPortalsOverlay.addEventListener('click', (e) => {
    if (e.target === modalPortalsOverlay) {
      closePortalsModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalPortalsOverlay.classList.contains('active')) {
      closePortalsModal();
    }
  });

  // Password visibility toggle
  if (btnToggleCredPass && credDisplayPass) {
    btnToggleCredPass.addEventListener('click', () => {
      isPassRevealed = !isPassRevealed;
      credDisplayPass.textContent = isPassRevealed ? configuredRouterPass : '•••••••••••••';
    });
  }

  // Copy credentials to clipboard handlers
  document.querySelectorAll('.btn-copy-cred[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast(i18n ? i18n.t('copied_to_clipboard', currentLang) : 'Copied to clipboard');
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    });
  });

  // Confirm delete handler
  btnModalConfirm.addEventListener('click', async () => {
    closeClearModal();

    // Preserve user theme & language preferences
    const emptyRouterLatest = {
      timestamp: Date.now(),
      status: 'waiting',
      source: 'unconnected',
      metrics: null
    };

    await chrome.storage.local.set({
      netpulse_history: [],
      netpulse_router_latest: emptyRouterLatest
    });

    allHistory = [];
    currentRouterData = emptyRouterLatest;

    renderLiveTelemetry(null);
    applyFiltersAndSort();

    const wipedMsg = i18n ? i18n.t('toast_data_cleared', currentLang) : 'All historical telemetry and speedtest records have been permanently cleared.';
    showToast(wipedMsg);
  });

  /* ==========================================================================
     TELEMETRY & GAUGES
     ========================================================================== */
  function calcPercent(val, min, max) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    const clamped = Math.max(min, Math.min(max, Number(val)));
    return Math.round(((clamped - min) / (max - min)) * 100);
  }

  function formatTimestamp(ts) {
    if (!ts) return '--';
    const d = new Date(ts);
    return `${d.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
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

  function updateGauge(type, value, valElem, badgeElem, barElem, min, max) {
    if (value === null || value === undefined || isNaN(value)) {
      valElem.textContent = '--';
      badgeElem.textContent = '--';
      badgeElem.className = 'tier-pill';
      barElem.style.width = '0%';
      return;
    }

    valElem.textContent = value;
    const percent = calcPercent(value, min, max);
    barElem.style.width = `${percent}%`;

    if (evaluator) {
      const res = evaluator.evaluateMetric(type, value);
      badgeElem.textContent = getTranslatedTier(res.grade);
      badgeElem.className = 'tier-pill';
      barElem.style.backgroundColor = res.color;

      const g = (res.grade || '').toLowerCase();
      if (g === 'excellent' || g === 'clean' || g === 'strong') {
        badgeElem.classList.add('tier-excellent');
      } else if (g === 'good') {
        badgeElem.classList.add('tier-good');
      } else if (g === 'fair' || g === 'congested') {
        badgeElem.classList.add('tier-fair');
      } else if (g === 'poor' || g === 'heavy load' || g === 'weak') {
        badgeElem.classList.add('tier-poor');
      }
    }
  }

  function renderLiveTelemetry(data) {
    currentRouterData = data;

    if (!data || !data.metrics || (data.metrics.rsrp === null && data.metrics.rssi === null)) {
      routerConnectionPill.className = 'pill pill-unknown';
      routerConnectionLabel.textContent = i18n ? i18n.t('gateway_listening', currentLang) : 'Gateway: 192.168.* (Listening)';
      liveSyncIndicator.textContent = i18n ? i18n.t('last_sync_never', currentLang) : 'Last Sync: Never';

      overallRfBadge.className = 'badge-health badge-health-unknown';
      overallRfBadge.textContent = i18n ? i18n.t('awaiting_signal', currentLang) : 'Awaiting Signal';

      updateGauge('rsrp', null, valRsrp, badgeRsrp, barRsrp, -120, -60);
      updateGauge('sinr', null, valSinr, badgeSinr, barSinr, -5, 30);
      updateGauge('rsrq', null, valRsrq, badgeRsrq, barRsrq, -20, -3);
      updateGauge('rssi', null, valRssi, badgeRssi, barRssi, -100, -50);

      caServingBand.textContent = '--';
      caDlBw.textContent = '--';
      caUlBw.textContent = '--';
      caPci.textContent = '--';
      caCellId.textContent = '--';
      caComponentCount.textContent = '--';
      caTagsList.innerHTML = `<span class="tag-empty mono">${i18n ? i18n.t('ca_no_secondary', currentLang) : 'No secondary carriers currently aggregated'}</span>`;
      diagnosticText.textContent = i18n ? i18n.t('diagnostic_awaiting', currentLang) : 'Awaiting cellular telemetry snapshot from router interface (e.g. 192.168.*). Click "Scan Router Tab" or "Open Router GUI" to capture live metrics.';
      return;
    }

    const m = data.metrics;

    // Record sample in rolling RF timeline for Deep Analysis Studio
    if (m && (m.rsrp !== null || m.rssi !== null)) {
      chrome.storage.local.get(['netpulse_rf_timeline'], (res) => {
        let timeline = res.netpulse_rf_timeline || [];
        const last = timeline[timeline.length - 1];
        if (!last || (Date.now() - (last.timestamp || 0) > 3000) || last.router.rsrp !== m.rsrp) {
          timeline.push({
            timestamp: data.timestamp || Date.now(),
            router: m
          });
          if (timeline.length > 100) timeline.shift();
          chrome.storage.local.set({ netpulse_rf_timeline: timeline });
        }
      });
    }

    // Header & Status
    routerConnectionPill.className = 'pill pill-connected';
    routerConnectionLabel.textContent = i18n ? i18n.t('gateway_connected', currentLang, { source: data.source || 'Router' }) : `Connected (${data.source || 'Router'})`;
    liveSyncIndicator.textContent = i18n ? i18n.t('last_sync', currentLang, { time: new Date(data.timestamp).toLocaleTimeString([], { hour12: false }) }) : `Last Sync: ${new Date(data.timestamp).toLocaleTimeString([], { hour12: false })}`;

    // Health
    const health = evaluator ? evaluator.getOverallHealth(m.rsrp, m.sinr, m.rsrq) : { status: 'Optimal RF', badgeClass: 'badge-health-optimal' };
    overallRfBadge.className = `badge-health ${health.badgeClass.replace('status-', 'badge-health-')}`;

    let healthStatusText = health.status;
    if (i18n) {
      if (health.status === 'Optimal RF') healthStatusText = i18n.t('status_optimal', currentLang);
      else if (health.status === 'Good Connection') healthStatusText = i18n.t('status_good', currentLang);
      else if (health.status === 'Sector Congestion') healthStatusText = i18n.t('status_warning_congestion', currentLang);
      else if (health.status === 'RF Interference') healthStatusText = i18n.t('status_warning_interference', currentLang);
      else if (health.status.includes('Critical') || health.status.includes('Loss')) healthStatusText = i18n.t('status_critical', currentLang);
      else healthStatusText = i18n.t('status_fair', currentLang);
    }
    overallRfBadge.textContent = healthStatusText;

    // 4 Gauges
    updateGauge('rsrp', m.rsrp, valRsrp, badgeRsrp, barRsrp, -120, -60);
    updateGauge('sinr', m.sinr, valSinr, badgeSinr, barSinr, -5, 30);
    updateGauge('rsrq', m.rsrq, valRsrq, badgeRsrq, barRsrq, -20, -3);
    updateGauge('rssi', m.rssi, valRssi, badgeRssi, barRssi, -100, -50);

    // Carrier Aggregation Details
    caServingBand.textContent = m.band || 'N/A';
    caDlBw.textContent = m.dlBandwidth || '20 MHz';
    caUlBw.textContent = m.ulBandwidth || '20 MHz';
    caPci.textContent = m.pci !== null && m.pci !== undefined ? m.pci : 'N/A';
    caCellId.textContent = m.cellId || 'N/A';

    caModeBadge.textContent = m.networkType || (m.band && m.band.startsWith('n') ? '5G SA / NSA' : 'LTE-A Pro');

    const caList = m.caBands || [];
    if (caList.length > 0) {
      caComponentCount.textContent = i18n ? i18n.t('ca_multi_carrier', currentLang, { count: caList.length }) : `${caList.length}x Carrier Aggregation`;
      caTagsList.innerHTML = caList.map((b, idx) => {
        const isPrimary = idx === 0 || b === m.band;
        const prefix = isPrimary ? (currentLang === 'ar' ? 'الأساسي: ' : 'Primary: ') : `SCC${idx}: `;
        return `<span class="ca-tag ${isPrimary ? 'primary' : ''} mono">${prefix}${b}</span>`;
      }).join('');
    } else {
      caComponentCount.textContent = i18n ? i18n.t('ca_single_carrier', currentLang) : '1x Component Carrier';
      const prefix = currentLang === 'ar' ? 'الأساسي: ' : 'Primary: ';
      caTagsList.innerHTML = `<span class="ca-tag primary mono">${prefix}${m.band || 'Unknown'}</span>`;
    }

    // Diagnostic Advice Engine
    if (evaluator) {
      diagnosticText.textContent = evaluator.generateDiagnosticAdvice(m);
    }
  }

  /* ==========================================================================
     TABLE FILTERING & SORTING
     ========================================================================== */
  function applyFiltersAndSort() {
    const query = (inputSearch.value || '').trim().toLowerCase();
    const sourceFilter = selectSource.value;
    const sortVal = selectSort.value;

    filteredHistory = allHistory.filter((item) => {
      if (sourceFilter !== 'ALL') {
        const s = (item.source || '').toLowerCase();
        if (sourceFilter === 'Speedtest.net' && !s.includes('speedtest')) return false;
        if (sourceFilter === 'Fast.com' && !s.includes('fast')) return false;
        if (sourceFilter === 'Simulated' && !s.includes('simulated')) return false;
      }

      if (query) {
        const st = item.speedtest || {};
        const r = item.router || {};
        const searchStr = [
          item.source,
          st.isp,
          st.server,
          r.band,
          r.cellId,
          item.correlationAnalysis
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchStr.includes(query)) return false;
      }

      return true;
    });

    // Sorting
    filteredHistory.sort((a, b) => {
      const aDl = a.speedtest && a.speedtest.downloadMbps !== undefined ? Number(a.speedtest.downloadMbps) : 0;
      const bDl = b.speedtest && b.speedtest.downloadMbps !== undefined ? Number(b.speedtest.downloadMbps) : 0;
      const aPing = a.speedtest && a.speedtest.pingMs !== undefined ? Number(a.speedtest.pingMs) : 999;
      const bPing = b.speedtest && b.speedtest.pingMs !== undefined ? Number(b.speedtest.pingMs) : 999;
      const aRsrp = a.router && a.router.rsrp !== null && a.router.rsrp !== undefined ? Number(a.router.rsrp) : -999;
      const bRsrp = b.router && b.router.rsrp !== null && b.router.rsrp !== undefined ? Number(b.router.rsrp) : -999;

      switch (sortVal) {
        case 'timestamp_asc':
          return (a.timestamp || 0) - (b.timestamp || 0);
        case 'download_desc':
          return bDl - aDl;
        case 'download_asc':
          return aDl - bDl;
        case 'ping_asc':
          return aPing - bPing;
        case 'rsrp_desc':
          return bRsrp - aRsrp;
        case 'timestamp_desc':
        default:
          return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });

    renderTable();
  }

  function renderTable() {
    historyCountBadge.textContent = i18n
      ? i18n.t('records_count', currentLang, { filtered: filteredHistory.length, total: allHistory.length })
      : `${filteredHistory.length} of ${allHistory.length} records`;

    if (filteredHistory.length === 0) {
      const emptyTitle = allHistory.length === 0
        ? (i18n ? i18n.t('empty_history_title', currentLang) : 'No network speedtest or RF correlation records recorded yet.')
        : (i18n ? i18n.t('empty_search_title', currentLang) : 'No matching records found for the current search filter.');

      const emptySub = allHistory.length === 0
        ? (i18n ? i18n.t('empty_history_sub', currentLang) : 'Run a test on Speedtest.net or Fast.com, or click "Capture Speedtest Tab" above.')
        : (i18n ? i18n.t('empty_search_sub', currentLang) : 'Try adjusting search keywords or resetting source filter.');

      historyTbody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">
            <div class="empty-state-inner">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#64748b" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p class="empty-text">${emptyTitle}</p>
              <span class="empty-sub">${emptySub}</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = filteredHistory.map((item) => {
      const st = item.speedtest || {};
      const r = item.router || {};

      let sourceTagClass = 'table-source-tag';
      if ((item.source || '').includes('Speedtest')) sourceTagClass += ' source-speedtest';
      else if ((item.source || '').includes('Fast')) sourceTagClass += ' source-fast';
      else sourceTagClass += ' source-simulated';

      const rsrpVal = r.rsrp !== null && r.rsrp !== undefined ? r.rsrp : '--';
      let rsrpColor = '#9ca3af';
      if (r.rsrp !== null && r.rsrp !== undefined && evaluator) {
        rsrpColor = evaluator.evaluateMetric('rsrp', r.rsrp).color;
      }

      const sinrVal = r.sinr !== null && r.sinr !== undefined ? r.sinr : '--';
      let sinrColor = '#9ca3af';
      if (r.sinr !== null && r.sinr !== undefined && evaluator) {
        sinrColor = evaluator.evaluateMetric('sinr', r.sinr).color;
      }

      return `
        <tr>
          <td class="mono" style="color: var(--text-muted); font-size: 11px;">${formatTimestamp(item.timestamp)}</td>
          <td><span class="${sourceTagClass}">${item.source || 'Speedtest'}</span></td>
          <td class="text-right mono speed-val-bold text-emerald">${st.downloadMbps !== undefined ? st.downloadMbps.toFixed(1) : '--'}</td>
          <td class="text-right mono speed-val-bold text-blue">${st.uploadMbps !== undefined ? st.uploadMbps.toFixed(1) : '--'}</td>
          <td class="text-right mono">${st.pingMs !== undefined ? st.pingMs : '--'}</td>
          <td class="text-right mono" style="color: var(--text-muted);">${st.jitterMs !== undefined ? st.jitterMs : '--'}</td>
          <td class="text-right mono" style="font-weight: 700; color: ${rsrpColor};">${rsrpVal} ${rsrpVal !== '--' ? 'dBm' : ''}</td>
          <td class="text-right mono" style="font-weight: 700; color: ${sinrColor};">${sinrVal} ${sinrVal !== '--' ? 'dB' : ''}</td>
          <td class="mono" style="font-weight: 600; color: var(--text-primary);">${r.band || (currentLang === 'ar' ? 'خلوي' : 'Cellular')}</td>
          <td class="correlation-text">${item.correlationAnalysis || (currentLang === 'ar' ? 'تم قفل الإشارة اللاسلكية بنجاح.' : 'RF telemetry paired.')}</td>
        </tr>
      `;
    }).join('');

    historyTbody.innerHTML = rows;
  }

  /* ==========================================================================
     LOAD DATA FROM STORAGE
     ========================================================================== */
  function loadStorageData() {
    chrome.storage.local.get([
      'netpulse_router_latest',
      'netpulse_history',
      'netpulse_theme',
      'netpulse_lang',
      'netpulse_router_creds'
    ], (res) => {
      // Preferences
      if (res.netpulse_theme) {
        applyTheme(res.netpulse_theme);
      }
      if (res.netpulse_lang) {
        applyLanguage(res.netpulse_lang);
      }

      // Router Credentials
      if (res.netpulse_router_creds) {
        if (res.netpulse_router_creds.pass) {
          configuredRouterPass = res.netpulse_router_creds.pass;
          if (isPassRevealed && credDisplayPass) credDisplayPass.textContent = configuredRouterPass;
        }
        if (res.netpulse_router_creds.user && credDisplayUser) {
          credDisplayUser.textContent = res.netpulse_router_creds.user;
        }
      }

      renderLiveTelemetry(res.netpulse_router_latest || null);
      allHistory = res.netpulse_history || [];
      applyFiltersAndSort();
    });
  }

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
      renderLiveTelemetry(changes.netpulse_router_latest.newValue);
    }
    if (changes.netpulse_history) {
      allHistory = changes.netpulse_history.newValue || [];
      applyFiltersAndSort();
    }
  });

  // Filter & Search Event Listeners
  inputSearch.addEventListener('input', applyFiltersAndSort);
  selectSource.addEventListener('change', applyFiltersAndSort);
  selectSort.addEventListener('change', applyFiltersAndSort);

  btnRefresh.addEventListener('click', () => {
    loadStorageData();
  });

  /* ==========================================================================
     MANUAL SCAN OF OPEN ROUTER TABS
     ========================================================================== */
  btnScanRouter.addEventListener('click', async () => {
    btnScanRouterLabel.textContent = i18n ? i18n.t('searching_tabs', currentLang) : 'Searching Tabs...';

    try {
      const tabs = await chrome.tabs.query({});
      const routerTabs = tabs.filter((t) => {
        if (!t.url) return false;
        try {
          const u = new URL(t.url);
          return u.hostname.startsWith('192.168.') || u.hostname.includes('router') || u.hostname === '10.0.0.1';
        } catch (e) {
          return false;
        }
      });

      if (routerTabs.length === 0) {
        alert(currentLang === 'ar'
          ? 'لم يتم العثور على أي علامة تبويب مفتوحة للموجه (192.168.*). يرجى فتح واجهة الموجه في المتصفح والمحاولة مرة أخرى.'
          : 'No open router tabs found (matching 192.168.*). Please open your router GUI in a tab and try again.'
        );
        btnScanRouterLabel.textContent = i18n ? i18n.t('scan_router_tab', currentLang) : 'Scan Router Tab';
        return;
      }

      btnScanRouterLabel.textContent = currentLang === 'ar' ? `جاري فحص ${routerTabs.length} علامة...` : `Scanning ${routerTabs.length} tab(s)...`;
      let foundData = null;

      for (const tab of routerTabs) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['shared/evaluator.js', 'scripts/router_scraper.js']
          });

          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
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

          if (results && Array.isArray(results)) {
            for (const r of results) {
              if (r.result && r.result.metrics && (r.result.metrics.rsrp !== null || r.result.metrics.rsrq !== null)) {
                foundData = r.result;
                break;
              }
            }
          }

          if (foundData) break;
        } catch (err) {
          console.warn('Could not scan tab', tab.id, err);
        }
      }

      if (foundData) {
        renderLiveTelemetry(foundData);
        alert(currentLang === 'ar'
          ? `تم فحص بيانات الموجه بنجاح من ${foundData.routerUrl || 'البوابة'}!\nRSRP: ${foundData.metrics.rsrp} dBm | RSRQ: ${foundData.metrics.rsrq} dB`
          : `Successfully scanned router telemetry from ${foundData.routerUrl || 'gateway'}!\nRSRP: ${foundData.metrics.rsrp} dBm | RSRQ: ${foundData.metrics.rsrq} dB`
        );
      } else {
        alert(currentLang === 'ar'
          ? 'تم مسح علامات الموجه المفتوحة، ولكن لم يتم العثور على أرقام التردد اللاسلكي. يرجى التأكد من الدخول لصفحة Cellular Info / معلومات الخلية.'
          : 'Scanned open router tab(s), but no cellular metrics were visible on the active page. Please ensure you are on the Cellular Info / Status page.'
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      alert(`Scan failed: ${err.message}`);
    } finally {
      btnScanRouterLabel.textContent = i18n ? i18n.t('scan_router_tab', currentLang) : 'Scan Router Tab';
    }
  });

  /* ==========================================================================
     MANUAL CAPTURE OF SPEEDTEST TAB
     ========================================================================== */
  btnScanSpeedtest.addEventListener('click', async () => {
    btnScanSpeedtestLabel.textContent = i18n ? i18n.t('locating_test', currentLang) : 'Locating Test...';

    try {
      const tabs = await chrome.tabs.query({});
      const testTabs = tabs.filter((t) => {
        if (!t.url) return false;
        return t.url.includes('speedtest.net') || t.url.includes('fast.com');
      });

      if (testTabs.length === 0) {
        alert(currentLang === 'ar'
          ? 'لم يتم العثور على علامة تبويب مفتوحة لـ Speedtest.net أو Fast.com. يرجى فتح إحداهما وإجراء اختبار.'
          : 'No open Speedtest.net or Fast.com tabs detected. Please run a test in a tab and click this button to capture it.'
        );
        btnScanSpeedtestLabel.textContent = i18n ? i18n.t('capture_speedtest_tab', currentLang) : 'Capture Speedtest Tab';
        return;
      }

      btnScanSpeedtestLabel.textContent = currentLang === 'ar' ? `جاري فحص ${testTabs.length} علامة...` : `Reading ${testTabs.length} test tab(s)...`;
      let captured = null;

      for (const tab of testTabs) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['shared/evaluator.js', 'scripts/speedtest_scraper.js']
          });

          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
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

          if (results && results[0] && results[0].result) {
            captured = results[0].result;
            break;
          }
        } catch (e) {
          console.warn('Error reading test tab', tab.id, e);
        }
      }

      chrome.storage.local.get(['netpulse_history'], (res) => {
        allHistory = res.netpulse_history || [];
        applyFiltersAndSort();

        if (captured && captured.downloadMbps > 0) {
          alert(currentLang === 'ar'
            ? `تم التقاط نتيجة الاختبار بنجاح!\nالمصدر: ${captured.source}\nالتنزيل: ${captured.downloadMbps} Mbps\nالرفع: ${captured.uploadMbps || '--'} Mbps\nالاستجابة: ${captured.pingMs || '--'} ms`
            : `Successfully captured test results!\nSource: ${captured.source}\nDownload: ${captured.downloadMbps} Mbps\nUpload: ${captured.uploadMbps || '--'} Mbps\nPing: ${captured.pingMs || '--'} ms`
          );
        } else if (allHistory.length > 0 && allHistory[0].speedtest && allHistory[0].speedtest.downloadMbps > 0) {
          const st = allHistory[0].speedtest;
          alert(currentLang === 'ar'
            ? `تم تسجيل الاختبار!\nالمصدر: ${allHistory[0].source}\nالتنزيل: ${st.downloadMbps} Mbps\nالرفع: ${st.uploadMbps || '--'} Mbps\nالاستجابة: ${st.pingMs || '--'} ms`
            : `Test captured!\nSource: ${allHistory[0].source}\nDownload: ${st.downloadMbps} Mbps\nUpload: ${st.uploadMbps || '--'} Mbps\nPing: ${st.pingMs || '--'} ms`
          );
        } else {
          alert(currentLang === 'ar'
            ? 'تم العثور على علامة اختبار، ولكن لم تنتهِ نتائج القياس بعد. يرجى الانتظار حتى اكتمال الاختبار.'
            : 'Found an open test tab, but speed numbers were not finalized yet. Please let the test complete and try again.'
          );
        }
      });
    } catch (err) {
      console.error('Speedtest capture error:', err);
      alert(`Capture failed: ${err.message}`);
    } finally {
      btnScanSpeedtestLabel.textContent = i18n ? i18n.t('capture_speedtest_tab', currentLang) : 'Capture Speedtest Tab';
    }
  });

  /* ==========================================================================
     EXPORT ACTIONS (CSV / JSON)
     ========================================================================== */
  btnExportCsv.addEventListener('click', () => {
    if (allHistory.length === 0) {
      alert(currentLang === 'ar' ? 'لا توجد سجلات لتصديرها.' : 'No history records to export.');
      return;
    }

    const headers = [
      'Timestamp_ISO',
      'Source',
      'Download_Mbps',
      'Upload_Mbps',
      'Ping_ms',
      'Jitter_ms',
      'RSRP_dBm',
      'SINR_dB',
      'RSRQ_dB',
      'RSSI_dBm',
      'Serving_Band',
      'PCI',
      'Cell_ID',
      'DL_Bandwidth',
      'CA_Bands',
      'Correlation_Conclusion'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = allHistory.map((item) => {
      const st = item.speedtest || {};
      const r = item.router || {};
      const caBandsStr = r.caBands ? r.caBands.join(';') : '';

      return [
        escapeCsv(item.dateIso || new Date(item.timestamp).toISOString()),
        escapeCsv(item.source),
        st.downloadMbps !== undefined ? st.downloadMbps : '',
        st.uploadMbps !== undefined ? st.uploadMbps : '',
        st.pingMs !== undefined ? st.pingMs : '',
        st.jitterMs !== undefined ? st.jitterMs : '',
        r.rsrp !== null && r.rsrp !== undefined ? r.rsrp : '',
        r.sinr !== null && r.sinr !== undefined ? r.sinr : '',
        r.rsrq !== null && r.rsrq !== undefined ? r.rsrq : '',
        r.rssi !== null && r.rssi !== undefined ? r.rssi : '',
        escapeCsv(r.band || ''),
        r.pci !== null && r.pci !== undefined ? r.pci : '',
        escapeCsv(r.cellId || ''),
        escapeCsv(r.dlBandwidth || ''),
        escapeCsv(caBandsStr),
        escapeCsv(item.correlationAnalysis || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `netpulse_telemetry_history_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnExportJson.addEventListener('click', () => {
    if (allHistory.length === 0) {
      alert(currentLang === 'ar' ? 'لا توجد سجلات لتصديرها.' : 'No history records to export.');
      return;
    }

    const jsonString = JSON.stringify(allHistory, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `netpulse_telemetry_history_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Runtime listener to respond to Deep Analysis Studio sync requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REQUEST_DASHBOARD_SYNC') {
      sendResponse({
        status: 'ok',
        router: currentRouterData,
        history: allHistory
      });
      return true;
    }
  });

  // Initial Load
  loadStorageData();
});
