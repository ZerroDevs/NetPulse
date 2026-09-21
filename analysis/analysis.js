/**
 * NetPulse - Deep RF Correlation & Carrier Aggregation Studio Controller
 * Renders live multi-layer telemetry waveforms, PCI handover timeline,
 * carrier aggregation component matrix, and RF-vs-throughput scatter analysis.
 * 
 * Strict Guidelines: Zero gradients, zero emojis, pure vector SVG, flat solid colors.
 */

(function () {
  'use strict';

  let currentLang = 'en';
  let currentTheme = 'dark';
  let privacyMode = false;
  let telemetryHistory = [];
  let rfTimeline = [];
  let handoverEvents = [];
  let latestRouterMetrics = null;
  let latestRouterPayload = null;

  // DOM Elements - Top KPIs
  const kpiDominantPci = document.getElementById('kpi-dominant-pci');
  const kpiDominantPciSub = document.getElementById('kpi-dominant-pci-sub');
  const kpiPccBand = document.getElementById('kpi-pcc-band');
  const kpiPccBandSub = document.getElementById('kpi-pcc-band-sub');
  const kpiAggBw = document.getElementById('kpi-agg-bw');
  const kpiHandoverCount = document.getElementById('kpi-handover-count');
  const kpiCongestionVal = document.getElementById('kpi-congestion-val');
  const kpiR2Val = document.getElementById('kpi-r2-val');

  // DOM Elements - Waveform SVG
  const pathRsrp = document.getElementById('path-rsrp');
  const pathSinr = document.getElementById('path-sinr');
  const pathRsrq = document.getElementById('path-rsrq');
  const groupWaveformNodes = document.getElementById('group-waveform-nodes');

  // DOM Elements - Handover Radar
  const badgeHandoverStatus = document.getElementById('badge-handover-status');
  const badgeHandoverText = document.getElementById('badge-handover-text');
  const groupHandoverNodes = document.getElementById('group-handover-nodes');
  const handoverLogList = document.getElementById('handover-log-list');

  // DOM Elements - Carrier Aggregation
  const caTotalBadgeVal = document.getElementById('ca-total-badge-val');
  const caCenterCount = document.getElementById('ca-center-count');
  const caCarriersList = document.getElementById('ca-carriers-list');
  const caArcPcc = document.getElementById('ca-arc-pcc');
  const caArcScc1 = document.getElementById('ca-arc-scc1');
  const caArcScc2 = document.getElementById('ca-arc-scc2');
  const caArcScc3 = document.getElementById('ca-arc-scc3');

  // DOM Elements - Spectral Efficiency (Feature 2)
  const badgeEfficiencyStatus = document.getElementById('badge-efficiency-status');
  const badgeEfficiencyText = document.getElementById('badge-efficiency-text');
  const kpiTheoPeakDl = document.getElementById('kpi-theo-peak-dl');
  const kpiLinkEffPct = document.getElementById('kpi-link-eff-pct');
  const kpiLinkEffSub = document.getElementById('kpi-link-eff-sub');
  const kpiEffBw = document.getElementById('kpi-eff-bw');
  const kpiEffBps = document.getElementById('kpi-eff-bps');
  const effMeterLabel = document.getElementById('eff-meter-label');
  const effMeterFill = document.getElementById('eff-meter-fill');

  // DOM Elements - Scatter Matrix & Diagnostics
  const groupScatterPoints = document.getElementById('group-scatter-points');
  const diagDiagnosisBox = document.getElementById('diagnostic-diagnosis-box');
  const diagDiagnosisText = document.getElementById('diagnostic-diagnosis-text');
  const statSampleCount = document.getElementById('stat-sample-count');
  const statPearsonR = document.getElementById('stat-pearson-r');
  const statVarianceR2 = document.getElementById('stat-variance-r2');
  const statBottleneck = document.getElementById('stat-primary-bottleneck');

  // Controls & Modals
  const btnExportAudit = document.getElementById('btn-export-audit');
  const btnSyncTelemetry = document.getElementById('btn-sync-telemetry');
  const btnSyncLabel = document.getElementById('btn-sync-label');
  const btnClearAnalysis = document.getElementById('btn-clear-analysis');
  const analysisSyncTime = document.getElementById('analysis-sync-time');
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');
  const btnPrivacyToggle = document.getElementById('btn-privacy-toggle');
  const privacyToggleText = document.getElementById('privacy-toggle-text');

  const modalClearOverlay = document.getElementById('modal-clear-overlay');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');
  const toastBanner = document.getElementById('toast-banner');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  /**
   * Display temporary toast notification feedback
   */
  function showToast(msg) {
    if (!toastBanner || !toastMessage) return;
    toastMessage.textContent = msg;
    toastBanner.classList.add('active');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastBanner.classList.remove('active');
    }, 3500);
  }

  /**
   * Update Privacy Toggle Button Appearance
   */
  function updatePrivacyUi() {
    if (btnPrivacyToggle && privacyToggleText) {
      const i18n = window.NetPulseI18n;
      if (privacyMode) {
        btnPrivacyToggle.classList.add('privacy-active');
        privacyToggleText.textContent = i18n ? i18n.t('privacy_mode_on', currentLang) : 'Privacy: ON';
      } else {
        btnPrivacyToggle.classList.remove('privacy-active');
        privacyToggleText.textContent = i18n ? i18n.t('privacy_mode_off', currentLang) : 'Privacy: OFF';
      }
    }
  }

  /**
   * Load data from storage (merges router telemetry snapshots, rolling timeline, and speedtests)
   */
  async function loadData(updateSyncTime = true) {
    try {
      const storage = await chrome.storage.local.get([
        'netpulse_router_latest',
        'netpulse_history',
        'netpulse_rf_timeline',
        'netpulse_handover_events',
        'netpulse_privacy_mode',
        'netpulse_lang',
        'netpulse_theme'
      ]);

      currentLang = storage.netpulse_lang || 'en';
      currentTheme = storage.netpulse_theme || 'dark';
      privacyMode = !!storage.netpulse_privacy_mode;
      updatePrivacyUi();

      applyTheme(currentTheme);
      applyLanguage(currentLang);

      telemetryHistory = storage.netpulse_history || [];
      rfTimeline = storage.netpulse_rf_timeline || [];
      handoverEvents = storage.netpulse_handover_events || [];
      latestRouterPayload = storage.netpulse_router_latest || null;
      latestRouterMetrics = (latestRouterPayload && latestRouterPayload.metrics)
        ? latestRouterPayload.metrics
        : null;

      // Seed timeline if router metrics exist but timeline is empty
      if (latestRouterMetrics && (latestRouterMetrics.rsrp !== null || latestRouterMetrics.rssi !== null)) {
        if (rfTimeline.length === 0) {
          rfTimeline = [{
            timestamp: latestRouterPayload.timestamp || Date.now(),
            router: latestRouterMetrics
          }];
          chrome.storage.local.set({ netpulse_rf_timeline: rfTimeline });
        }
      }

      if (updateSyncTime && analysisSyncTime) {
        const now = new Date();
        analysisSyncTime.textContent = now.toTimeString().split(' ')[0];
      }

      renderAll();
    } catch (err) {
      console.error('[NetPulse Analysis] Load failed:', err);
    }
  }

  /**
   * Extract consolidated RF points from both speedtest logs and continuous router sample timeline
   */
  function getConsolidatedRfPoints() {
    const map = new Map();

    // 1. Samples from continuous router polling timeline
    rfTimeline.forEach(pt => {
      if (pt && pt.router && (pt.router.rsrp !== null || pt.router.rssi !== null)) {
        const key = Math.floor((pt.timestamp || 0) / 2000);
        map.set(key, { timestamp: pt.timestamp || Date.now(), router: pt.router });
      }
    });

    // 2. Samples from completed speedtest runs
    telemetryHistory.forEach(pt => {
      if (pt && pt.router && (pt.router.rsrp !== null || pt.router.rssi !== null)) {
        const key = Math.floor((pt.timestamp || 0) / 2000);
        map.set(key, { timestamp: pt.timestamp || Date.now(), router: pt.router, speedtest: pt.speedtest });
      }
    });

    // 3. Fallback to latest router metrics if no historical points exist
    if (map.size === 0 && latestRouterMetrics && (latestRouterMetrics.rsrp !== null || latestRouterMetrics.rssi !== null)) {
      map.set(0, { timestamp: (latestRouterPayload && latestRouterPayload.timestamp) || Date.now(), router: latestRouterMetrics });
    }

    const list = Array.from(map.values());
    list.sort((a, b) => a.timestamp - b.timestamp);
    return list;
  }

  /**
   * Full Render of all analytical components
   */
  function renderAll() {
    renderKpis();
    renderWaveforms();
    renderHandoverRadar();
    renderCarrierAggregation();
    renderSpectralEfficiency();
    renderScatterMatrix();
  }

  /**
   * 1. Render Top KPI Overview Strip
   */
  function renderKpis() {
    const rfPoints = getConsolidatedRfPoints();

    // Dominant PCI
    const pciCounts = {};
    rfPoints.forEach((item) => {
      const pci = (item.router && item.router.pci !== null && item.router.pci !== undefined) ? item.router.pci : null;
      if (pci !== null) pciCounts[pci] = (pciCounts[pci] || 0) + 1;
    });

    let dominantPci = latestRouterMetrics ? latestRouterMetrics.pci : null;
    let maxCount = 0;
    for (const p in pciCounts) {
      if (pciCounts[p] > maxCount) {
        maxCount = pciCounts[p];
        dominantPci = p;
      }
    }

    if (kpiDominantPci) {
      if (dominantPci) {
        const displayPci = privacyMode && window.NetPulseEvaluator
          ? window.NetPulseEvaluator.redactSensitiveData(dominantPci, 'pci')
          : dominantPci;
        kpiDominantPci.textContent = `PCI ${displayPci}`;
      } else {
        kpiDominantPci.textContent = '--';
      }
    }
    if (kpiDominantPciSub) {
      if (dominantPci) {
        kpiDominantPciSub.textContent = maxCount > 0 ? `${maxCount} observations` : 'Active Gateway Cell';
      } else {
        kpiDominantPciSub.textContent = currentLang === 'ar' ? 'بانتظار إشارة الموجه' : 'Awaiting telemetry';
      }
    }

    // Primary Band (PCC)
    const band = latestRouterMetrics ? latestRouterMetrics.band : (rfPoints[0] && rfPoints[0].router ? rfPoints[0].router.band : null);
    if (kpiPccBand) {
      kpiPccBand.textContent = band || '--';
    }
    if (kpiPccBandSub) {
      if (band) {
        kpiPccBandSub.textContent = band.startsWith('n') ? '5G NR SA/NSA' : 'LTE Anchor Carrier';
      } else {
        kpiPccBandSub.textContent = currentLang === 'ar' ? 'بانتظار التردد' : 'Awaiting signal';
      }
    }

    // Feature 1: Dynamic Aggregated Bandwidth
    const caInfo = window.NetPulseEvaluator
      ? window.NetPulseEvaluator.parseCarrierAggregation(latestRouterMetrics)
      : { totalDlBw: 20 };
    if (kpiAggBw) kpiAggBw.textContent = caInfo.totalDlBw;

    // Feature 3: Handover Count (Merges storage handover events + session switches)
    let sessionSwitches = 0;
    let lastSeenPci = null;
    rfPoints.forEach(item => {
      const pci = item.router ? item.router.pci : null;
      if (pci && lastSeenPci && String(pci) !== String(lastSeenPci)) {
        sessionSwitches++;
      }
      if (pci) lastSeenPci = pci;
    });

    const totalHandoverCount = Math.max(sessionSwitches, handoverEvents.length);

    if (kpiHandoverCount) {
      if (totalHandoverCount > 0) {
        kpiHandoverCount.textContent = totalHandoverCount;
      } else if (dominantPci) {
        kpiHandoverCount.textContent = currentLang === 'ar' ? '0 (مستقر)' : '0 (Stable)';
      } else {
        kpiHandoverCount.textContent = '--';
      }
    }

    // Congestion Index (% of RSRQ <= -12 dB)
    let congestedCount = 0;
    let totalWithRsrq = 0;
    rfPoints.forEach(item => {
      if (item.router && item.router.rsrq !== null) {
        totalWithRsrq++;
        if (item.router.rsrq <= -12) congestedCount++;
      }
    });

    let congestionPercent = 0;
    if (totalWithRsrq > 0) {
      congestionPercent = Math.round((congestedCount / totalWithRsrq) * 100);
    } else if (latestRouterMetrics && latestRouterMetrics.rsrq !== null) {
      const r = latestRouterMetrics.rsrq;
      congestionPercent = r <= -15 ? 100 : (r >= -9 ? 0 : Math.round(((-r - 9) / 6) * 100));
    }

    if (kpiCongestionVal) {
      if (totalWithRsrq > 0 || (latestRouterMetrics && latestRouterMetrics.rsrq !== null)) {
        kpiCongestionVal.textContent = `${congestionPercent}%`;
        kpiCongestionVal.style.color = congestionPercent > 40 ? '#f43f5e' : (congestionPercent > 20 ? '#f59e0b' : '#10b981');
      } else {
        kpiCongestionVal.textContent = '--';
        kpiCongestionVal.style.color = '#9ca3af';
      }
    }

    // Pearson Correlation R²
    const r2Score = calculateCorrelationR2();
    if (kpiR2Val) {
      kpiR2Val.textContent = r2Score !== null ? r2Score.toFixed(2) : '--';
    }
  }

  /**
   * 2. Render Real-Time Multi-Layer RF Waveforms
   */
  function renderWaveforms() {
    if (!pathRsrp || !pathSinr || !pathRsrq || !groupWaveformNodes) return;
    groupWaveformNodes.innerHTML = '';

    let items = getConsolidatedRfPoints().slice(-30);
    if (items.length === 0) {
      pathRsrp.setAttribute('d', '');
      pathSinr.setAttribute('d', '');
      pathRsrq.setAttribute('d', '');
      return;
    }

    // If only 1 sample exists, project a baseline segment across the time axis
    if (items.length === 1) {
      items = [
        items[0],
        { ...items[0], timestamp: items[0].timestamp + 1000 }
      ];
    }

    const minX = 60;
    const maxX = 970;
    const minY = 35;
    const maxY = 285;
    const stepX = items.length > 1 ? (maxX - minX) / (items.length - 1) : 0;

    // Normalizers
    const normRsrp = v => {
      const val = v !== null && v !== undefined ? Number(v) : -95;
      const clamped = Math.max(-125, Math.min(-70, val));
      return maxY - ((clamped - (-125)) / 55) * (maxY - minY);
    };

    const normSinr = v => {
      const val = v !== null && v !== undefined ? Number(v) : 10;
      const clamped = Math.max(-5, Math.min(25, val));
      return maxY - ((clamped - (-5)) / 30) * (maxY - minY);
    };

    const normRsrq = v => {
      const val = v !== null && v !== undefined ? Number(v) : -11;
      const clamped = Math.max(-20, Math.min(-5, val));
      return maxY - ((clamped - (-20)) / 15) * (maxY - minY);
    };

    let dRsrp = '';
    let dSinr = '';
    let dRsrq = '';

    items.forEach((item, idx) => {
      const x = Math.round(minX + idx * stepX);
      const r = item.router || {};
      const yRsrp = Math.round(normRsrp(r.rsrp));
      const ySinr = Math.round(normSinr(r.sinr));
      const yRsrq = Math.round(normRsrq(r.rsrq));

      const cmd = idx === 0 ? 'M' : 'L';
      dRsrp += `${cmd} ${x} ${yRsrp} `;
      dSinr += `${cmd} ${x} ${ySinr} `;
      dRsrq += `${cmd} ${x} ${yRsrq} `;

      // Data Node for RSRP
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', yRsrp);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#111827');
      circle.setAttribute('stroke', '#6366f1');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'waveform-dot');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Time: ${new Date(item.timestamp).toLocaleTimeString()} | RSRP: ${r.rsrp || '--'} dBm | SINR: ${r.sinr || '--'} dB | RSRQ: ${r.rsrq || '--'} dB`;
      circle.appendChild(title);

      groupWaveformNodes.appendChild(circle);
    });

    pathRsrp.setAttribute('d', dRsrp);
    pathSinr.setAttribute('d', dSinr);
    pathRsrq.setAttribute('d', dRsrq);
  }

  /**
   * 3. Render Cell Tower Handover & PCI Radar
   */
  function renderHandoverRadar() {
    if (!groupHandoverNodes || !handoverLogList) return;
    groupHandoverNodes.innerHTML = '';
    handoverLogList.innerHTML = '';

    const rfPoints = getConsolidatedRfPoints();
    const events = [];
    let lastPci = null;
    let lastBand = null;

    rfPoints.forEach(item => {
      const r = item.router;
      if (!r || r.pci === null || r.pci === undefined) return;
      if (lastPci !== null && String(r.pci) !== String(lastPci)) {
        events.push({
          timestamp: item.timestamp,
          fromPci: lastPci,
          toPci: r.pci,
          fromBand: lastBand || 'N/A',
          toBand: r.band || 'N/A'
        });
      }
      lastPci = r.pci;
      lastBand = r.band;
    });

    // Merge persistent background handover events if available
    if (handoverEvents && handoverEvents.length > 0) {
      handoverEvents.forEach(he => {
        if (!events.some(e => Math.abs(e.timestamp - he.timestamp) < 3000)) {
          events.push(he);
        }
      });
      events.sort((a, b) => a.timestamp - b.timestamp);
    }

    const isPingPong = events.length >= 3;

    if (badgeHandoverStatus && badgeHandoverText) {
      if (isPingPong) {
        badgeHandoverStatus.className = 'status-badge badge-rose';
        badgeHandoverText.textContent = currentLang === 'ar' ? 'تذبذب مستمر للأبراج' : 'Ping-Pong Detected';
      } else if (events.length > 0) {
        badgeHandoverStatus.className = 'status-badge badge-amber';
        badgeHandoverText.textContent = currentLang === 'ar' ? `${events.length} عمليات تبديل` : `${events.length} Handovers`;
      } else if (latestRouterMetrics && latestRouterMetrics.pci) {
        badgeHandoverStatus.className = 'status-badge badge-emerald';
        badgeHandoverText.textContent = currentLang === 'ar' ? 'إشارة مستقرة ومثبتة' : 'Signal Stable & Locked';
      } else {
        badgeHandoverStatus.className = 'status-badge badge-muted';
        badgeHandoverText.textContent = currentLang === 'ar' ? 'بانتظار الاتصال' : 'Awaiting Gateway';
      }
    }

    const redact = (val, type) => {
      return (privacyMode && window.NetPulseEvaluator)
        ? window.NetPulseEvaluator.redactSensitiveData(val, type)
        : (val !== null && val !== undefined ? val : '--');
    };

    if (events.length === 0) {
      if (latestRouterMetrics && latestRouterMetrics.pci) {
        const pciDisplay = redact(latestRouterMetrics.pci, 'pci');
        // Render current active tower on radar
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '230');
        circle.setAttribute('cy', '90');
        circle.setAttribute('r', '8');
        circle.setAttribute('fill', '#10b981');
        circle.setAttribute('stroke', '#111827');
        circle.setAttribute('stroke-width', '2');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Active Anchor: PCI ${pciDisplay} (${latestRouterMetrics.band || 'LTE/5G'})`;
        circle.appendChild(title);
        groupHandoverNodes.appendChild(circle);

        handoverLogList.innerHTML = `
          <div class="handover-log-item" style="display: flex; align-items: center; justify-content: space-between;">
            <span class="mono" style="color: #9ca3af;">${new Date().toLocaleTimeString()}</span>
            <span class="mono" style="font-weight: 700; color: #f3f4f6;">PCI ${pciDisplay} (${latestRouterMetrics.band || 'Serving Cell'})</span>
            <span class="status-badge badge-emerald" style="font-size: 10px; padding: 2px 6px;">Connected &amp; Stable</span>
          </div>
        `;
      } else {
        handoverLogList.innerHTML = `<div class="log-empty-sub mono">${currentLang === 'ar' ? 'لا توجد عمليات تبديل للأبراج مسجلة حالياً.' : 'No cell tower handovers recorded in current session.'}</div>`;
      }
      return;
    }

    // Render timeline SVG nodes
    const minX = 40;
    const maxX = 420;
    const stepX = events.length > 1 ? (maxX - minX) / (events.length - 1) : 0;

    events.forEach((ev, idx) => {
      const x = Math.round(minX + idx * stepX);
      const y = 90;
      const fromPciDisplay = redact(ev.fromPci, 'pci');
      const toPciDisplay = redact(ev.toPci, 'pci');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', isPingPong ? '#f43f5e' : '#6366f1');
      circle.setAttribute('stroke', '#111827');
      circle.setAttribute('stroke-width', '2');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${new Date(ev.timestamp).toLocaleTimeString()}: Switched PCI ${fromPciDisplay} -> PCI ${toPciDisplay}`;
      circle.appendChild(title);
      groupHandoverNodes.appendChild(circle);

      const row = document.createElement('div');
      row.className = 'handover-log-item';
      row.innerHTML = `
        <span class="mono" style="color: #9ca3af;">${new Date(ev.timestamp).toLocaleTimeString()}</span>
        <span class="mono" style="font-weight: 700; color: #f3f4f6;">PCI ${fromPciDisplay} (${ev.fromBand || 'N/A'}) &rarr; PCI ${toPciDisplay} (${ev.toBand || 'N/A'})</span>
        <span class="status-badge ${isPingPong ? 'badge-rose' : 'badge-emerald'}" style="font-size: 10px; padding: 2px 6px;">Handover</span>
      `;
      handoverLogList.appendChild(row);
    });
  }

  /**
   * 4. Render Carrier Aggregation Component Matrix (Feature 1: Dynamic Multi-Band Parsing)
   */
  function renderCarrierAggregation() {
    if (!caCarriersList) return;
    caCarriersList.innerHTML = '';

    const caInfo = window.NetPulseEvaluator
      ? window.NetPulseEvaluator.parseCarrierAggregation(latestRouterMetrics)
      : {
          carriersCount: 1,
          totalDlBw: 20,
          carriers: [{ type: 'PCC', band: 'B3', bw: 20, freq: 'LTE Primary', tagClass: 'tag-pcc' }]
        };

    const carriers = caInfo.carriers;
    const totalBw = caInfo.totalDlBw;

    if (caTotalBadgeVal) caTotalBadgeVal.textContent = totalBw;
    if (caCenterCount) caCenterCount.textContent = `${carriers.length}CA`;

    const circ = 364.4;
    let accumulatedAngle = 0;

    const arcs = [caArcPcc, caArcScc1, caArcScc2, caArcScc3];
    arcs.forEach(a => { if (a) a.style.strokeDasharray = '0 365'; });

    carriers.forEach((c, idx) => {
      if (idx < arcs.length) {
        const arc = arcs[idx];
        const sliceLen = (c.bw / (totalBw || 1)) * circ;
        if (arc) {
          arc.style.strokeDasharray = `${sliceLen} ${circ - sliceLen}`;
          arc.style.strokeDashoffset = `-${accumulatedAngle}`;
        }
        accumulatedAngle += sliceLen;
      }

      const row = document.createElement('div');
      row.className = 'carrier-row';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="carrier-tag ${c.tagClass} mono">${c.type}</span>
          <span class="carrier-meta mono">${c.band} (${c.freq})</span>
        </div>
        <span class="carrier-bw mono">+${c.bw} MHz</span>
      `;
      caCarriersList.appendChild(row);
    });
  }

  /**
   * Feature 2: Render Link Spectral Efficiency & Theoretical Capacity
   */
  function renderSpectralEfficiency() {
    const latestSpeedtest = telemetryHistory.length > 0 && telemetryHistory[0].speedtest
      ? telemetryHistory[0].speedtest
      : null;

    const eff = window.NetPulseEvaluator
      ? window.NetPulseEvaluator.computeSpectralEfficiency(latestRouterMetrics, latestSpeedtest)
      : {
          totalDlBw: 20,
          bpsPerHz: 7.8,
          theoreticalPeakMbps: 156,
          latestDlMbps: null,
          efficiencyPercent: null,
          tierGrade: 'Awaiting Speedtest',
          tierColor: '#9ca3af'
        };

    const i18n = window.NetPulseI18n;

    // Status Badge
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
      } else if (latestRouterMetrics) {
        badgeEfficiencyStatus.className = 'status-badge badge-indigo';
        badgeEfficiencyText.textContent = currentLang === 'ar' ? 'حساب فيزيائي جاهز' : 'Modulation Ready';
      } else {
        badgeEfficiencyStatus.className = 'status-badge badge-muted';
        badgeEfficiencyText.textContent = currentLang === 'ar' ? 'بانتظار الإشارة' : 'Awaiting Telemetry';
      }
    }

    if (kpiTheoPeakDl) {
      kpiTheoPeakDl.textContent = `${eff.theoreticalPeakMbps} Mbps`;
    }

    if (kpiLinkEffPct) {
      kpiLinkEffPct.textContent = eff.efficiencyPercent !== null ? `${eff.efficiencyPercent}%` : '--';
      if (eff.efficiencyPercent !== null) {
        kpiLinkEffPct.style.color = eff.tierColor;
      } else {
        kpiLinkEffPct.style.color = '#9ca3af';
      }
    }

    if (kpiLinkEffSub) {
      if (eff.efficiencyPercent !== null && eff.latestDlMbps !== null) {
        kpiLinkEffSub.textContent = currentLang === 'ar'
          ? `${eff.latestDlMbps.toFixed(1)} من ${eff.theoreticalPeakMbps} ميجابت في الثانية`
          : `${eff.latestDlMbps.toFixed(1)} of ${eff.theoreticalPeakMbps} Mbps Peak`;
      } else {
        kpiLinkEffSub.textContent = currentLang === 'ar'
          ? 'بانتظار نتيجة اختبار السرعة'
          : 'Awaiting speedtest benchmark';
      }
    }

    if (kpiEffBw) {
      kpiEffBw.textContent = `${eff.totalDlBw} MHz`;
    }

    if (kpiEffBps) {
      const qamLabel = eff.bpsPerHz >= 7.5 ? '256-QAM' : (eff.bpsPerHz >= 5.5 ? '64-QAM' : '16-QAM');
      kpiEffBps.textContent = `${eff.bpsPerHz} bps/Hz (${qamLabel})`;
    }

    if (effMeterLabel) {
      effMeterLabel.textContent = eff.efficiencyPercent !== null ? `${eff.efficiencyPercent}%` : '--%';
    }

    if (effMeterFill) {
      const pct = eff.efficiencyPercent !== null ? eff.efficiencyPercent : 0;
      effMeterFill.style.width = `${pct}%`;
      effMeterFill.style.background = eff.tierColor;
    }
  }

  /**
   * 5. Render RF vs Throughput Scatter Matrix & Diagnostic Quadrants
   */
  function renderScatterMatrix() {
    if (!groupScatterPoints) return;
    groupScatterPoints.innerHTML = '';

    const validTests = telemetryHistory.filter(item => {
      return item.speedtest && item.speedtest.downloadMbps > 0 && item.router && item.router.rsrp !== null;
    });

    if (statSampleCount) {
      statSampleCount.textContent = validTests.length > 0
        ? validTests.length
        : (latestRouterMetrics ? '0 (Live RF Ready)' : '0');
    }

    const minX = 60;
    const maxX = 930;
    const mapX = rsrp => {
      const clamped = Math.max(-125, Math.min(-70, rsrp));
      return minX + ((clamped - (-125)) / 55) * (maxX - minX);
    };

    const minY = 30;
    const maxY = 310;
    const mapY = speed => {
      const clamped = Math.max(0, Math.min(150, speed));
      return maxY - (clamped / 150) * (maxY - minY);
    };

    let countOptimal = 0;
    let countCongestion = 0;
    let countObstruction = 0;
    let countEfficient = 0;

    validTests.forEach(test => {
      const rsrp = test.router.rsrp;
      const dl = test.speedtest.downloadMbps;

      const cx = Math.round(mapX(rsrp));
      const cy = Math.round(mapY(dl));

      let dotColor = '#10b981';
      if (rsrp >= -95 && dl >= 35) {
        dotColor = '#10b981';
        countOptimal++;
      } else if (rsrp >= -95 && dl < 35) {
        dotColor = '#f59e0b';
        countCongestion++;
      } else if (rsrp < -95 && dl < 35) {
        dotColor = '#f43f5e';
        countObstruction++;
      } else {
        dotColor = '#3b82f6';
        countEfficient++;
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', dotColor);
      circle.setAttribute('stroke', '#111827');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'scatter-dot');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Test: ${dl} Mbps DL | RSRP: ${rsrp} dBm | SINR: ${test.router.sinr || '--'} dB`;
      circle.appendChild(title);

      groupScatterPoints.appendChild(circle);
    });

    // Plot Live RF Operating Point Beacon
    if (latestRouterMetrics && latestRouterMetrics.rsrp !== null) {
      const liveX = Math.round(mapX(latestRouterMetrics.rsrp));
      const liveY = validTests.length > 0 ? Math.round(mapY(validTests[0].speedtest.downloadMbps)) : 170;

      // Beacon Ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', liveX);
      ring.setAttribute('cy', liveY);
      ring.setAttribute('r', '10');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#6366f1');
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('stroke-dasharray', '3 3');
      groupScatterPoints.appendChild(ring);

      // Beacon Dot
      const beacon = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      beacon.setAttribute('cx', liveX);
      beacon.setAttribute('cy', liveY);
      beacon.setAttribute('r', '6');
      beacon.setAttribute('fill', '#6366f1');
      beacon.setAttribute('stroke', '#ffffff');
      beacon.setAttribute('stroke-width', '2');

      const bTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      bTitle.textContent = `Live RF Operating Point: RSRP ${latestRouterMetrics.rsrp} dBm | SINR ${latestRouterMetrics.sinr || '--'} dB | Band ${latestRouterMetrics.band || '--'}`;
      beacon.appendChild(bTitle);
      groupScatterPoints.appendChild(beacon);
    }

    // Update Diagnostic Diagnosis Banner
    if (diagDiagnosisBox && diagDiagnosisText) {
      if (validTests.length > 0) {
        if (countObstruction > countCongestion && countObstruction > countOptimal) {
          diagDiagnosisBox.className = 'diagnostic-banner banner-rose';
          diagDiagnosisText.textContent = currentLang === 'ar'
            ? 'رصد عائق في الإشارة: يُنصح بتغيير موضع الموجه أو توجيه الهوائي لرفع قدرة استقبال RSRP.'
            : 'Signal Obstruction Detected: Reposition router or aim external antenna to increase RSRP signal power.';
          if (statBottleneck) statBottleneck.textContent = 'RF Signal Obstruction';
        } else if (countCongestion > countOptimal && countCongestion > countObstruction) {
          diagDiagnosisBox.className = 'diagnostic-banner banner-amber';
          diagDiagnosisText.textContent = currentLang === 'ar'
            ? 'رصد ازدحام على البرج: الإشارة قوية ومستقرة، ولكن سعة شبكة البرج ممتلئة في ساعات الذروة.'
            : 'Tower Backhaul Congestion Detected: Signal is strong, but cell tower backhaul is congested.';
          if (statBottleneck) statBottleneck.textContent = 'ISP Tower Backhaul Congestion';
        } else {
          diagDiagnosisBox.className = 'diagnostic-banner banner-emerald';
          diagDiagnosisText.textContent = currentLang === 'ar'
            ? 'النظام متوازن: استقبال الإشارة وسرعة برج المزود يعملان بأعلى كفاءة.'
            : 'System Balanced: Both RF reception and ISP tower backhaul throughput are operating at peak efficiency.';
          if (statBottleneck) statBottleneck.textContent = 'None (Optimal)';
        }
      } else if (latestRouterMetrics) {
        const advice = window.NetPulseEvaluator ? window.NetPulseEvaluator.generateDiagnosticAdvice(latestRouterMetrics) : '';
        diagDiagnosisBox.className = 'diagnostic-banner banner-indigo';
        diagDiagnosisText.textContent = advice || (currentLang === 'ar'
          ? 'تم استلام بيانات التردد اللاسلكي الحية من الموجه. قم بتشغيل اختبار Speedtest لربط السرعة بقوة الإشارة.'
          : 'Live RF telemetry loaded from router. Run a Speedtest to correlate bandwidth throughput with physical RF levels.');
        if (statBottleneck) statBottleneck.textContent = latestRouterMetrics.sinr >= 13 ? 'Clean RF Channel' : 'RF Path Loss / Noise';
      } else {
        diagDiagnosisBox.className = 'diagnostic-banner banner-indigo';
        diagDiagnosisText.textContent = currentLang === 'ar'
          ? 'بانتظار اتصال الموجه أو فتح صفحة 192.168.1.1 للمزامنة التلقائية.'
          : 'Awaiting router connection or open 192.168.1.1 tab to sync telemetry.';
        if (statBottleneck) statBottleneck.textContent = 'Awaiting Telemetry';
      }
    }

    // Pearson Correlation R²
    const r2 = calculateCorrelationR2();
    if (statPearsonR) statPearsonR.textContent = r2 !== null ? Math.sqrt(r2).toFixed(3) : '--';
    if (statVarianceR2) statVarianceR2.textContent = r2 !== null ? r2.toFixed(3) : '--';
  }

  /**
   * Calculate Pearson Correlation Coefficient & R²
   */
  function calculateCorrelationR2() {
    const valid = telemetryHistory.filter(i => i.speedtest && i.speedtest.downloadMbps > 0 && i.router && i.router.rsrp !== null);
    if (valid.length < 2) return null;

    const n = valid.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    valid.forEach(item => {
      const x = item.router.rsrp;
      const y = item.speedtest.downloadMbps;
      sumX += x;
      sumY += y;
      sumXY += (x * y);
      sumX2 += (x * x);
      sumY2 += (y * y);
    });

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    if (denominator === 0) return 0;

    const r = numerator / denominator;
    return Math.max(0, Math.min(1, r * r));
  }

  /**
   * Export Analytical Audit CSV
   */
  function exportAuditCsv() {
    const rfPoints = getConsolidatedRfPoints();
    if (rfPoints.length === 0) {
      showToast(currentLang === 'ar' ? 'لا توجد بيانات متاحة للتصدير.' : 'No telemetry data available to export.');
      return;
    }

    const headers = [
      'Timestamp',
      'Date_ISO',
      'Source',
      'Download_Mbps',
      'Upload_Mbps',
      'Ping_ms',
      'Jitter_ms',
      'RSRP_dBm',
      'SINR_dB',
      'RSRQ_dB',
      'RSSI_dBm',
      'Band',
      'PCI',
      'DL_Bandwidth_MHz'
    ];

    const rows = rfPoints.map(item => {
      const st = item.speedtest || {};
      const rt = item.router || {};
      return [
        item.timestamp,
        new Date(item.timestamp).toISOString(),
        `"${item.source || (st.downloadMbps ? 'Speedtest' : 'Router')}"`,
        st.downloadMbps || '',
        st.uploadMbps || '',
        st.pingMs || '',
        st.jitterMs || '',
        rt.rsrp !== null && rt.rsrp !== undefined ? rt.rsrp : '',
        rt.sinr !== null && rt.sinr !== undefined ? rt.sinr : '',
        rt.rsrq !== null && rt.rsrq !== undefined ? rt.rsrq : '',
        rt.rssi !== null && rt.rssi !== undefined ? rt.rssi : '',
        `"${rt.band || ''}"`,
        rt.pci || '',
        rt.dlBandwidth || ''
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `NetPulse_RF_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Sync / Get Info from Dashboard, Active Router Tabs, and Open Speedtests
   */
  async function syncWithDashboard() {
    if (btnSyncLabel) {
      btnSyncLabel.textContent = currentLang === 'ar' ? 'جاري المزامنة...' : 'Syncing...';
    }

    try {
      // 1. Read latest storage first
      const settingsStorage = await chrome.storage.local.get(['netpulse_settings', 'netpulse_router_latest', 'netpulse_history', 'netpulse_rf_timeline']);
      const configuredIp = (settingsStorage.netpulse_settings && settingsStorage.netpulse_settings.gatewayIp) || '192.168.1.1';

      // 2. Query open browser tabs
      if (chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({});

        // 2a. Query Dashboard tabs to request active sync
        const dashTabs = tabs.filter(t => t.url && t.url.includes('dashboard/dashboard.html'));
        for (const dTab of dashTabs) {
          try {
            chrome.tabs.sendMessage(dTab.id, { type: 'REQUEST_DASHBOARD_SYNC' }, (res) => {
              if (res && res.router && res.router.metrics) {
                chrome.storage.local.set({ netpulse_router_latest: res.router });
              }
            });
          } catch (e) {}
        }

        // 2b. Query Router tabs and execute live scraper
        const routerTabs = tabs.filter(t => {
          if (!t.url) return false;
          try {
            const u = new URL(t.url);
            return u.hostname.startsWith('192.168.') || u.hostname.includes('router') || u.hostname === '10.0.0.1' || u.hostname.includes(configuredIp);
          } catch (e) {
            return false;
          }
        });

        for (const tab of routerTabs) {
          try {
            if (chrome.scripting && chrome.scripting.executeScript) {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['shared/evaluator.js', 'scripts/router_scraper.js']
              });
              await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                func: () => {
                  if (typeof window.__netpulse_manual_scrape === 'function') return window.__netpulse_manual_scrape();
                  if (typeof window.__netpulse_extract_now === 'function') return window.__netpulse_extract_now();
                  return null;
                }
              });
            }
            chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ROUTER_SCRAPE' }, () => {});
          } catch (e) {}
        }

        // 2c. Query Speedtest tabs
        const stTabs = tabs.filter(t => t.url && (t.url.includes('speedtest.net') || t.url.includes('fast.com')));
        for (const stTab of stTabs) {
          try {
            chrome.tabs.sendMessage(stTab.id, { type: 'TRIGGER_SPEEDTEST_SCRAPE' }, () => {});
          } catch (e) {}
        }
      }

      // 3. Settle asynchronous commits
      await new Promise(resolve => setTimeout(resolve, 350));

      // 4. Reload all data
      await loadData(true);

      // 5. Build dynamic informative toast
      let toastMsg = currentLang === 'ar' ? 'تمت المزامنة مع لوحة التحكم بنجاح.' : 'Telemetry successfully synced with Dashboard.';
      if (latestRouterMetrics && latestRouterMetrics.rsrp !== null) {
        toastMsg = currentLang === 'ar'
          ? `تمت المزامنة: إشارة ${latestRouterMetrics.rsrp} dBm | جودة ${latestRouterMetrics.sinr || '--'} dB | تردد ${latestRouterMetrics.band || '--'}`
          : `Synced: RSRP ${latestRouterMetrics.rsrp} dBm | SINR ${latestRouterMetrics.sinr || '--'} dB | Band ${latestRouterMetrics.band || '--'}`;
      } else if (telemetryHistory.length > 0) {
        toastMsg = currentLang === 'ar'
          ? `تمت المزامنة: تم تحميل ${telemetryHistory.length} سجل قياس من لوحة التحكم.`
          : `Synced: Loaded ${telemetryHistory.length} records from Dashboard.`;
      } else {
        toastMsg = currentLang === 'ar'
          ? 'تمت المزامنة. بانتظار اتصال الموجه أو فتح صفحة 192.168.1.1'
          : 'Synced with Dashboard. Awaiting router telemetry or open 192.168.1.1 tab.';
      }
      showToast(toastMsg);
    } catch (err) {
      console.error('[NetPulse Analysis] Manual sync error:', err);
      await loadData(true);
      showToast(currentLang === 'ar' ? 'اكتملت المزامنة.' : 'Sync completed.');
    } finally {
      if (btnSyncLabel) {
        btnSyncLabel.textContent = window.NetPulseI18n
          ? window.NetPulseI18n.t('btn_sync_telemetry', currentLang)
          : 'Sync with Dashboard';
      }
    }
  }

  /* ==========================================================================
     CLEAR HISTORY MODAL WORKFLOW
     ========================================================================== */
  function openClearModal() {
    if (modalClearOverlay) modalClearOverlay.classList.add('active');
  }

  function closeClearModal() {
    if (modalClearOverlay) modalClearOverlay.classList.remove('active');
  }

  if (btnModalCancel) btnModalCancel.addEventListener('click', closeClearModal);
  if (modalClearOverlay) {
    modalClearOverlay.addEventListener('click', (e) => {
      if (e.target === modalClearOverlay) closeClearModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalClearOverlay && modalClearOverlay.classList.contains('active')) {
      closeClearModal();
    }
  });

  /**
   * Execute permanent clearing of analytical telemetry
   */
  async function executeClearAnalysis() {
    closeClearModal();

    try {
      await chrome.storage.local.set({
        netpulse_history: [],
        netpulse_rf_timeline: [],
        netpulse_router_latest: {
          timestamp: Date.now(),
          status: 'waiting',
          source: 'cleared',
          metrics: null
        }
      });

      telemetryHistory = [];
      rfTimeline = [];
      latestRouterMetrics = null;
      latestRouterPayload = null;
      renderAll();

      if (analysisSyncTime) {
        analysisSyncTime.textContent = '--:--:--';
      }

      showToast(window.NetPulseI18n
        ? window.NetPulseI18n.t('toast_analysis_cleared', currentLang)
        : 'All analytical telemetry records have been cleared.');
    } catch (err) {
      console.error('[NetPulse Analysis] Clear failed:', err);
    }
  }

  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', executeClearAnalysis);
  }

  /**
   * Apply Theme
   */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (themeLabelText) {
      themeLabelText.textContent = theme === 'light' ? 'Dark' : 'Light';
    }
  }

  /**
   * Apply Language
   */
  function applyLanguage(lang) {
    currentLang = lang;
    if (window.NetPulseI18n) {
      window.NetPulseI18n.applyLanguage(lang, document);
    }
    if (langToggleText) {
      langToggleText.textContent = lang === 'ar' ? 'English' : 'العربية';
    }
  }

  // --- Event Listeners ---
  if (btnExportAudit) btnExportAudit.addEventListener('click', exportAuditCsv);
  if (btnSyncTelemetry) btnSyncTelemetry.addEventListener('click', syncWithDashboard);
  if (btnClearAnalysis) btnClearAnalysis.addEventListener('click', openClearModal);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', async () => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      await chrome.storage.local.set({ netpulse_theme: nextTheme });
    });
  }

  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', async () => {
      const nextLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(nextLang);
      await chrome.storage.local.set({ netpulse_lang: nextLang });
    });
  }

  if (btnPrivacyToggle) {
    btnPrivacyToggle.addEventListener('click', async () => {
      privacyMode = !privacyMode;
      await chrome.storage.local.set({ netpulse_privacy_mode: privacyMode });
      updatePrivacyUi();
      renderAll();
      const i18n = window.NetPulseI18n;
      showToast(privacyMode
        ? (i18n ? i18n.t('toast_privacy_enabled', currentLang) : 'Privacy Mode Enabled.')
        : (i18n ? i18n.t('toast_privacy_disabled', currentLang) : 'Privacy Mode Disabled.'));
    });
  }

  // Live Storage Event Listener (instant sync upon new telemetry or speedtest)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.netpulse_history || changes.netpulse_router_latest || changes.netpulse_rf_timeline || changes.netpulse_handover_events || changes.netpulse_privacy_mode) {
        loadData(true);
      }
    }
  });

  // Background Auto-Sync Polling Interval (every 3 seconds)
  setInterval(() => {
    loadData(true);
  }, 3000);

  // Init
  loadData(true);
})();
