/**
 * NetPulse - Speedtest Controller & Runner Script
 * Upgraded Semi-Circular Speedometer Gauge Engine (Speedtest.net style)
 * Strict Guidelines: ZERO GRADIENTS, solid matte colors, zero emojis, full LTR/RTL compliance.
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

  const speedometerCanvas = document.getElementById('speedometer-canvas');
  const gaugePhasePill = document.getElementById('gauge-phase-pill');
  const gaugePhaseIconWrap = document.getElementById('gauge-phase-icon-wrap');
  const focusLabel = document.getElementById('focus-metric-label');
  const focusValue = document.getElementById('focus-metric-value');
  const focusUnit = document.getElementById('focus-metric-unit');

  const cardPing = document.getElementById('card-kpi-ping');
  const cardJitter = document.getElementById('card-kpi-jitter');
  const cardDl = document.getElementById('card-kpi-dl');
  const cardUl = document.getElementById('card-kpi-ul');

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
  const previewUlLoaded = document.getElementById('preview-ul-loaded');

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
     GAUGE ENGINE & PIECEWISE NON-LINEAR SCALE
     ========================================================================== */
  const START_ANGLE = (150 * Math.PI) / 180; // 150 deg (2.618 rad)
  const TOTAL_ANGLE = (240 * Math.PI) / 180; // 240 deg (4.189 rad)
  const END_ANGLE = START_ANGLE + TOTAL_ANGLE; // 390 deg (6.807 rad)

  const SCALE_POINTS = [
    { speed: 0, label: '0', frac: 0.00 },
    { speed: 5, label: '5', frac: 0.10 },
    { speed: 10, label: '10', frac: 0.22 },
    { speed: 50, label: '50', frac: 0.40 },
    { speed: 100, label: '100', frac: 0.56 },
    { speed: 250, label: '250', frac: 0.72 },
    { speed: 500, label: '500', frac: 0.86 },
    { speed: 1000, label: '1k', frac: 1.00 }
  ];

  const SVG_ICONS = {
    dl: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>',
    ul: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
    ping: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 0-14.14 0"></path><path d="M4.93 19.07a10 10 0 0 0 14.14 0"></path></svg>',
    complete: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    idle: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>'
  };

  let currentPhase = 'idle'; // 'idle', 'ping', 'download', 'upload', 'completed'
  let targetFrac = 0.0;
  let currentFrac = 0.0;
  let gaugeAnimId = null;

  function speedToFraction(speed) {
    if (!speed || speed <= 0) return 0;
    if (speed >= 1000) return 1.0;
    for (let i = 0; i < SCALE_POINTS.length - 1; i++) {
      const p1 = SCALE_POINTS[i];
      const p2 = SCALE_POINTS[i + 1];
      if (speed >= p1.speed && speed <= p2.speed) {
        const segT = (speed - p1.speed) / (p2.speed - p1.speed);
        return p1.frac + segT * (p2.frac - p1.frac);
      }
    }
    return 1.0;
  }

  function resizeCanvas() {
    if (!speedometerCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = speedometerCanvas.getBoundingClientRect();
    const w = rect.width || 460;
    const h = rect.height || 290;

    speedometerCanvas.width = Math.round(w * dpr);
    speedometerCanvas.height = Math.round(h * dpr);
    const ctx = speedometerCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function drawGauge() {
    if (!speedometerCanvas) return;
    const rect = speedometerCanvas.getBoundingClientRect();
    const w = rect.width || 460;
    const h = rect.height || 290;
    const ctx = speedometerCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h * 0.72;
    const radius = Math.min(cx - 32, cy - 22);

    const isDark = currentTheme === 'dark';
    const trackColor = isDark ? '#1f2937' : '#e2e8f0';
    const majorTickColor = isDark ? '#4b5563' : '#94a3b8';
    const minorTickColor = isDark ? '#374151' : '#cbd5e1';
    const tickTextColor = isDark ? '#9ca3af' : '#64748b';
    const needleColor = isDark ? '#f3f4f6' : '#1e293b';
    const hubBg = isDark ? '#111827' : '#ffffff';
    const hubBorder = isDark ? '#374151' : '#cbd5e1';

    let activeColor = '#10b981'; // Solid Emerald
    if (currentPhase === 'ping') activeColor = '#f59e0b'; // Solid Amber
    else if (currentPhase === 'download') activeColor = '#10b981'; // Solid Emerald
    else if (currentPhase === 'upload') activeColor = '#3b82f6'; // Solid Blue
    else if (currentPhase === 'completed') activeColor = '#10b981';

    // 1. Base Track Arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, START_ANGLE, END_ANGLE, false);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Active Dynamic Arc
    if (currentFrac > 0.002) {
      const activeEnd = START_ANGLE + (currentFrac * TOTAL_ANGLE);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, START_ANGLE, activeEnd, false);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // 3. Minor Sub-Ticks
    const numSubTicks = 36;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = minorTickColor;
    for (let i = 0; i <= numSubTicks; i++) {
      const t = i / numSubTicks;
      const angle = START_ANGLE + (t * TOTAL_ANGLE);
      const rInner = radius + 9;
      const rOuter = radius + 15;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cx + rInner * cosA, cy + rInner * sinA);
      ctx.lineTo(cx + rOuter * cosA, cy + rOuter * sinA);
      ctx.stroke();
    }

    // 4. Major Ticks & Non-Linear Scale Labels
    ctx.font = '600 11px "JetBrains Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < SCALE_POINTS.length; i++) {
      const pt = SCALE_POINTS[i];
      const angle = START_ANGLE + (pt.frac * TOTAL_ANGLE);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Major tick mark
      const rInner = radius + 8;
      const rOuter = radius + 18;
      ctx.beginPath();
      ctx.moveTo(cx + rInner * cosA, cy + rInner * sinA);
      ctx.lineTo(cx + rOuter * cosA, cy + rOuter * sinA);
      ctx.strokeStyle = (pt.frac <= currentFrac && currentFrac > 0.01) ? activeColor : majorTickColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label
      const rLabel = radius + 30;
      const lx = cx + rLabel * cosA;
      const ly = cy + rLabel * sinA;
      ctx.fillStyle = (pt.frac <= currentFrac && currentFrac > 0.01) ? activeColor : tickTextColor;
      ctx.fillText(pt.label, lx, ly);
    }

    // 5. Tapered Needle Pointer
    const needleAngle = START_ANGLE + (currentFrac * TOTAL_ANGLE);
    const needleLength = radius - 16;
    const tailLength = 14;
    const needleCos = Math.cos(needleAngle);
    const needleSin = Math.sin(needleAngle);
    const normCos = Math.cos(needleAngle + Math.PI / 2);
    const normSin = Math.sin(needleAngle + Math.PI / 2);

    ctx.save();
    ctx.beginPath();
    // Tip
    ctx.moveTo(cx + needleLength * needleCos, cy + needleLength * needleSin);
    // Right flank
    ctx.lineTo(cx + 3 * normCos - tailLength * 0.4 * needleCos, cy + 3 * normSin - tailLength * 0.4 * needleSin);
    // Tail
    ctx.lineTo(cx - tailLength * needleCos, cy - tailLength * needleSin);
    // Left flank
    ctx.lineTo(cx - 3 * normCos - tailLength * 0.4 * needleCos, cy - 3 * normSin - tailLength * 0.4 * needleSin);
    ctx.closePath();
    ctx.fillStyle = needleColor;
    ctx.fill();

    // Center Hub Outer Ring
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = hubBg;
    ctx.fill();
    ctx.strokeStyle = hubBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center Hub Inner Pin
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.fill();

    ctx.restore();
  }

  function startGaugeAnimationLoop() {
    if (gaugeAnimId) cancelAnimationFrame(gaugeAnimId);

    function frame() {
      const diff = targetFrac - currentFrac;
      if (Math.abs(diff) > 0.0005) {
        currentFrac += diff * 0.12; // Smooth cubic-like inertia
      } else {
        currentFrac = targetFrac;
      }

      drawGauge();
      gaugeAnimId = requestAnimationFrame(frame);
    }

    gaugeAnimId = requestAnimationFrame(frame);
  }

  function setGaugePhase(phase, speedVal, unitVal) {
    currentPhase = phase;
    const isAr = currentLang === 'ar';
    const i18n = window.NetPulseI18n;

    // Reset card highlight classes
    if (cardPing) cardPing.classList.remove('kpi-card-active-ping');
    if (cardDl) cardDl.classList.remove('kpi-card-active-dl');
    if (cardUl) cardUl.classList.remove('kpi-card-active-ul');

    if (gaugePhasePill) {
      gaugePhasePill.className = 'gauge-phase-pill';
    }

    if (phase === 'ping') {
      if (gaugePhasePill) gaugePhasePill.classList.add('phase-pill-ping');
      if (gaugePhaseIconWrap) gaugePhaseIconWrap.innerHTML = SVG_ICONS.ping;
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_idle_latency', currentLang) : 'PING / RTT';
      if (cardPing) cardPing.classList.add('kpi-card-active-ping');
      targetFrac = 0.05; // Gentle live radar indicator
    } else if (phase === 'download') {
      if (gaugePhasePill) gaugePhasePill.classList.add('phase-pill-dl');
      if (gaugePhaseIconWrap) gaugePhaseIconWrap.innerHTML = SVG_ICONS.dl;
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_dl_throughput', currentLang) : 'DOWNLOAD SPEED';
      if (cardDl) cardDl.classList.add('kpi-card-active-dl');
      targetFrac = speedToFraction(speedVal);
    } else if (phase === 'upload') {
      if (gaugePhasePill) gaugePhasePill.classList.add('phase-pill-ul');
      if (gaugePhaseIconWrap) gaugePhaseIconWrap.innerHTML = SVG_ICONS.ul;
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_ul_throughput', currentLang) : 'UPLOAD SPEED';
      if (cardUl) cardUl.classList.add('kpi-card-active-ul');
      targetFrac = speedToFraction(speedVal);
    } else if (phase === 'completed') {
      if (gaugePhasePill) gaugePhasePill.classList.add('phase-pill-done');
      if (gaugePhaseIconWrap) gaugePhaseIconWrap.innerHTML = SVG_ICONS.complete;
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_dl_throughput', currentLang) : 'DOWNLOAD SPEED';
      targetFrac = 0; // Smoothly glide needle to rest
    } else {
      if (gaugePhasePill) gaugePhasePill.classList.add('phase-pill-idle');
      if (gaugePhaseIconWrap) gaugePhaseIconWrap.innerHTML = SVG_ICONS.idle;
      if (focusLabel) focusLabel.textContent = i18n ? i18n.t('speedtest_dl_throughput', currentLang) : 'DOWNLOAD SPEED';
      targetFrac = 0;
    }

    if (focusValue && speedVal !== undefined) {
      focusValue.textContent = typeof speedVal === 'number' ? speedVal.toFixed(1) : speedVal;
    }
    if (focusUnit && unitVal !== undefined) {
      focusUnit.textContent = unitVal;
    }
  }

  /* ==========================================================================
     INITIALIZATION & STORAGE SYNC
     ========================================================================== */
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

      resizeCanvas();
      startGaugeAnimationLoop();
      setGaugePhase('idle', '0.0', 'Mbps');

      setupListeners();
    } catch (err) {
      console.error('[NetPulse Speedtest] Init error:', err);
    }
  }

  function setupListeners() {
    if (btnStart) btnStart.addEventListener('click', startSpeedtest);
    if (btnAbort) btnAbort.addEventListener('click', abortSpeedtest);

    window.addEventListener('resize', () => {
      resizeCanvas();
      drawGauge();
    });

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
     ========================================================================== */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    drawGauge();
  }

  function applyLanguage(lang) {
    currentLang = lang;
    if (window.NetPulseI18n) {
      window.NetPulseI18n.applyLanguage(lang, document);
    }
    if (langToggleText) {
      langToggleText.textContent = lang === 'en' ? 'العربية' : 'English';
    }
    drawGauge();
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
     ========================================================================== */
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
     ========================================================================== */
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

    if (previewBbGrade) {
      previewBbGrade.textContent = '--';
      previewBbGrade.style.color = '';
      previewBbGrade.style.borderColor = '';
    }
    if (previewCsiScore) {
      previewCsiScore.textContent = '--';
      previewCsiScore.style.color = '';
    }
    if (previewDlLoaded) previewDlLoaded.textContent = '--';
    if (previewUlLoaded) previewUlLoaded.textContent = '--';

    setGaugePhase('ping', '--', 'ms');

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

    setGaugePhase('idle', '0.0', 'Mbps');
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

    // Update numbers on KPI cards
    if (results.pingMs > 0 && statPing) statPing.textContent = results.pingMs;
    if (results.jitterMs > 0 && statJitter) statJitter.textContent = results.jitterMs;
    if (results.downloadMbps > 0 && statDl) statDl.textContent = results.downloadMbps.toFixed(1);
    if (results.uploadMbps > 0 && statUl) statUl.textContent = results.uploadMbps.toFixed(1);

    // Update Speedometer Gauge & Center HUD
    if (phase === 'ping') {
      setGaugePhase('ping', results.pingMs || '--', 'ms');
    } else if (phase === 'download') {
      setGaugePhase('download', results.downloadMbps, 'Mbps');
    } else if (phase === 'upload') {
      setGaugePhase('upload', results.uploadMbps, 'Mbps');
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

    setGaugePhase('completed', results.downloadMbps, 'Mbps');

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

    if (previewDlLoaded) {
      if (results.downloadLoadedPing) {
        const dlDelta = Math.max(0, results.downloadLoadedPing - (results.pingMs || 0));
        previewDlLoaded.textContent = `${results.downloadLoadedPing} ms (+${dlDelta} ms)`;
      } else {
        previewDlLoaded.textContent = results.pingMs ? `${results.pingMs} ms (+0 ms)` : '--';
      }
    }

    if (previewUlLoaded) {
      if (results.uploadLoadedPing) {
        const ulDelta = Math.max(0, results.uploadLoadedPing - (results.pingMs || 0));
        previewUlLoaded.textContent = `${results.uploadLoadedPing} ms (+${ulDelta} ms)`;
      } else {
        previewUlLoaded.textContent = results.pingMs ? `${results.pingMs} ms (+0 ms)` : '--';
      }
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

    setGaugePhase('idle', '0.0', 'Mbps');
    showToast(currentLang === 'ar' ? 'فشل فحص السرعة. تأكد من اتصال الإنترنت.' : 'Speedtest failed. Verify internet connectivity.');
  }

  // Kickoff on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

