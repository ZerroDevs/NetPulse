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
  let privacyMode = false;
  let currentRouterData = null;
  let allHistory = [];
  let filteredHistory = [];

  // DOM Elements - Header & Toggles
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');
  const themeIconContainer = document.getElementById('theme-icon-container');
  const btnPrivacyToggle = document.getElementById('btn-privacy-toggle');
  const privacyToggleText = document.getElementById('privacy-toggle-text');

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

  // DOM Elements - Spectral Efficiency (Feature 2)
  const badgeEfficiencyStatus = document.getElementById('badge-efficiency-status');
  const badgeEfficiencyText = document.getElementById('badge-efficiency-text');
  const dashTheoPeakDl = document.getElementById('dash-theo-peak-dl');
  const dashLinkEffPct = document.getElementById('dash-link-eff-pct');
  const dashLinkEffSub = document.getElementById('dash-link-eff-sub');
  const dashEffBw = document.getElementById('dash-eff-bw');
  const dashEffBps = document.getElementById('dash-eff-bps');
  const dashEffMeterLabel = document.getElementById('dash-eff-meter-label');
  const dashEffMeterFill = document.getElementById('dash-eff-meter-fill');

  // DOM Elements - Bufferbloat Engine & Household Headroom (Feature 1 & 5)
  const badgeBufferbloatGrade = document.getElementById('badge-bufferbloat-grade');
  const bbIdleVal = document.getElementById('bb-idle-val');
  const bbDlVal = document.getElementById('bb-dl-val');
  const bbDlDelta = document.getElementById('bb-dl-delta');
  const bbUlVal = document.getElementById('bb-ul-val');
  const bbUlDelta = document.getElementById('bb-ul-delta');
  const bbWorstDeltaVal = document.getElementById('bb-worst-delta-val');
  const bbIndicatorLine = document.getElementById('bb-indicator-line');
  const bbDiagnosisText = document.getElementById('bb-diagnosis-text');

  const badgeHeadroomTier = document.getElementById('badge-headroom-tier');
  const headroom4kVal = document.getElementById('headroom-4k-val');
  const headroomCallsVal = document.getElementById('headroom-calls-val');
  const headroomGamingVal = document.getElementById('headroom-gaming-val');
  const headroomIndicatorLine = document.getElementById('headroom-indicator-line');
  const headroomVerdictText = document.getElementById('headroom-verdict-text');

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
  const btnExportPngCard = document.getElementById('btn-export-png-card');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnOpenClearModal = document.getElementById('btn-open-clear-modal');

  // Clear Modal Elements
  const modalClearOverlay = document.getElementById('modal-clear-overlay');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // Delete Entry Modal
  const modalDeleteEntryOverlay = document.getElementById('modal-delete-entry-overlay');
  const deleteEntryModalBody = document.getElementById('delete-entry-modal-body');
  const btnDeleteEntryCancel = document.getElementById('btn-delete-entry-cancel');
  const btnDeleteEntryConfirm = document.getElementById('btn-delete-entry-confirm');
  let pendingDeleteEntryId = null;

  // Merge Modal
  const modalMergeOverlay = document.getElementById('modal-merge-overlay');
  const mergeModalBody = document.getElementById('merge-modal-body');
  const btnMergeCancel = document.getElementById('btn-merge-cancel');
  const btnMergeConfirm = document.getElementById('btn-merge-confirm');

  // Merge Action Bar
  const mergeActionBar = document.getElementById('merge-action-bar');
  const mergeSelectionCount = document.getElementById('merge-selection-count');
  const btnMergeSelected = document.getElementById('btn-merge-selected');
  const btnCancelMerge = document.getElementById('btn-cancel-merge');
  const checkAllRows = document.getElementById('check-all-rows');

  // Track selected row IDs for merge
  let selectedRowIds = new Set();

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

  /**
   * Update Privacy Toggle Button UI
   */
  function updatePrivacyUi() {
    if (btnPrivacyToggle && privacyToggleText) {
      if (privacyMode) {
        btnPrivacyToggle.classList.add('privacy-active');
        privacyToggleText.textContent = i18n ? i18n.t('privacy_mode_on', currentLang) : 'Privacy: ON';
      } else {
        btnPrivacyToggle.classList.remove('privacy-active');
        privacyToggleText.textContent = i18n ? i18n.t('privacy_mode_off', currentLang) : 'Privacy: OFF';
      }
    }
  }

  if (btnPrivacyToggle) {
    btnPrivacyToggle.addEventListener('click', async () => {
      privacyMode = !privacyMode;
      await chrome.storage.local.set({ netpulse_privacy_mode: privacyMode });
      updatePrivacyUi();
      renderLiveTelemetry(currentRouterData);
      renderTable();
      showToast(privacyMode
        ? (i18n ? i18n.t('toast_privacy_enabled', currentLang) : 'Privacy Mode Enabled.')
        : (i18n ? i18n.t('toast_privacy_disabled', currentLang) : 'Privacy Mode Disabled.'));
    });
  }

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
    if (typeof drawGamingSparkline === 'function') {
      drawGamingSparkline();
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
    if (typeof updateGamingHudUi === 'function') {
      updateGamingHudUi();
    }
    if (typeof drawGamingSparkline === 'function') {
      drawGamingSparkline();
    }
  }

  btnLangToggle.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(nextLang);
    chrome.storage.local.set({ netpulse_lang: nextLang });
  });

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  const toastIconContainer = toastBanner ? toastBanner.querySelector('svg') : null;

  function showToast(text, type = 'info') {
    if (!toastBanner || !toastMessage) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = text;

    // Reset modifier classes
    toastBanner.classList.remove('warning', 'error', 'success', 'info');
    toastBanner.classList.add(type);

    // Update icon to matching vector SVG
    if (toastIconContainer) {
      if (type === 'warning') {
        toastIconContainer.setAttribute('stroke', '#f59e0b');
        toastIconContainer.innerHTML = '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      } else if (type === 'error') {
        toastIconContainer.setAttribute('stroke', '#f43f5e');
        toastIconContainer.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
      } else if (type === 'success') {
        toastIconContainer.setAttribute('stroke', '#10b981');
        toastIconContainer.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      } else {
        toastIconContainer.setAttribute('stroke', '#6366f1');
        toastIconContainer.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>';
      }
    }

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

  /**
   * Render Link Spectral Efficiency & Theoretical Capacity (Feature 2)
   */
  function renderSpectralEfficiency() {
    const latestSpeedtest = allHistory.length > 0 && allHistory[0].speedtest
      ? allHistory[0].speedtest
      : null;

    const eff = evaluator
      ? evaluator.computeSpectralEfficiency(currentRouterData ? currentRouterData.metrics : null, latestSpeedtest)
      : {
          totalDlBw: 20,
          bpsPerHz: 7.8,
          theoreticalPeakMbps: 156,
          latestDlMbps: null,
          efficiencyPercent: null,
          tierKey: 'efficiency_unknown',
          tierGrade: 'Awaiting Speedtest',
          tierColor: '#9ca3af'
        };

    if (badgeEfficiencyStatus && badgeEfficiencyText) {
      if (eff.efficiencyPercent !== null) {
        if (eff.efficiencyPercent >= 70) {
          badgeEfficiencyStatus.className = 'status-badge badge-emerald';
        } else if (eff.efficiencyPercent >= 40) {
          badgeEfficiencyStatus.className = 'status-badge badge-blue';
        } else if (eff.efficiencyPercent >= 20) {
          badgeEfficiencyStatus.className = 'status-badge badge-amber';
        } else {
          badgeEfficiencyStatus.className = 'status-badge badge-rose';
        }
        badgeEfficiencyText.textContent = i18n ? i18n.t(eff.tierKey, currentLang) : eff.tierGrade;
      } else if (currentRouterData && currentRouterData.metrics) {
        badgeEfficiencyStatus.className = 'status-badge badge-indigo';
        badgeEfficiencyText.textContent = currentLang === 'ar' ? 'حساب فيزيائي جاهز' : 'Modulation Ready';
      } else {
        badgeEfficiencyStatus.className = 'status-badge badge-muted';
        badgeEfficiencyText.textContent = currentLang === 'ar' ? 'بانتظار الإشارة' : 'Awaiting Telemetry';
      }
    }

    if (dashTheoPeakDl) dashTheoPeakDl.textContent = `${eff.theoreticalPeakMbps} Mbps`;
    if (dashLinkEffPct) {
      dashLinkEffPct.textContent = eff.efficiencyPercent !== null ? `${eff.efficiencyPercent}%` : '--';
      dashLinkEffPct.style.color = eff.efficiencyPercent !== null ? eff.tierColor : '#9ca3af';
    }
    if (dashLinkEffSub) {
      if (eff.efficiencyPercent !== null && eff.latestDlMbps !== null) {
        dashLinkEffSub.textContent = currentLang === 'ar'
          ? `${eff.latestDlMbps.toFixed(1)} من ${eff.theoreticalPeakMbps} ميجابت في الثانية`
          : `${eff.latestDlMbps.toFixed(1)} of ${eff.theoreticalPeakMbps} Mbps Peak`;
      } else {
        dashLinkEffSub.textContent = currentLang === 'ar' ? 'بانتظار نتيجة اختبار السرعة' : 'Awaiting speedtest benchmark';
      }
    }
    if (dashEffBw) dashEffBw.textContent = `${eff.totalDlBw} MHz`;
    if (dashEffBps) {
      const qamLabel = eff.bpsPerHz >= 7.5 ? '256-QAM' : (eff.bpsPerHz >= 5.5 ? '64-QAM' : '16-QAM');
      dashEffBps.textContent = `${eff.bpsPerHz} bps/Hz (${qamLabel})`;
    }
    if (dashEffMeterLabel) dashEffMeterLabel.textContent = eff.efficiencyPercent !== null ? `${eff.efficiencyPercent}%` : '--%';
    if (dashEffMeterFill) {
      dashEffMeterFill.style.width = `${eff.efficiencyPercent !== null ? eff.efficiencyPercent : 0}%`;
      dashEffMeterFill.style.background = eff.tierColor;
    }
  }

  let latestBufferbloatData = null;

  /**
   * Render Bufferbloat & Household Concurrency Headroom (Feature 1 & 5)
   */
  function renderBufferbloatAndHeadroom() {
    const latestSpeedtest = allHistory.length > 0 && allHistory[0].speedtest
      ? allHistory[0].speedtest
      : null;

    const bb = evaluator
      ? evaluator.evaluateBufferbloat(latestSpeedtest)
      : {
          grade: 'A+',
          gradeKey: 'bb_grade_aplus',
          idlePing: null,
          downloadLoadedPing: null,
          uploadLoadedPing: null,
          deltaDownload: 0,
          deltaUpload: 0,
          worstDelta: 0,
          color: '#10b981',
          diagnosisKey: 'bb_grade_aplus_desc',
          hasLoadedData: false
        };

    latestBufferbloatData = bb;

    if (badgeBufferbloatGrade) {
      const gradeText = i18n ? i18n.t(bb.gradeKey, currentLang) : `Grade ${bb.grade}`;
      badgeBufferbloatGrade.textContent = gradeText;
      badgeBufferbloatGrade.style.color = bb.color;
      badgeBufferbloatGrade.style.borderColor = bb.color;
    }

    if (bbIdleVal) {
      bbIdleVal.textContent = bb.idlePing !== null ? `${bb.idlePing} ms` : '-- ms';
    }
    if (bbDlVal) {
      bbDlVal.textContent = bb.downloadLoadedPing !== null ? `${bb.downloadLoadedPing} ms` : (bb.idlePing !== null ? `${bb.idlePing} ms` : '-- ms');
    }
    if (bbDlDelta) {
      bbDlDelta.textContent = `+${bb.deltaDownload} ms delta`;
    }
    if (bbUlVal) {
      bbUlVal.textContent = bb.uploadLoadedPing !== null ? `${bb.uploadLoadedPing} ms` : (bb.idlePing !== null ? `${bb.idlePing} ms` : '-- ms');
    }
    if (bbUlDelta) {
      bbUlDelta.textContent = `+${bb.deltaUpload} ms delta`;
    }
    if (bbWorstDeltaVal) {
      bbWorstDeltaVal.textContent = `+${bb.worstDelta} ms`;
      bbWorstDeltaVal.style.color = bb.color;
    }
    if (bbIndicatorLine) {
      bbIndicatorLine.style.backgroundColor = bb.color;
    }
    if (bbDiagnosisText) {
      bbDiagnosisText.textContent = i18n ? i18n.t(bb.diagnosisKey, currentLang) : `Worst Delta: +${bb.worstDelta}ms`;
    }

    // Household Concurrency Headroom
    const dlSpeed = latestSpeedtest ? (latestSpeedtest.downloadMbps || latestSpeedtest.download || 0) : 0;
    const ulSpeed = latestSpeedtest ? (latestSpeedtest.uploadMbps || latestSpeedtest.upload || 0) : 0;
    const headroom = evaluator
      ? evaluator.calculateHouseholdHeadroom({ downloadMbps: dlSpeed, uploadMbps: ulSpeed, worstDelta: bb.worstDelta })
      : {
          streams4k: Math.floor(dlSpeed / 25),
          calls1080p: Math.floor(dlSpeed / 5),
          tier: 'High Headroom',
          tierKey: 'headroom_tier_high',
          color: '#10b981',
          verdictKey: 'headroom_verdict_high'
        };

    if (badgeHeadroomTier) {
      badgeHeadroomTier.textContent = i18n ? i18n.t(headroom.tierKey, currentLang) : headroom.tier;
      badgeHeadroomTier.style.color = headroom.color;
      badgeHeadroomTier.style.borderColor = headroom.color;
    }
    if (headroom4kVal) {
      headroom4kVal.textContent = dlSpeed > 0 ? `${headroom.streams4k}x` : '--';
    }
    if (headroomCallsVal) {
      headroomCallsVal.textContent = dlSpeed > 0 ? `${headroom.calls1080p}x` : '--';
    }
    if (headroomGamingVal) {
      if (bb.worstDelta <= 15 && dlSpeed >= 50) {
        headroomGamingVal.textContent = currentLang === 'ar' ? 'مثالي' : 'Optimal';
        headroomGamingVal.className = 'kpi-val mono text-emerald';
      } else if (bb.worstDelta <= 35 && dlSpeed >= 25) {
        headroomGamingVal.textContent = currentLang === 'ar' ? 'مستقر' : 'Stable';
        headroomGamingVal.className = 'kpi-val mono text-blue';
      } else if (bb.worstDelta <= 80 || dlSpeed >= 10) {
        headroomGamingVal.textContent = currentLang === 'ar' ? 'معرض للتأخير' : 'Lag Risk';
        headroomGamingVal.className = 'kpi-val mono text-amber';
      } else {
        headroomGamingVal.textContent = currentLang === 'ar' ? 'حرج' : 'Critical';
        headroomGamingVal.className = 'kpi-val mono text-rose';
      }
    }
    if (headroomIndicatorLine) {
      headroomIndicatorLine.style.backgroundColor = headroom.color;
    }
    if (headroomVerdictText) {
      if (latestSpeedtest && dlSpeed > 0) {
        headroomVerdictText.textContent = i18n
          ? i18n.t(headroom.verdictKey, currentLang, { streams4k: headroom.streams4k })
          : `Supports ${headroom.streams4k}x 4K Streams`;
      } else {
        headroomVerdictText.textContent = currentLang === 'ar'
          ? 'بانتظار سجل اختبار السرعة لحساب سعة النطاق الترددي والتزامن المنزلي.'
          : 'Awaiting speedtest record to compute household concurrent bandwidth and queue capacity.';
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
      renderSpectralEfficiency();
      renderBufferbloatAndHeadroom();
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

    // Feature 1: Dynamic Carrier Aggregation Breakdown
    const caInfo = evaluator ? evaluator.parseCarrierAggregation(m) : { carriersCount: 1, totalDlBw: 20, carriers: [] };
    caServingBand.textContent = m.band || (caInfo.carriers[0] ? caInfo.carriers[0].band : 'N/A');
    caDlBw.textContent = `${caInfo.totalDlBw} MHz`;
    caUlBw.textContent = m.ulBandwidth || '20 MHz';
    
    const pciDisplay = (privacyMode && evaluator) ? evaluator.redactSensitiveData(m.pci, 'pci') : (m.pci !== null && m.pci !== undefined ? m.pci : 'N/A');
    const cellIdDisplay = (privacyMode && evaluator) ? evaluator.redactSensitiveData(m.cellId, 'cell_id') : (m.cellId || 'N/A');
    caPci.textContent = pciDisplay;
    caCellId.textContent = cellIdDisplay;

    caModeBadge.textContent = m.networkType || (m.band && m.band.startsWith('n') ? '5G SA / NSA' : 'LTE-A Pro');

    if (caInfo.carriers.length > 1) {
      caComponentCount.textContent = i18n ? i18n.t('ca_multi_carrier', currentLang, { count: caInfo.carriers.length }) : `${caInfo.carriers.length}x Carrier Aggregation`;
      caTagsList.innerHTML = caInfo.carriers.map((c, idx) => {
        const isPrimary = c.type === 'PCC';
        const prefix = isPrimary ? (currentLang === 'ar' ? 'الأساسي: ' : 'Primary: ') : `${c.type}: `;
        return `<span class="ca-tag ${isPrimary ? 'primary' : ''} mono">${prefix}${c.band} (+${c.bw} MHz)</span>`;
      }).join('');
    } else {
      caComponentCount.textContent = i18n ? i18n.t('ca_single_carrier', currentLang) : '1x Component Carrier';
      const prefix = currentLang === 'ar' ? 'الأساسي: ' : 'Primary: ';
      caTagsList.innerHTML = `<span class="ca-tag primary mono">${prefix}${m.band || 'Unknown'} (+${caInfo.totalDlBw} MHz)</span>`;
    }

    // Diagnostic Advice Engine
    if (evaluator) {
      diagnosticText.textContent = evaluator.generateDiagnosticAdvice(m);
    }

    // Render Spectral Efficiency & Bufferbloat/Headroom
    renderSpectralEfficiency();
    renderBufferbloatAndHeadroom();
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

    // Clear previous selection on re-render
    selectedRowIds.clear();
    updateMergeBar();
    if (checkAllRows) checkAllRows.checked = false;

    if (filteredHistory.length === 0) {
      const emptyTitle = allHistory.length === 0
        ? (i18n ? i18n.t('empty_history_title', currentLang) : 'No network speedtest or RF correlation records recorded yet.')
        : (i18n ? i18n.t('empty_search_title', currentLang) : 'No matching records found for the current search filter.');

      const emptySub = allHistory.length === 0
        ? (i18n ? i18n.t('empty_history_sub', currentLang) : 'Run a test on Speedtest.net or Fast.com, or click "Capture Speedtest Tab" above.')
        : (i18n ? i18n.t('empty_search_sub', currentLang) : 'Try adjusting search keywords or resetting source filter.');

      historyTbody.innerHTML = `
        <tr>
          <td colspan="12" class="empty-state">
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

    historyTbody.innerHTML = '';

    filteredHistory.forEach((item) => {
      const st = item.speedtest || {};
      const r = item.router || {};
      const entryId = item.id || String(item.timestamp);

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

      let pingDisplay = '--';
      if (st.pingMs !== undefined && st.pingMs !== null) {
        let p = Number(st.pingMs);
        if (!isNaN(p)) {
          if (p > 1000) {
            const s = String(Math.round(p));
            if (s.length >= 7) p = parseInt(s.substring(0, s.length - 6), 10);
            else if (s.length >= 5) p = parseInt(s.substring(0, s.length - 3), 10);
          }
          pingDisplay = p;
        }
      }

      const tr = document.createElement('tr');
      tr.dataset.entryId = entryId;

      // Checkbox cell
      const tdCheck = document.createElement('td');
      tdCheck.className = 'col-check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'row-select-check';
      checkbox.style.cursor = 'pointer';
      checkbox.style.accentColor = '#6366f1';
      checkbox.dataset.entryId = entryId;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedRowIds.add(entryId);
          tr.classList.add('row-selected');
        } else {
          selectedRowIds.delete(entryId);
          tr.classList.remove('row-selected');
        }
        updateMergeBar();
        if (checkAllRows) {
          checkAllRows.checked = selectedRowIds.size === filteredHistory.length && filteredHistory.length > 0;
        }
      });
      tdCheck.appendChild(checkbox);
      tr.appendChild(tdCheck);

      // Jitter display: Speedtest.net does not output jitter; only display for Fast.com/others when > 0
      const isSpeedtestDotNet = /speedtest/i.test(item.source || '') && !/fast/i.test(item.source || '');
      const rawJitter = st.jitterMs !== undefined ? st.jitterMs : (st.jitter !== undefined ? st.jitter : null);
      const numJitter = (rawJitter !== null && rawJitter !== undefined && !isNaN(rawJitter)) ? Number(rawJitter) : null;
      const jitterDisplay = (!isSpeedtestDotNet && numJitter !== null && numJitter > 0) ? String(numJitter) : '--';

      // Data cells
      const cells = [
        { content: formatTimestamp(item.timestamp), cls: 'mono', style: 'color: var(--text-muted); font-size: 11px;' },
        null, // source tag - handled separately
        { content: st.downloadMbps !== undefined ? st.downloadMbps.toFixed(1) : '--', cls: 'text-right mono speed-val-bold text-emerald' },
        { content: st.uploadMbps !== undefined ? st.uploadMbps.toFixed(1) : '--', cls: 'text-right mono speed-val-bold text-blue' },
        { content: String(pingDisplay), cls: 'text-right mono' },
        { content: jitterDisplay, cls: 'text-right mono', style: 'color: var(--text-muted);' },
        { content: `${rsrpVal}${rsrpVal !== '--' ? ' dBm' : ''}`, cls: 'text-right mono', style: `font-weight: 700; color: ${rsrpColor};` },
        { content: `${sinrVal}${sinrVal !== '--' ? ' dB' : ''}`, cls: 'text-right mono', style: `font-weight: 700; color: ${sinrColor};` },
        { content: r.band || (currentLang === 'ar' ? 'خلوي' : 'Cellular'), cls: 'mono', style: 'font-weight: 600; color: var(--text-primary);' },
        { content: item.correlationAnalysis || (currentLang === 'ar' ? 'تم قفل الإشارة اللاسلكية بنجاح.' : 'RF telemetry paired.'), cls: 'correlation-text' }
      ];

      cells.forEach((cell, idx) => {
        if (idx === 1) {
          // Source tag
          const td = document.createElement('td');
          const span = document.createElement('span');
          span.className = sourceTagClass;
          span.textContent = item.source || 'Speedtest';
          td.appendChild(span);
          tr.appendChild(td);
        } else {
          const td = document.createElement('td');
          if (cell.cls) td.className = cell.cls;
          if (cell.style) td.setAttribute('style', cell.style);
          td.textContent = cell.content;
          tr.appendChild(td);
        }
      });

      // Trash button cell
      const tdActions = document.createElement('td');
      tdActions.className = 'col-actions';
      const trashBtn = document.createElement('button');
      trashBtn.type = 'button';
      trashBtn.className = 'btn-row-trash';
      trashBtn.title = 'Delete this record';
      trashBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path><path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
      </svg>`;
      trashBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteEntryModal(entryId, item);
      });
      tdActions.appendChild(trashBtn);
      tr.appendChild(tdActions);

      historyTbody.appendChild(tr);
    });
  }

  /* ==========================================================================
     UPDATE MERGE ACTION BAR
     ========================================================================== */
  function updateMergeBar() {
    const count = selectedRowIds.size;
    if (mergeActionBar) mergeActionBar.style.display = count >= 1 ? 'flex' : 'none';
    if (mergeSelectionCount) mergeSelectionCount.textContent = `${count} selected`;
  }

  /* ==========================================================================
     SELECT ALL ROWS
     ========================================================================== */
  if (checkAllRows) {
    checkAllRows.addEventListener('change', () => {
      const checkboxes = historyTbody.querySelectorAll('.row-select-check');
      checkboxes.forEach(cb => {
        cb.checked = checkAllRows.checked;
        const id = cb.dataset.entryId;
        const row = cb.closest('tr');
        if (checkAllRows.checked) {
          selectedRowIds.add(id);
          if (row) row.classList.add('row-selected');
        } else {
          selectedRowIds.delete(id);
          if (row) row.classList.remove('row-selected');
        }
      });
      updateMergeBar();
    });
  }

  if (btnCancelMerge) {
    btnCancelMerge.addEventListener('click', () => {
      selectedRowIds.clear();
      if (checkAllRows) checkAllRows.checked = false;
      historyTbody.querySelectorAll('tr').forEach(r => r.classList.remove('row-selected'));
      historyTbody.querySelectorAll('.row-select-check').forEach(cb => { cb.checked = false; });
      updateMergeBar();
    });
  }

  /* ==========================================================================
     DELETE SINGLE ENTRY
     ========================================================================== */
  function openDeleteEntryModal(entryId, item) {
    pendingDeleteEntryId = entryId;
    if (deleteEntryModalBody) {
      const ts = formatTimestamp(item.timestamp);
      const dl = item.speedtest ? item.speedtest.downloadMbps : '--';
      deleteEntryModalBody.textContent = `Delete "${ts} — ${item.source || 'Speedtest'} ${dl} Mbps"? This cannot be undone.`;
    }
    if (modalDeleteEntryOverlay) modalDeleteEntryOverlay.classList.add('active');
  }

  function closeDeleteEntryModal() {
    if (modalDeleteEntryOverlay) modalDeleteEntryOverlay.classList.remove('active');
    pendingDeleteEntryId = null;
  }

  async function executeDeleteEntry() {
    if (!pendingDeleteEntryId) { closeDeleteEntryModal(); return; }
    const idToDelete = pendingDeleteEntryId;
    closeDeleteEntryModal();

    try {
      allHistory = allHistory.filter(e => (e.id || String(e.timestamp)) !== idToDelete);
      await chrome.storage.local.set({ netpulse_history: allHistory });
      applyFilters();
      renderTable();
      showToast('Record deleted successfully.');
    } catch (err) {
      console.error('[NetPulse] Delete entry error:', err);
    }
  }

  if (btnDeleteEntryCancel) btnDeleteEntryCancel.addEventListener('click', closeDeleteEntryModal);
  if (btnDeleteEntryConfirm) btnDeleteEntryConfirm.addEventListener('click', executeDeleteEntry);
  if (modalDeleteEntryOverlay) {
    modalDeleteEntryOverlay.addEventListener('click', e => { if (e.target === modalDeleteEntryOverlay) closeDeleteEntryModal(); });
  }

  /* ==========================================================================
     MERGE SELECTED ENTRIES
     ========================================================================== */
  function openMergeModal() {
    if (selectedRowIds.size < 2) {
      showToast('Select at least 2 records to merge.');
      return;
    }
    if (mergeModalBody) {
      mergeModalBody.textContent = `Merge ${selectedRowIds.size} selected records into one averaged entry? The originals will be removed and replaced with the merged result.`;
    }
    if (modalMergeOverlay) modalMergeOverlay.classList.add('active');
  }

  function closeMergeModal() {
    if (modalMergeOverlay) modalMergeOverlay.classList.remove('active');
  }

  async function executeMerge() {
    closeMergeModal();
    const ids = new Set(selectedRowIds);
    const toMerge = allHistory.filter(e => ids.has(e.id || String(e.timestamp)));
    if (toMerge.length < 2) return;

    // Average all numeric speedtest fields
    const avg = (arr, fn) => {
      const vals = arr.map(fn).filter(v => v !== null && v !== undefined && !isNaN(Number(v)));
      return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2)) : null;
    };

    const sources = [...new Set(toMerge.map(e => e.source).filter(Boolean))];
    const latestRouter = toMerge.find(e => e.router)?.router || null;
    const correlations = toMerge.map(e => e.correlationAnalysis).filter(Boolean);

    const mergedEntry = {
      id: 'merged_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Math.round(toMerge.reduce((a, b) => a + (b.timestamp || 0), 0) / toMerge.length),
      dateIso: new Date().toISOString(),
      source: sources.join(' + '),
      speedtest: {
        source: sources.join(' + '),
        downloadMbps: avg(toMerge, e => e.speedtest?.downloadMbps),
        uploadMbps: avg(toMerge, e => e.speedtest?.uploadMbps),
        pingMs: avg(toMerge, e => e.speedtest?.pingMs),
        jitterMs: avg(toMerge, e => e.speedtest?.jitterMs),
        isp: toMerge[0]?.speedtest?.isp || null,
        server: toMerge[0]?.speedtest?.server || null,
        resultUrl: null,
        resultId: null
      },
      router: latestRouter,
      correlationAnalysis: `[Merged from ${toMerge.length} records] ${correlations[0] || ''}`,
      _merged: true,
      _mergedCount: toMerge.length
    };

    try {
      allHistory = allHistory.filter(e => !ids.has(e.id || String(e.timestamp)));
      allHistory.unshift(mergedEntry);
      await chrome.storage.local.set({ netpulse_history: allHistory });
      selectedRowIds.clear();
      applyFilters();
      renderTable();
      showToast(`Merged ${toMerge.length} records into one averaged entry.`);
    } catch (err) {
      console.error('[NetPulse] Merge error:', err);
    }
  }

  if (btnMergeSelected) btnMergeSelected.addEventListener('click', openMergeModal);
  if (btnMergeCancel) btnMergeCancel.addEventListener('click', closeMergeModal);
  if (btnMergeConfirm) btnMergeConfirm.addEventListener('click', executeMerge);
  if (modalMergeOverlay) {
    modalMergeOverlay.addEventListener('click', e => { if (e.target === modalMergeOverlay) closeMergeModal(); });
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
      'netpulse_router_creds',
      'netpulse_privacy_mode'
    ], (res) => {
      // Preferences
      if (res.netpulse_theme) {
        applyTheme(res.netpulse_theme);
      }
      if (res.netpulse_lang) {
        applyLanguage(res.netpulse_lang);
      }
      privacyMode = !!res.netpulse_privacy_mode;
      updatePrivacyUi();

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

      // Game Server Probe Target Preference
      if (res.netpulse_game_probe_target) {
        selectedGameServerKey = GAME_SERVER_ENDPOINTS[res.netpulse_game_probe_target] ? res.netpulse_game_probe_target : 'cf_ultra_fast';
        if (selectGameServer) {
          selectGameServer.value = selectedGameServerKey;
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
    if (changes.netpulse_game_probe_target) {
      const newTarget = changes.netpulse_game_probe_target.newValue;
      selectedGameServerKey = GAME_SERVER_ENDPOINTS[newTarget] ? newTarget : 'cf_ultra_fast';
      if (selectGameServer) {
        selectGameServer.value = selectedGameServerKey;
      }
      resetGamingStats();
      if (gamingHudRunning) {
        runSingleGamingProbe();
      }
    }
    if (changes.netpulse_privacy_mode !== undefined) {
      privacyMode = !!changes.netpulse_privacy_mode.newValue;
      updatePrivacyUi();
      renderLiveTelemetry(currentRouterData);
      renderTable();
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

  // Feature 5: Export PNG Card Click Handler
  if (btnExportPngCard) {
    btnExportPngCard.addEventListener('click', () => {
      const latestSpeedtest = allHistory.length > 0 && allHistory[0].speedtest ? allHistory[0].speedtest : null;
      if (!currentRouterData && !latestSpeedtest) {
        showToast(currentLang === 'ar' ? 'لا توجد بيانات متاحة لتوليد بطاقة التقرير.' : 'No telemetry available to generate report card.', 'warning');
        return;
      }
      showToast(i18n ? i18n.t('toast_png_exporting', currentLang) : 'Generating diagnostic card PNG...');
      if (evaluator && evaluator.downloadDiagnosticCardPng) {
        evaluator.downloadDiagnosticCardPng({
          router: currentRouterData ? currentRouterData.metrics : null,
          speedtest: latestSpeedtest,
          privacyMode,
          title: 'NetPulse RF Telemetry & Speed Report',
          timeWindow: new Date().toLocaleString(),
          lang: currentLang
        });
        showToast(i18n ? i18n.t('toast_png_exported', currentLang) : 'Diagnostic PNG report card downloaded successfully.', 'success');
      }
    });
  }

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
        showToast(currentLang === 'ar'
          ? 'لم يتم العثور على أي علامة تبويب مفتوحة للموجه (192.168.*). يرجى فتح واجهة الموجه في المتصفح والمحاولة مرة أخرى.'
          : 'No open router tabs found (matching 192.168.*). Please open your router GUI in a tab and try again.',
          'warning'
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
        showToast(currentLang === 'ar'
          ? `تم فحص بيانات الموجه بنجاح من ${foundData.routerUrl || 'البوابة'}! RSRP: ${foundData.metrics.rsrp} dBm | RSRQ: ${foundData.metrics.rsrq} dB`
          : `Successfully scanned router telemetry from ${foundData.routerUrl || 'gateway'}! RSRP: ${foundData.metrics.rsrp} dBm | RSRQ: ${foundData.metrics.rsrq} dB`,
          'success'
        );
      } else {
        showToast(currentLang === 'ar'
          ? 'تم مسح علامات الموجه المفتوحة، ولكن لم يتم العثور على أرقام التردد اللاسلكي. يرجى التأكد من الدخول لصفحة Cellular Info / معلومات الخلية.'
          : 'Scanned open router tab(s), but no cellular metrics were visible on the active page. Please ensure you are on the Cellular Info / Status page.',
          'warning'
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      showToast(currentLang === 'ar' ? `فشل الفحص: ${err.message}` : `Scan failed: ${err.message}`, 'error');
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
        showToast(currentLang === 'ar'
          ? 'لم يتم العثور على علامة تبويب مفتوحة لـ Speedtest.net أو Fast.com. يرجى فتح إحداهما وإجراء اختبار.'
          : 'No open Speedtest.net or Fast.com tabs detected. Please run a test in a tab and click this button to capture it.',
          'warning'
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
          showToast(currentLang === 'ar'
            ? `تم التقاط نتيجة الاختبار بنجاح! المصدر: ${captured.source} | التنزيل: ${captured.downloadMbps} Mbps | الرفع: ${captured.uploadMbps || '--'} Mbps`
            : `Successfully captured test results! Source: ${captured.source} | Download: ${captured.downloadMbps} Mbps | Upload: ${captured.uploadMbps || '--'} Mbps | Ping: ${captured.pingMs || '--'} ms`,
            'success'
          );
        } else if (allHistory.length > 0 && allHistory[0].speedtest && allHistory[0].speedtest.downloadMbps > 0) {
          const st = allHistory[0].speedtest;
          showToast(currentLang === 'ar'
            ? `تم تسجيل الاختبار! المصدر: ${allHistory[0].source} | التنزيل: ${st.downloadMbps} Mbps | الرفع: ${st.uploadMbps || '--'} Mbps`
            : `Test captured! Source: ${allHistory[0].source} | Download: ${st.downloadMbps} Mbps | Upload: ${st.uploadMbps || '--'} Mbps | Ping: ${st.pingMs || '--'} ms`,
            'success'
          );
        } else {
          showToast(currentLang === 'ar'
            ? 'تم العثور على علامة اختبار، ولكن لم تنتهِ نتائج القياس بعد. يرجى الانتظار حتى اكتمال الاختبار.'
            : 'Found an open test tab, but speed numbers were not finalized yet. Please let the test complete and try again.',
            'warning'
          );
        }
      });
    } catch (err) {
      console.error('Speedtest capture error:', err);
      showToast(currentLang === 'ar' ? `فشل التقاط الاختبار: ${err.message}` : `Capture failed: ${err.message}`, 'error');
    } finally {
      btnScanSpeedtestLabel.textContent = i18n ? i18n.t('capture_speedtest_tab', currentLang) : 'Capture Speedtest Tab';
    }
  });

  /* ==========================================================================
     EXPORT ACTIONS (CSV / JSON)
     ========================================================================== */
  btnExportCsv.addEventListener('click', () => {
    if (allHistory.length === 0) {
      showToast(currentLang === 'ar' ? 'لا توجد سجلات لتصديرها.' : 'No history records to export.', 'warning');
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
      showToast(currentLang === 'ar' ? 'لا توجد سجلات لتصديرها.' : 'No history records to export.', 'warning');
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

  /* ==========================================================================
     FEATURE 2: LIVE GAMING JITTER & PACKET LOSS HUD CONTROLLER
     (High-Availability Anycast CDN & Cloud Edge Probing - Zero Drop Engine)
     ========================================================================== */
  const GAME_SERVER_ENDPOINTS = {
    cf_ultra_fast: {
      id: 'cf_ultra_fast',
      name: 'Cloudflare Ultra-Fast Edge (Frankfurt / EU)',
      url: 'https://1.1.1.1/cdn-cgi/trace'
    },
    google_cloud_edge: {
      id: 'google_cloud_edge',
      name: 'Google Cloud Global Edge (Zero Overhead)',
      url: 'https://www.google.com/generate_204'
    },
    aws_gaming_hub: {
      id: 'aws_gaming_hub',
      name: 'AWS European Gaming Hub (Frankfurt)',
      url: 'https://checkip.amazonaws.com/'
    }
  };

  const selectGameServer = document.getElementById('select-game-server');
  const badgeGamingStatus = document.getElementById('badge-gaming-status');
  const gamingStatusText = document.getElementById('gaming-status-text');
  const badgeRouteRadar = document.getElementById('badge-route-radar');
  const routeRadarText = document.getElementById('route-radar-text');
  const btnFlightCheck = document.getElementById('btn-flight-check');
  const flightCheckLabel = document.getElementById('flight-check-label');
  const gamingFlightCheckBanner = document.getElementById('gaming-flight-check-banner');
  const btnCloseFlightCheck = document.getElementById('btn-close-flight-check');
  const flightVerdictPill = document.getElementById('flight-verdict-pill');
  const flightStatsLine = document.getElementById('flight-stats-line');
  const flightCheckStatusTitle = document.getElementById('flight-check-status-title');

  const btnToggleGamingHud = document.getElementById('btn-toggle-gaming-hud');
  const gamingToggleIcon = document.getElementById('gaming-toggle-icon');
  const gamingToggleLabel = document.getElementById('gaming-toggle-label');
  const gamingPingVal = document.getElementById('gaming-ping-val');
  const gamingPingGrade = document.getElementById('gaming-ping-grade');
  const gamingJitterVal = document.getElementById('gaming-jitter-val');
  const gamingJitterSub = document.getElementById('gaming-jitter-sub');
  const gamingLossVal = document.getElementById('gaming-loss-val');
  const gamingLossSub = document.getElementById('gaming-loss-sub');
  const gamingSpikesVal = document.getElementById('gaming-spikes-val');
  const gamingSpikesSub = document.getElementById('gaming-spikes-sub');
  const cardCsiGauge = document.getElementById('card-csi-gauge');
  const gamingCsiVal = document.getElementById('gaming-csi-val');
  const gamingCsiBar = document.getElementById('gaming-csi-bar');
  const gamingCsiGrade = document.getElementById('gaming-csi-grade');
  const gamingMinmaxVal = document.getElementById('gaming-minmax-val');
  const gamingAvgSub = document.getElementById('gaming-avg-sub');
  const canvasGamingHud = document.getElementById('canvas-gaming-hud');

  let selectedGameServerKey = 'cf_ultra_fast';
  let gamingHudRunning = false;
  let gamingHudInterval = null;
  let gamingProbeHistory = []; // max 60 probe data points (representing last 60 seconds)
  let lastProbeRtt = null;
  let isProbing = false;
  let radarResetTimer = null;

  function resetGamingStats() {
    gamingProbeHistory = [];
    lastProbeRtt = null;
    updateGamingHudUi();
    drawGamingSparkline();
  }

  if (selectGameServer) {
    selectGameServer.addEventListener('change', () => {
      selectedGameServerKey = selectGameServer.value || 'cf_ultra_fast';
      chrome.storage.local.set({ netpulse_game_probe_target: selectedGameServerKey });
      resetGamingStats();
      if (gamingHudRunning) {
        runSingleGamingProbe();
      }
    });
  }

  /**
   * Feature 3: Route Deviation Radar Alert Trigger
   */
  function triggerRouteDeviationAlert(spikeDelta, causeKey) {
    if (!badgeRouteRadar || !routeRadarText) return;
    if (radarResetTimer) clearTimeout(radarResetTimer);

    badgeRouteRadar.className = 'status-badge badge-rose mono';
    const causeText = i18n ? i18n.t(causeKey, currentLang) : 'Route Spike';
    routeRadarText.textContent = i18n ? i18n.t('radar_spike_detected', currentLang, { delta: spikeDelta }) : `Route Deviation Spike (+${spikeDelta}ms)`;
    badgeRouteRadar.setAttribute('title', `${causeText} (+${spikeDelta}ms)`);

    radarResetTimer = setTimeout(() => {
      badgeRouteRadar.className = 'status-badge badge-neutral mono';
      routeRadarText.textContent = i18n ? i18n.t('radar_normal', currentLang) : 'Route Radar: Normal';
      badgeRouteRadar.setAttribute('title', 'Real-Time Route Deviation & Spike Radar');
    }, 8000);
  }

  function recordProbeSuccess(rtt) {
    let jitter = 0;
    if (lastProbeRtt !== null) {
      jitter = Math.abs(rtt - lastProbeRtt);
    }
    lastProbeRtt = rtt;

    // Feature 3: Real-Time Latency Spike & Route Deviation Radar (Rolling Avg + 35ms)
    const recentValid = gamingProbeHistory.filter(p => !p.lost && p.rtt !== null).slice(-10);
    const rollingAvg = recentValid.length > 0 ? (recentValid.reduce((a, b) => a + b.rtt, 0) / recentValid.length) : rtt;
    const isSpike = recentValid.length >= 3 && (rtt > rollingAvg + 35);
    let spikeDelta = 0;
    let spikeCause = null;

    if (isSpike) {
      spikeDelta = Math.round(rtt - rollingAvg);
      const worstDelta = latestBufferbloatData ? latestBufferbloatData.worstDelta : 0;
      const rsrq = (currentRouterData && currentRouterData.metrics && currentRouterData.metrics.rsrq !== null) ? Number(currentRouterData.metrics.rsrq) : 0;

      if (worstDelta > 30) {
        spikeCause = 'radar_cause_saturation';
      } else if (rsrq < -13) {
        spikeCause = 'radar_cause_rf_contention';
      } else {
        spikeCause = 'radar_cause_isp_peering';
      }

      triggerRouteDeviationAlert(spikeDelta, spikeCause);
    }

    const probePoint = {
      timestamp: Date.now(),
      target: selectedGameServerKey,
      rtt,
      jitter,
      lost: false,
      isSpike,
      spikeDelta,
      spikeCause
    };

    gamingProbeHistory.push(probePoint);
    if (gamingProbeHistory.length > 60) {
      gamingProbeHistory.shift();
    }

    updateGamingHudUi();
    drawGamingSparkline();
  }

  function recordProbeDrop() {
    lastProbeRtt = null;
    const probePoint = {
      timestamp: Date.now(),
      target: selectedGameServerKey,
      rtt: null,
      jitter: null,
      lost: true,
      isSpike: false,
      spikeDelta: 0,
      spikeCause: null
    };

    gamingProbeHistory.push(probePoint);
    if (gamingProbeHistory.length > 60) {
      gamingProbeHistory.shift();
    }

    updateGamingHudUi();
    drawGamingSparkline();
  }

  async function runSingleGamingProbe() {
    if (isProbing) return;
    isProbing = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const targetConfig = GAME_SERVER_ENDPOINTS[selectedGameServerKey] || GAME_SERVER_ENDPOINTS.cf_ultra_fast;
    const probeUrl = `${targetConfig.url}${targetConfig.url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const startTime = performance.now();

    try {
      await fetch(probeUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const rtt = Math.round(performance.now() - startTime);
      recordProbeSuccess(rtt);
    } catch (err) {
      clearTimeout(timeoutId);
      recordProbeDrop();
    } finally {
      isProbing = false;
    }
  }

  function updateGamingHudUi() {
    const isAr = currentLang === 'ar';
    const totalProbes = gamingProbeHistory.length;
    const lostCount = gamingProbeHistory.filter(p => p.lost).length;
    const lossPct = totalProbes > 0 ? ((lostCount / totalProbes) * 100).toFixed(1) : '0.0';
    const validProbes = gamingProbeHistory.filter(p => !p.lost && p.rtt !== null);
    const validRtts = validProbes.map(p => p.rtt);
    const minRtt = validRtts.length > 0 ? Math.min(...validRtts) : null;
    const maxRtt = validRtts.length > 0 ? Math.max(...validRtts) : null;
    const avgRtt = validRtts.length > 0 ? Math.round(validRtts.reduce((a, b) => a + b, 0) / validRtts.length) : null;

    const latest = gamingProbeHistory.length > 0 ? gamingProbeHistory[gamingProbeHistory.length - 1] : null;

    // 1. Current Ping
    if (gamingPingVal) {
      if (latest) {
        if (latest.lost) {
          gamingPingVal.textContent = 'DROP';
          gamingPingVal.className = 'kpi-val mono text-rose';
        } else if (latest.rtt !== null) {
          gamingPingVal.textContent = latest.rtt;
          if (latest.rtt < 55) gamingPingVal.className = 'kpi-val mono text-emerald';
          else if (latest.rtt <= 85) gamingPingVal.className = 'kpi-val mono text-blue';
          else if (latest.rtt <= 110) gamingPingVal.className = 'kpi-val mono text-amber';
          else gamingPingVal.className = 'kpi-val mono text-rose';
        } else {
          gamingPingVal.textContent = '--';
          gamingPingVal.className = 'kpi-val mono text-muted';
        }
      } else {
        gamingPingVal.textContent = '--';
        gamingPingVal.className = 'kpi-val mono text-muted';
      }
    }

    // Ping Grade subtitle
    if (gamingPingGrade) {
      if (latest) {
        if (latest.lost) {
          gamingPingGrade.textContent = isAr ? 'فقدان حزمة' : 'Packet Dropped';
          gamingPingGrade.className = 'kpi-sub mono text-rose';
        } else if (latest.rtt !== null) {
          if (latest.rtt < 55) {
            gamingPingGrade.textContent = isAr ? 'أداء بطولات (< 55ms)' : 'Tournament Grade (< 55ms)';
            gamingPingGrade.className = 'kpi-sub mono text-emerald';
          } else if (latest.rtt <= 85) {
            gamingPingGrade.textContent = isAr ? 'أداء تنافسي (55-85ms)' : 'Competitive Grade (55-85ms)';
            gamingPingGrade.className = 'kpi-sub mono text-blue';
          } else if (latest.rtt <= 110) {
            gamingPingGrade.textContent = isAr ? 'أداء لعب مقبول (86-110ms)' : 'Playable Latency (86-110ms)';
            gamingPingGrade.className = 'kpi-sub mono text-amber';
          } else {
            gamingPingGrade.textContent = isAr ? 'تأخير مرتفع وانقطاع (> 110ms)' : 'High Latency Spike (> 110ms)';
            gamingPingGrade.className = 'kpi-sub mono text-rose';
          }
        }
      } else {
        gamingPingGrade.textContent = isAr ? 'بانتظار الفحص' : 'Awaiting Probe';
        gamingPingGrade.className = 'kpi-sub mono text-muted';
      }
    }

    // 2. Real-Time Jitter
    if (gamingJitterVal) {
      if (latest && latest.jitter !== null && !latest.lost) {
        gamingJitterVal.textContent = latest.jitter;
        if (latest.jitter < 8) gamingJitterVal.className = 'kpi-val mono text-emerald';
        else if (latest.jitter <= 20) gamingJitterVal.className = 'kpi-val mono text-blue';
        else if (latest.jitter <= 35) gamingJitterVal.className = 'kpi-val mono text-amber';
        else gamingJitterVal.className = 'kpi-val mono text-rose';
      } else {
        gamingJitterVal.textContent = '--';
        gamingJitterVal.className = 'kpi-val mono text-muted';
      }
    }

    // 3. Packet Loss %
    if (gamingLossVal) {
      gamingLossVal.textContent = `${lossPct}%`;
      if (parseFloat(lossPct) === 0) {
        gamingLossVal.className = 'kpi-val mono text-emerald';
      } else if (parseFloat(lossPct) < 5) {
        gamingLossVal.className = 'kpi-val mono text-amber';
      } else {
        gamingLossVal.className = 'kpi-val mono text-rose';
      }
    }
    if (gamingLossSub) {
      gamingLossSub.textContent = isAr
        ? `${lostCount} / ${totalProbes} حزم مفقودة`
        : `${lostCount} / ${totalProbes} probes dropped`;
    }

    // 4. Micro-Spikes (Last 60s) (Feature 3)
    const spikeCount = gamingProbeHistory.filter(p => p.isSpike).length;
    if (gamingSpikesVal) {
      gamingSpikesVal.textContent = spikeCount;
      if (spikeCount === 0) {
        gamingSpikesVal.className = 'kpi-val mono text-emerald';
      } else if (spikeCount <= 2) {
        gamingSpikesVal.className = 'kpi-val mono text-amber';
      } else {
        gamingSpikesVal.className = 'kpi-val mono text-rose';
      }
    }
    if (gamingSpikesSub) {
      gamingSpikesSub.textContent = i18n
        ? i18n.t('hud_spikes_sub', currentLang, { count: spikeCount })
        : `${spikeCount} route spikes detected`;
    }

    // 5. Feature 2: Competitive Gaming Stability Index (CSI 0-100%)
    const latestPingNum = (latest && !latest.lost && latest.rtt !== null) ? latest.rtt : (avgRtt !== null ? avgRtt : 20);
    const latestJitterNum = (latest && !latest.lost && latest.jitter !== null) ? latest.jitter : 0;
    const worstDeltaNum = latestBufferbloatData ? latestBufferbloatData.worstDelta : 0;
    const lossPctNum = parseFloat(lossPct) || 0;

    const csi = evaluator
      ? evaluator.calculateCSI({ jitter: latestJitterNum, packetLoss: lossPctNum, ping: latestPingNum, worstDelta: worstDeltaNum })
      : { score: 100, tier: 'Tournament Ready', tierKey: 'csi_tournament', color: '#10b981', deductions: { jitter: 0, loss: 0, ping: 0, bufferbloat: 0 } };

    if (gamingCsiVal) {
      gamingCsiVal.textContent = gamingProbeHistory.length > 0 ? `${csi.score}%` : '100%';
      gamingCsiVal.style.color = csi.color;
    }
    if (gamingCsiBar) {
      gamingCsiBar.style.width = gamingProbeHistory.length > 0 ? `${csi.score}%` : '100%';
      gamingCsiBar.style.backgroundColor = csi.color;
    }
    if (gamingCsiGrade) {
      gamingCsiGrade.textContent = i18n ? i18n.t(csi.tierKey, currentLang) : csi.tier;
      gamingCsiGrade.style.color = csi.color;
    }
    if (cardCsiGauge) {
      const tooltip = i18n
        ? i18n.t('csi_deduction_tooltip', currentLang, {
            jitter: csi.deductions.jitter,
            loss: csi.deductions.loss,
            ping: csi.deductions.ping,
            bb: csi.deductions.bufferbloat
          })
        : `CSI Deductions: Jitter -${csi.deductions.jitter}%, Loss -${csi.deductions.loss}%, Ping -${csi.deductions.ping}%, Bufferbloat -${csi.deductions.bufferbloat}%`;
      cardCsiGauge.setAttribute('title', tooltip);
    }

    // 6. Min / Max / Avg Ping
    if (gamingMinmaxVal) {
      gamingMinmaxVal.textContent = (minRtt !== null && maxRtt !== null)
        ? `${minRtt} / ${maxRtt}`
        : '-- / --';
    }
    if (gamingAvgSub) {
      gamingAvgSub.textContent = (avgRtt !== null)
        ? (isAr ? `المتوسط: ${avgRtt} ms` : `Avg: ${avgRtt} ms`)
        : (isAr ? 'المتوسط: -- ms' : 'Avg: -- ms');
    }

    // Header Status Badge
    if (badgeGamingStatus && gamingStatusText) {
      if (gamingHudRunning) {
        if (lostCount > 0 && (lostCount / totalProbes) >= 0.05) {
          badgeGamingStatus.className = 'status-badge badge-rose';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_drops', currentLang) : 'Packet Loss Spikes Detected';
        } else if (latest && latest.jitter !== null && latest.jitter > 30) {
          badgeGamingStatus.className = 'status-badge badge-amber';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_jittery', currentLang) : 'High Jitter Fluctuation';
        } else if (avgRtt !== null && avgRtt < 55) {
          badgeGamingStatus.className = 'status-badge badge-emerald';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_tournament', currentLang) : 'Tournament Grade (< 55ms)';
        } else if (avgRtt !== null && avgRtt <= 85) {
          badgeGamingStatus.className = 'status-badge badge-blue';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_competitive', currentLang) : 'Competitive Grade (55-85ms)';
        } else if (avgRtt !== null && avgRtt <= 110) {
          badgeGamingStatus.className = 'status-badge badge-amber';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_moderate', currentLang) : 'Playable Latency (86-110ms)';
        } else {
          badgeGamingStatus.className = 'status-badge badge-rose';
          gamingStatusText.textContent = i18n ? i18n.t('hud_status_lag', currentLang) : 'High Latency Spike (> 110ms)';
        }
      } else {
        badgeGamingStatus.className = 'status-badge badge-neutral';
        gamingStatusText.textContent = i18n ? i18n.t('hud_status_idle', currentLang) : 'Probe Paused';
      }
    }

    // Start / Pause Toggle Button
    if (gamingToggleLabel && gamingToggleIcon) {
      if (gamingHudRunning) {
        gamingToggleLabel.textContent = i18n ? i18n.t('hud_btn_pause', currentLang) : 'Pause Probe';
        gamingToggleIcon.innerHTML = `
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        `;
      } else {
        gamingToggleLabel.textContent = i18n ? i18n.t('hud_btn_start', currentLang) : 'Start Gaming Probe';
        gamingToggleIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      }
    }
  }

  function drawGamingSparkline() {
    if (!canvasGamingHud) return;
    const ctx = canvasGamingHud.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasGamingHud.getBoundingClientRect();
    
    // Dynamic sizing to match display resolution
    const displayWidth = rect.width || 1000;
    const displayHeight = rect.height || 140;

    if (canvasGamingHud.width !== Math.round(displayWidth * dpr)) {
      canvasGamingHud.width = Math.round(displayWidth * dpr);
      canvasGamingHud.height = Math.round(displayHeight * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = displayWidth;
    const h = displayHeight;

    // Clear background
    const isDark = currentTheme !== 'light';
    ctx.fillStyle = isDark ? '#080d16' : '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    // Compute Y Scale
    const validProbes = gamingProbeHistory.filter(p => !p.lost && p.rtt !== null);
    const validRtts = validProbes.map(p => p.rtt);
    const highestRtt = validRtts.length > 0 ? Math.max(...validRtts) : 100;
    const maxScale = Math.max(130, Math.ceil(highestRtt * 1.25));

    const padTop = 18;
    const padBottom = 22;
    const padLeft = 45;
    const padRight = 20;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const getY = (rtt) => {
      const clamped = Math.max(0, Math.min(maxScale, rtt));
      return padTop + plotH - (clamped / maxScale) * plotH;
    };

    // Draw horizontal grid lines & threshold bands
    const thresholds = [
      { rtt: 55, color: 'rgba(16, 185, 129, 0.25)', label: '55ms' },
      { rtt: 85, color: 'rgba(59, 130, 246, 0.25)', label: '85ms' },
      { rtt: 110, color: 'rgba(245, 158, 11, 0.25)', label: '110ms' }
    ];

    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = isDark ? '#6b7280' : '#94a3b8';

    // Baseline (0ms)
    const y0 = getY(0);
    ctx.strokeStyle = isDark ? '#1f2937' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(padLeft, y0);
    ctx.lineTo(w - padRight, y0);
    ctx.stroke();
    ctx.fillText('0ms', 10, y0 + 3);

    // Threshold lines
    for (const th of thresholds) {
      if (th.rtt < maxScale) {
        const yTh = getY(th.rtt);
        ctx.strokeStyle = th.color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, yTh);
        ctx.lineTo(w - padRight, yTh);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(th.label, 10, yTh + 3);
      }
    }

    // Top scale label
    ctx.fillText(`${maxScale}ms`, 10, padTop + 4);

    // If no probes yet, draw empty placeholder guide
    if (gamingProbeHistory.length === 0) {
      ctx.fillStyle = isDark ? '#4b5563' : '#94a3b8';
      ctx.font = '12px ui-monospace, sans-serif';
      ctx.textAlign = 'center';
      const targetLabel = (GAME_SERVER_ENDPOINTS[selectedGameServerKey] || GAME_SERVER_ENDPOINTS.cf_ultra_fast).name;
      ctx.fillText(currentLang === 'ar' ? `انقر على "بدء فحص الألعاب" لقياس الاستجابة لخادم ${targetLabel}` : `Click "Start Gaming Probe" to monitor latency to ${targetLabel}`, w / 2, h / 2);
      ctx.restore();
      return;
    }

    // Step across up to 60 data slots
    const maxSlots = 60;
    const stepX = plotW / (maxSlots - 1);

    // Plot segments
    const points = [];
    const startIndex = Math.max(0, maxSlots - gamingProbeHistory.length);

    gamingProbeHistory.forEach((p, i) => {
      const slot = startIndex + i;
      const x = padLeft + slot * stepX;
      if (p.lost || p.rtt === null) {
        points.push({ x, y: null, lost: true, probe: p });
      } else {
        points.push({ x, y: getY(p.rtt), lost: false, probe: p });
      }
    });

    // Draw line segments between consecutive valid points
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length - 1; i++) {
      const pt1 = points[i];
      const pt2 = points[i + 1];

      if (!pt1.lost && !pt2.lost) {
        const avgPing = (pt1.probe.rtt + pt2.probe.rtt) / 2;
        let strokeColor = '#10b981'; // emerald (< 55)
        if (avgPing > 110) strokeColor = '#f43f5e'; // rose (> 110)
        else if (avgPing > 85) strokeColor = '#f59e0b'; // amber (86-110)
        else if (avgPing >= 55) strokeColor = '#3b82f6'; // blue (55-85)

        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
      }
    }

    // Draw Drop markers, Spike markers & Point dots
    points.forEach((pt, i) => {
      if (pt.lost) {
        // Vertical Rose Drop bar for lost probe
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pt.x, padTop);
        ctx.lineTo(pt.x, padTop + plotH);
        ctx.stroke();

        // Top 'X' indicator
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 11px ui-monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('X', pt.x, padTop - 4);
      } else {
        const rtt = pt.probe.rtt;
        let dotColor = '#10b981';
        if (rtt > 110 || pt.probe.isSpike) dotColor = '#f43f5e';
        else if (rtt > 85) dotColor = '#f59e0b';
        else if (rtt >= 55) dotColor = '#3b82f6';

        // Feature 3: Distinct vertical spike marker
        if (pt.probe.isSpike) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(pt.x, padTop);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Rose triangle marker above spike
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('▲', pt.x, Math.max(padTop - 4, pt.y - 7));
        }

        const isLatest = (i === points.length - 1);
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isLatest ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (isLatest) {
          // Subtle outer ring for active lead probe
          ctx.strokeStyle = dotColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });

    // Time window footer (e.g. "60s ago" ... "Now")
    ctx.fillStyle = isDark ? '#4b5563' : '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentLang === 'ar' ? '-60 ثانية' : '-60s', padLeft, h - 6);
    ctx.textAlign = 'right';
    ctx.fillText(currentLang === 'ar' ? 'الآن' : 'Now', w - padRight, h - 6);

    ctx.restore();
  }

  /* ==========================================================================
     FEATURE 4: PRE-MATCH 15s CONNECTION FLIGHT CHECK
     ========================================================================== */
  let flightCheckRunning = false;
  let flightCheckInterval = null;
  let flightCheckSecondsRemaining = 15;
  let flightCheckProbes = [];

  async function run15sFlightCheck() {
    if (flightCheckRunning) return;
    flightCheckRunning = true;
    flightCheckSecondsRemaining = 15;
    flightCheckProbes = [];

    if (btnFlightCheck) {
      btnFlightCheck.disabled = true;
      btnFlightCheck.style.opacity = '0.6';
    }
    if (flightCheckLabel) {
      flightCheckLabel.textContent = i18n
        ? i18n.t('flight_check_running', currentLang, { seconds: flightCheckSecondsRemaining })
        : `Auditing (${flightCheckSecondsRemaining}s)...`;
    }
    if (gamingFlightCheckBanner) {
      gamingFlightCheckBanner.style.display = 'block';
    }
    if (flightVerdictPill) {
      flightVerdictPill.className = 'status-badge badge-neutral';
      flightVerdictPill.textContent = currentLang === 'ar' ? 'جاري فحص الاستجابة والتوجيه (15 ثانية)...' : 'Auditing Connection & Routing (15s)...';
    }
    if (flightStatsLine) {
      flightStatsLine.textContent = currentLang === 'ar' ? 'جاري إرسال حزم الفحص السريع...' : 'Dispatching precision probe burst...';
    }

    // Execute rapid single probe
    async function executeFlightProbe() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 950);
      const targetConfig = GAME_SERVER_ENDPOINTS[selectedGameServerKey] || GAME_SERVER_ENDPOINTS.cf_ultra_fast;
      const probeUrl = `${targetConfig.url}${targetConfig.url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      const startTime = performance.now();

      try {
        await fetch(probeUrl, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const rtt = Math.round(performance.now() - startTime);
        flightCheckProbes.push({ rtt, lost: false });
      } catch (err) {
        clearTimeout(timeoutId);
        flightCheckProbes.push({ rtt: null, lost: true });
      }

      flightCheckSecondsRemaining--;
      if (flightCheckLabel) {
        flightCheckLabel.textContent = i18n
          ? i18n.t('flight_check_running', currentLang, { seconds: Math.max(0, flightCheckSecondsRemaining) })
          : `Auditing (${Math.max(0, flightCheckSecondsRemaining)}s)...`;
      }

      if (flightCheckSecondsRemaining <= 0) {
        clearInterval(flightCheckInterval);
        flightCheckInterval = null;
        finalizeFlightCheck();
      }
    }

    await executeFlightProbe();
    flightCheckInterval = setInterval(executeFlightProbe, 1000);
  }

  function finalizeFlightCheck() {
    flightCheckRunning = false;
    if (btnFlightCheck) {
      btnFlightCheck.disabled = false;
      btnFlightCheck.style.opacity = '1';
    }
    if (flightCheckLabel) {
      flightCheckLabel.textContent = i18n ? i18n.t('btn_flight_check', currentLang) : 'Run 15s Match Audit';
    }

    const valid = flightCheckProbes.filter(p => !p.lost && p.rtt !== null);
    const drops = flightCheckProbes.filter(p => p.lost).length;
    const rtts = valid.map(p => p.rtt);
    const minPing = rtts.length > 0 ? Math.min(...rtts) : 0;
    const maxPing = rtts.length > 0 ? Math.max(...rtts) : 0;
    const avgPing = rtts.length > 0 ? Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length) : 0;

    let jitterSum = 0;
    for (let i = 1; i < rtts.length; i++) {
      jitterSum += Math.abs(rtts[i] - rtts[i - 1]);
    }
    const avgJitter = rtts.length > 1 ? Math.round(jitterSum / (rtts.length - 1)) : 0;
    const lossPct = flightCheckProbes.length > 0 ? ((drops / flightCheckProbes.length) * 100) : 0;
    const worstDelta = latestBufferbloatData ? latestBufferbloatData.worstDelta : 0;

    const csi = evaluator
      ? evaluator.calculateCSI({ jitter: avgJitter, packetLoss: lossPct, ping: avgPing, worstDelta })
      : { score: 100 };

    if (flightVerdictPill) {
      if (drops > 0 || (maxPing - minPing) > 45 || maxPing > 120 || avgJitter > 25 || csi.score < 60) {
        flightVerdictPill.className = 'status-badge badge-rose';
        flightVerdictPill.textContent = i18n ? i18n.t('flight_verdict_red', currentLang) : 'Do Not Queue - Packet Loss or Severe Spikes Detected';
      } else if (avgJitter > 10 || maxPing > 80 || csi.score < 80) {
        flightVerdictPill.className = 'status-badge badge-amber';
        flightVerdictPill.textContent = i18n ? i18n.t('flight_verdict_yellow', currentLang) : 'Play with Caution - Moderate Jitter Detected';
      } else {
        flightVerdictPill.className = 'status-badge badge-emerald';
        flightVerdictPill.textContent = i18n ? i18n.t('flight_verdict_green', currentLang) : 'Safe to Queue - Low Jitter & Stable Routing';
      }
    }

    if (flightStatsLine) {
      flightStatsLine.textContent = i18n
        ? i18n.t('flight_stats_summary', currentLang, {
            min: minPing,
            max: maxPing,
            jitter: avgJitter,
            drops,
            csi: csi.score
          })
        : `Min: ${minPing}ms | Max: ${maxPing}ms | Jitter: ${avgJitter}ms | Drops: ${drops} | CSI: ${csi.score}%`;
    }
  }

  if (btnFlightCheck) {
    btnFlightCheck.addEventListener('click', run15sFlightCheck);
  }
  if (btnCloseFlightCheck && gamingFlightCheckBanner) {
    btnCloseFlightCheck.addEventListener('click', () => {
      gamingFlightCheckBanner.style.display = 'none';
    });
  }

  function startGamingHud() {
    if (gamingHudRunning) return;
    gamingHudRunning = true;
    updateGamingHudUi();
    runSingleGamingProbe();
    gamingHudInterval = setInterval(runSingleGamingProbe, 1000);
  }

  function pauseGamingHud() {
    if (!gamingHudRunning) return;
    gamingHudRunning = false;
    if (gamingHudInterval) {
      clearInterval(gamingHudInterval);
      gamingHudInterval = null;
    }
    updateGamingHudUi();
  }

  function toggleGamingHud() {
    if (gamingHudRunning) {
      pauseGamingHud();
    } else {
      startGamingHud();
    }
  }

  if (btnToggleGamingHud) {
    btnToggleGamingHud.addEventListener('click', toggleGamingHud);
  }

  // Handle window resizing for responsive canvas
  window.addEventListener('resize', () => {
    drawGamingSparkline();
  });

  // Expose Gaming HUD controller on window for testing & programmatic control
  window.NetPulseGamingHud = {
    start: startGamingHud,
    pause: pauseGamingHud,
    toggle: toggleGamingHud,
    runProbe: runSingleGamingProbe,
    runFlightCheck: run15sFlightCheck,
    finalizeFlightCheck: finalizeFlightCheck,
    getBufferbloat: () => latestBufferbloatData,
    resetStats: resetGamingStats,
    getHistory: () => gamingProbeHistory,
    setHistory: (arr) => { gamingProbeHistory = arr; updateGamingHudUi(); drawGamingSparkline(); },
    getEndpoints: () => GAME_SERVER_ENDPOINTS,
    getTarget: () => selectedGameServerKey,
    setTarget: (key) => {
      if (GAME_SERVER_ENDPOINTS[key]) {
        selectedGameServerKey = key;
        if (selectGameServer) selectGameServer.value = key;
        chrome.storage.local.set({ netpulse_game_probe_target: key });
        resetGamingStats();
        if (gamingHudRunning) {
          runSingleGamingProbe();
        }
      }
    },
    isRunning: () => gamingHudRunning,
    draw: drawGamingSparkline,
    updateUi: updateGamingHudUi
  };

  // Draw initial empty canvas state
  drawGamingSparkline();

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
