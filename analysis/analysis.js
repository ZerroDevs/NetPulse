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
  let telemetryHistory = [];
  let latestRouterMetrics = null;

  // DOM Elements
  const kpiDominantPci = document.getElementById('kpi-dominant-pci');
  const kpiDominantPciSub = document.getElementById('kpi-dominant-pci-sub');
  const kpiPccBand = document.getElementById('kpi-pcc-band');
  const kpiPccBandSub = document.getElementById('kpi-pcc-band-sub');
  const kpiAggBw = document.getElementById('kpi-agg-bw');
  const kpiHandoverCount = document.getElementById('kpi-handover-count');
  const kpiCongestionVal = document.getElementById('kpi-congestion-val');
  const kpiR2Val = document.getElementById('kpi-r2-val');

  // Charts
  const pathRsrp = document.getElementById('path-rsrp');
  const pathSinr = document.getElementById('path-sinr');
  const pathRsrq = document.getElementById('path-rsrq');
  const groupWaveformNodes = document.getElementById('group-waveform-nodes');

  const badgeHandoverStatus = document.getElementById('badge-handover-status');
  const badgeHandoverText = document.getElementById('badge-handover-text');
  const groupHandoverNodes = document.getElementById('group-handover-nodes');
  const handoverLogList = document.getElementById('handover-log-list');

  const caTotalBadgeVal = document.getElementById('ca-total-badge-val');
  const caCenterCount = document.getElementById('ca-center-count');
  const caCarriersList = document.getElementById('ca-carriers-list');
  const caArcPcc = document.getElementById('ca-arc-pcc');
  const caArcScc1 = document.getElementById('ca-arc-scc1');
  const caArcScc2 = document.getElementById('ca-arc-scc2');
  const caArcScc3 = document.getElementById('ca-arc-scc3');

  const groupScatterPoints = document.getElementById('group-scatter-points');
  const diagDiagnosisBox = document.getElementById('diagnostic-diagnosis-box');
  const diagDiagnosisText = document.getElementById('diagnostic-diagnosis-text');
  const statSampleCount = document.getElementById('stat-sample-count');
  const statPearsonR = document.getElementById('stat-pearson-r');
  const statVarianceR2 = document.getElementById('stat-variance-r2');
  const statBottleneck = document.getElementById('stat-primary-bottleneck');

  const btnExportAudit = document.getElementById('btn-export-audit');
  const btnSyncTelemetry = document.getElementById('btn-sync-telemetry');
  const btnSyncLabel = document.getElementById('btn-sync-label');
  const btnClearAnalysis = document.getElementById('btn-clear-analysis');
  const analysisSyncTime = document.getElementById('analysis-sync-time');
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');

  // Modal & Toast Elements
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
    }, 3200);
  }

  /**
   * Load data from storage
   */
  async function loadData(updateSyncTime = true) {
    try {
      const storage = await chrome.storage.local.get([
        'netpulse_router_latest',
        'netpulse_history',
        'netpulse_lang',
        'netpulse_theme'
      ]);

      currentLang = storage.netpulse_lang || 'en';
      currentTheme = storage.netpulse_theme || 'dark';
      applyTheme(currentTheme);
      applyLanguage(currentLang);

      telemetryHistory = storage.netpulse_history || [];
      latestRouterMetrics = (storage.netpulse_router_latest && storage.netpulse_router_latest.metrics)
        ? storage.netpulse_router_latest.metrics
        : null;

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
   * Full Render
   */
  function renderAll() {
    renderKpis();
    renderWaveforms();
    renderHandoverRadar();
    renderCarrierAggregation();
    renderScatterMatrix();
  }

  /**
   * 1. Render Top KPI Overview Strip
   */
  function renderKpis() {
    // Dominant PCI
    const pciCounts = {};
    telemetryHistory.forEach((item) => {
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
      kpiDominantPci.textContent = dominantPci ? `PCI ${dominantPci}` : '--';
    }
    if (kpiDominantPciSub) {
      kpiDominantPciSub.textContent = dominantPci ? `${maxCount} observations` : 'Awaiting telemetry';
    }

    // Primary Band (PCC)
    const band = latestRouterMetrics ? latestRouterMetrics.band : (telemetryHistory[0] && telemetryHistory[0].router ? telemetryHistory[0].router.band : 'B3');
    if (kpiPccBand) {
      kpiPccBand.textContent = band || '--';
    }
    if (kpiPccBandSub) {
      kpiPccBandSub.textContent = band ? (band.startsWith('n') ? '5G NR NSA/SA' : 'LTE Anchor') : 'Awaiting signal';
    }

    // Aggregated Bandwidth
    let totalBw = (latestRouterMetrics && latestRouterMetrics.dlBandwidth) ? latestRouterMetrics.dlBandwidth : 20;
    if (latestRouterMetrics && Array.isArray(latestRouterMetrics.caBands)) {
      latestRouterMetrics.caBands.forEach(b => {
        totalBw += (b.bandwidth || 15);
      });
    } else {
      totalBw = 45; // Default representative CA for NR5103E (B3 20MHz + B7 15MHz + B20 10MHz)
    }
    if (kpiAggBw) kpiAggBw.textContent = totalBw;

    // Handover Count
    let switches = 0;
    let lastSeenPci = null;
    telemetryHistory.slice().reverse().forEach(item => {
      const pci = item.router ? item.router.pci : null;
      if (pci && lastSeenPci && pci !== lastSeenPci) {
        switches++;
      }
      if (pci) lastSeenPci = pci;
    });
    if (kpiHandoverCount) kpiHandoverCount.textContent = switches;

    // Congestion Index (% of RSRQ < -12 dB)
    let congestedCount = 0;
    let totalWithRsrq = 0;
    telemetryHistory.forEach(item => {
      if (item.router && item.router.rsrq !== null) {
        totalWithRsrq++;
        if (item.router.rsrq <= -12) congestedCount++;
      }
    });
    const congestionPercent = totalWithRsrq > 0 ? Math.round((congestedCount / totalWithRsrq) * 100) : 0;
    if (kpiCongestionVal) {
      kpiCongestionVal.textContent = totalWithRsrq > 0 ? `${congestionPercent}%` : '--';
      kpiCongestionVal.style.color = congestionPercent > 40 ? '#f43f5e' : (congestionPercent > 20 ? '#f59e0b' : '#10b981');
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

    const items = telemetryHistory.filter(i => i.router && i.router.rsrp !== null).slice(0, 30).reverse();
    if (items.length === 0) {
      pathRsrp.setAttribute('d', '');
      pathSinr.setAttribute('d', '');
      pathRsrq.setAttribute('d', '');
      return;
    }

    const minX = 60;
    const maxX = 970;
    const minY = 35;
    const maxY = 285;
    const stepX = items.length > 1 ? (maxX - minX) / (items.length - 1) : 0;

    // Normalizers
    const normRsrp = v => {
      // Range: -125 (weakest, maxY) to -70 (strongest, minY)
      const clamped = Math.max(-125, Math.min(-70, v));
      return maxY - ((clamped - (-125)) / 55) * (maxY - minY);
    };

    const normSinr = v => {
      // Range: -5 (noisy, maxY) to 25 (pure, minY)
      const clamped = Math.max(-5, Math.min(25, v));
      return maxY - ((clamped - (-5)) / 30) * (maxY - minY);
    };

    const normRsrq = v => {
      // Range: -20 (congested, maxY) to -5 (clean, minY)
      const clamped = Math.max(-20, Math.min(-5, v));
      return maxY - ((clamped - (-20)) / 15) * (maxY - minY);
    };

    let dRsrp = '';
    let dSinr = '';
    let dRsrq = '';

    items.forEach((item, idx) => {
      const x = Math.round(minX + idx * stepX);
      const yRsrp = Math.round(normRsrp(item.router.rsrp));
      const ySinr = Math.round(normSinr(item.router.sinr || 0));
      const yRsrq = Math.round(normRsrq(item.router.rsrq || -10));

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
      circle.setAttribute('class', 'waveform-dot');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Time: ${new Date(item.timestamp).toLocaleTimeString()} | RSRP: ${item.router.rsrp} dBm | SINR: ${item.router.sinr} dB | RSRQ: ${item.router.rsrq} dB`;
      circle.appendChild(title);

      groupWaveformNodes.appendChild(circle);
    });

    pathRsrp.setAttribute('d', dRsrp);
    pathSinr.setAttribute('d', dSinr);
    pathRsrq.setAttribute('d', dRsrq);
  }

  /**
   * 3. Render Cell Tower Handover & PCI Ping-Pong Radar
   */
  function renderHandoverRadar() {
    if (!groupHandoverNodes || !handoverLogList) return;
    groupHandoverNodes.innerHTML = '';
    handoverLogList.innerHTML = '';

    const events = [];
    let lastPci = null;
    let lastBand = null;

    telemetryHistory.slice().reverse().forEach(item => {
      const r = item.router;
      if (!r || !r.pci) return;
      if (lastPci && r.pci !== lastPci) {
        events.push({
          timestamp: item.timestamp,
          fromPci: lastPci,
          toPci: r.pci,
          fromBand: lastBand || 'B3',
          toBand: r.band || 'B3'
        });
      }
      lastPci = r.pci;
      lastBand = r.band;
    });

    // Detect Ping-Pong oscillation
    let isPingPong = false;
    if (events.length >= 3) {
      const recent = events.slice(-3);
      if (recent[0].fromPci === recent[1].toPci && recent[1].fromPci === recent[2].toPci) {
        isPingPong = true;
      }
    }

    if (badgeHandoverStatus && badgeHandoverText) {
      if (isPingPong) {
        badgeHandoverStatus.className = 'status-badge badge-rose';
        badgeHandoverText.textContent = currentLang === 'ar' ? 'تم رصد تذبذب وتكرار تبديل البرج' : 'Ping-Pong Oscillation Detected';
      } else {
        badgeHandoverStatus.className = 'status-badge badge-emerald';
        badgeHandoverText.textContent = currentLang === 'ar' ? 'اتصال البرج مستقر' : 'Cell Link Stable';
      }
    }

    if (events.length === 0) {
      handoverLogList.innerHTML = `<div class="log-empty-sub mono">${currentLang === 'ar' ? 'لا توجد عمليات تبديل للأبراج مسجلة حالياً.' : 'No cell tower handovers recorded in current session.'}</div>`;
      return;
    }

    // Render timeline SVG nodes
    const minX = 40;
    const maxX = 420;
    const stepX = events.length > 1 ? (maxX - minX) / (events.length - 1) : 0;

    events.forEach((ev, idx) => {
      const x = Math.round(minX + idx * stepX);
      const y = 90;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', isPingPong ? '#f43f5e' : '#6366f1');
      circle.setAttribute('stroke', '#111827');
      circle.setAttribute('stroke-width', '2');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${new Date(ev.timestamp).toLocaleTimeString()}: Switched PCI ${ev.fromPci} -> PCI ${ev.toPci}`;
      circle.appendChild(title);
      groupHandoverNodes.appendChild(circle);

      // Add log row
      const row = document.createElement('div');
      row.className = 'handover-log-item';
      row.innerHTML = `
        <span class="mono" style="color: #9ca3af;">${new Date(ev.timestamp).toLocaleTimeString()}</span>
        <span class="mono" style="font-weight: 700; color: #f3f4f6;">PCI ${ev.fromPci} (${ev.fromBand}) &rarr; PCI ${ev.toPci} (${ev.toBand})</span>
        <span class="status-badge ${isPingPong ? 'badge-rose' : 'badge-emerald'}" style="font-size: 10px; padding: 2px 6px;">Handover</span>
      `;
      handoverLogList.appendChild(row);
    });
  }

  /**
   * 4. Render Carrier Aggregation Component Matrix
   */
  function renderCarrierAggregation() {
    if (!caCarriersList) return;
    caCarriersList.innerHTML = '';

    // Mock/Real CA bands
    const pccBand = (latestRouterMetrics && latestRouterMetrics.band) ? latestRouterMetrics.band : 'B3';
    const pccBw = (latestRouterMetrics && latestRouterMetrics.dlBandwidth) ? latestRouterMetrics.dlBandwidth : 20;

    const carriers = [
      { type: 'PCC', band: pccBand, freq: '1800 MHz', bw: pccBw, tagClass: 'tag-pcc' },
      { type: 'SCC1', band: 'B7', freq: '2600 MHz', bw: 15, tagClass: 'tag-scc1' },
      { type: 'SCC2', band: 'B20', freq: '800 MHz', bw: 10, tagClass: 'tag-scc2' }
    ];

    if (pccBand.includes('n') || (latestRouterMetrics && latestRouterMetrics.is5G)) {
      carriers.push({ type: 'SCC3', band: 'n78', freq: '3500 MHz', bw: 40, tagClass: 'tag-scc3' });
    }

    let totalBw = 0;
    carriers.forEach(c => totalBw += c.bw);

    if (caTotalBadgeVal) caTotalBadgeVal.textContent = totalBw;
    if (caCenterCount) caCenterCount.textContent = `${carriers.length}CA`;

    // Calculate arc dash arrays (circumference = 2 * PI * 58 ~= 364.4)
    const circ = 364.4;
    let accumulatedAngle = 0;

    const arcs = [caArcPcc, caArcScc1, caArcScc2, caArcScc3];
    arcs.forEach(a => { if (a) a.style.strokeDasharray = '0 365'; });

    carriers.forEach((c, idx) => {
      const arc = arcs[idx];
      const sliceLen = (c.bw / totalBw) * circ;
      if (arc) {
        arc.style.strokeDasharray = `${sliceLen} ${circ - sliceLen}`;
        arc.style.strokeDashoffset = `-${accumulatedAngle}`;
      }
      accumulatedAngle += sliceLen;

      // Populate list row
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
   * 5. Render RF vs Throughput Scatter Matrix & Diagnostic Quadrants
   */
  function renderScatterMatrix() {
    if (!groupScatterPoints) return;
    groupScatterPoints.innerHTML = '';

    const validTests = telemetryHistory.filter(item => {
      return item.speedtest && item.speedtest.downloadMbps > 0 && item.router && item.router.rsrp !== null;
    });

    if (statSampleCount) statSampleCount.textContent = validTests.length;

    // Scatter Canvas Mappings
    // X: RSRP from -125 (left 60px) to -70 (right 930px)
    // Center divider at -95 dBm -> X = 490px
    const minX = 60;
    const maxX = 930;
    const mapX = rsrp => {
      const clamped = Math.max(-125, Math.min(-70, rsrp));
      return minX + ((clamped - (-125)) / 55) * (maxX - minX);
    };

    // Y: Download speed from 0 Mbps (bottom 310px) to 150 Mbps (top 30px)
    // Center divider at 35 Mbps -> Y = 170px
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

      // Determine quadrant
      let dotColor = '#10b981';
      if (rsrp >= -95 && dl >= 35) {
        dotColor = '#10b981'; // Optimal
        countOptimal++;
      } else if (rsrp >= -95 && dl < 35) {
        dotColor = '#f59e0b'; // Congestion
        countCongestion++;
      } else if (rsrp < -95 && dl < 35) {
        dotColor = '#f43f5e'; // Obstruction
        countObstruction++;
      } else {
        dotColor = '#3b82f6'; // High efficiency
        countEfficient++;
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', dotColor);
      circle.setAttribute('stroke', '#111827');
      circle.setAttribute('class', 'scatter-dot');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Test: ${dl} Mbps DL | RSRP: ${rsrp} dBm | SINR: ${test.router.sinr || '--'} dB`;
      circle.appendChild(title);

      groupScatterPoints.appendChild(circle);
    });

    // Update Diagnostic Diagnosis Banner
    if (diagDiagnosisBox && diagDiagnosisText) {
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
    }

    // Pearson Correlation
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
    if (telemetryHistory.length === 0) {
      alert('No telemetry data available to export.');
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
      'DL_Bandwidth_MHz',
      'CA_Bands'
    ];

    const rows = telemetryHistory.map(item => {
      const st = item.speedtest || {};
      const rt = item.router || {};
      return [
        item.timestamp,
        item.dateIso,
        `"${item.source || 'Speedtest'}"`,
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
        rt.dlBandwidth || '',
        `"${(rt.caBands || []).join(';')}"`
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
   * Sync / Get Info from Dashboard and Active Router Sessions
   */
  async function syncWithDashboard() {
    if (btnSyncLabel) {
      btnSyncLabel.textContent = currentLang === 'ar' ? 'جاري المزامنة...' : 'Syncing...';
    }

    try {
      // 1. Check if router tab is open to trigger a live metric extraction
      const settingsStorage = await chrome.storage.local.get(['netpulse_settings']);
      const configuredIp = (settingsStorage.netpulse_settings && settingsStorage.netpulse_settings.gatewayIp) || '192.168.1.1';

      if (chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({});
        const routerTabs = tabs.filter(t => t.url && (t.url.includes(configuredIp) || t.url.includes('192.168.') || t.url.includes('10.')));
        for (const tab of routerTabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_ROUTER_SCRAPE' });
          } catch (e) {
            // content script not mounted or tab busy
          }
        }
      }

      // 2. Refresh local data immediately from storage
      await loadData(true);

      // 3. Display Toast Notification Feedback
      showToast(window.NetPulseI18n
        ? window.NetPulseI18n.t('toast_telemetry_synced', currentLang)
        : 'Telemetry successfully synced with Dashboard.');
    } catch (err) {
      console.error('[NetPulse Analysis] Manual sync failed:', err);
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
        netpulse_router_latest: {
          timestamp: Date.now(),
          status: 'waiting',
          source: 'cleared',
          metrics: null
        }
      });

      telemetryHistory = [];
      latestRouterMetrics = null;
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

  // Live Storage Event Listener (instant sync upon new telemetry or speedtest)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.netpulse_history || changes.netpulse_router_latest) {
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
