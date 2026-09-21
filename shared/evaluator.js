/**
 * NetPulse - Shared Telemetry Evaluation & Diagnostic Engine
 * Provides benchmark grading, health status determination, and technical RF advice.
 * 
 * Strict Guidelines: Zero emojis, pure technical rigor, solid state indicators.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NetPulseEvaluator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Benchmark Thresholds based on 3GPP and Cellular RF Engineering Standards
  const BENCHMARKS = {
    rsrp: [
      { min: -80, max: Infinity, grade: 'Excellent', color: '#10b981', label: '>= -80 dBm' },
      { min: -90, max: -80, grade: 'Good', color: '#3b82f6', label: '-80 to -90 dBm' },
      { min: -100, max: -90, grade: 'Fair', color: '#f59e0b', label: '-90 to -100 dBm' },
      { min: -Infinity, max: -100, grade: 'Poor', color: '#f43f5e', label: '< -100 dBm' }
    ],
    sinr: [
      { min: 20, max: Infinity, grade: 'Excellent', color: '#10b981', label: '>= 20 dB' },
      { min: 13, max: 20, grade: 'Good', color: '#3b82f6', label: '13 to 19 dB' },
      { min: 5, max: 13, grade: 'Fair', color: '#f59e0b', label: '5 to 12 dB' },
      { min: -Infinity, max: 5, grade: 'Poor', color: '#f43f5e', label: '< 5 dB' }
    ],
    rsrq: [
      { min: -9, max: Infinity, grade: 'Clean', color: '#10b981', label: '>= -9 dB' },
      { min: -15, max: -9, grade: 'Congested', color: '#f59e0b', label: '-10 to -15 dB' },
      { min: -Infinity, max: -15, grade: 'Heavy Load', color: '#f43f5e', label: '< -15 dB' }
    ],
    rssi: [
      { min: -65, max: Infinity, grade: 'Strong', color: '#10b981', label: '>= -65 dBm' },
      { min: -75, max: -65, grade: 'Good', color: '#3b82f6', label: '-66 to -75 dBm' },
      { min: -85, max: -75, grade: 'Fair', color: '#f59e0b', label: '-76 to -85 dBm' },
      { min: -Infinity, max: -85, grade: 'Weak', color: '#f43f5e', label: '< -85 dBm' }
    ]
  };

  /**
   * Helper to evaluate a numeric value against a benchmark set
   */
  function evaluateMetric(type, value) {
    if (value === null || value === undefined || isNaN(value)) {
      return { grade: 'Unknown', color: '#9ca3af', label: 'N/A' };
    }
    const num = Number(value);
    const benchmarks = BENCHMARKS[type];
    if (!benchmarks) {
      return { grade: 'Unknown', color: '#9ca3af', label: 'N/A' };
    }

    for (let i = 0; i < benchmarks.length; i++) {
      const b = benchmarks[i];
      if (num >= b.min && num < b.max) {
        return { grade: b.grade, color: b.color, label: b.label };
      }
    }
    return { grade: 'Unknown', color: '#9ca3af', label: 'N/A' };
  }

  /**
   * Helper specifically for RSRP evaluation with statusClass and grade
   */
  function evaluateRSRP(value) {
    const res = evaluateMetric('rsrp', value);
    return {
      grade: res.grade,
      label: res.grade,
      color: res.color,
      statusClass: 'status-' + (res.grade || 'unknown').toLowerCase().replace(/\s+/g, '-')
    };
  }

  /**
   * Helper specifically for SINR evaluation with statusClass and grade
   */
  function evaluateSINR(value) {
    const res = evaluateMetric('sinr', value);
    return {
      grade: res.grade,
      label: res.grade,
      color: res.color,
      statusClass: 'status-' + (res.grade || 'unknown').toLowerCase().replace(/\s+/g, '-')
    };
  }

  /**
   * Helper specifically for RSRQ evaluation with statusClass and grade
   */
  function evaluateRSRQ(value) {
    const res = evaluateMetric('rsrq', value);
    return {
      grade: res.grade,
      label: res.grade,
      color: res.color,
      statusClass: 'status-' + (res.grade || 'unknown').toLowerCase().replace(/\s+/g, '-')
    };
  }

  /**
   * Calculate overall health status and badge
   */
  function getOverallHealth(rsrp, sinr, rsrq) {
    if (rsrp === null || rsrp === undefined || isNaN(rsrp)) {
      return {
        status: 'No Signal Data',
        badgeClass: 'status-unknown',
        color: '#9ca3af',
        summary: 'Router telemetry has not been received yet.'
      };
    }

    const rsrpNum = Number(rsrp);
    const sinrNum = sinr !== null && !isNaN(sinr) ? Number(sinr) : 0;
    const rsrqNum = rsrq !== null && !isNaN(rsrq) ? Number(rsrq) : -12;

    if (rsrpNum < -110 || sinrNum < 0) {
      return {
        status: 'Signal Loss / Critical',
        badgeClass: 'status-critical',
        color: '#f43f5e',
        summary: 'Severely degraded physical RF channel or disconnected carrier link.'
      };
    }

    if (rsrpNum >= -85 && sinrNum >= 18 && rsrqNum >= -10) {
      return {
        status: 'Optimal RF',
        badgeClass: 'status-optimal',
        color: '#10b981',
        summary: 'Pristine physical signal, minimal interference, clean sector capacity.'
      };
    }

    if (rsrpNum >= -92 && sinrNum >= 12 && rsrqNum >= -12) {
      return {
        status: 'Good Connection',
        badgeClass: 'status-good',
        color: '#3b82f6',
        summary: 'Stable link with adequate carrier modulation and low bit-error rate.'
      };
    }

    if (rsrqNum < -14 && rsrpNum >= -95) {
      return {
        status: 'Sector Congestion',
        badgeClass: 'status-warning',
        color: '#f59e0b',
        summary: 'Adequate RF signal level, but serving cell tower is experiencing heavy traffic load.'
      };
    }

    if (sinrNum < 8 && rsrpNum >= -95) {
      return {
        status: 'RF Interference',
        badgeClass: 'status-warning',
        color: '#f59e0b',
        summary: 'Signal power is sufficient, but adjacent-channel or co-channel noise is degrading SNR.'
      };
    }

    if (rsrpNum < -98) {
      return {
        status: 'Weak Coverage',
        badgeClass: 'status-warning',
        color: '#f59e0b',
        summary: 'Distance or physical obstructions attenuating cellular transmission.'
      };
    }

    return {
      status: 'Fair Connectivity',
      badgeClass: 'status-fair',
      color: '#f59e0b',
      summary: 'Operational connection within acceptable operational tolerance.'
    };
  }

  /**
   * Diagnostic Advice Engine: Generates concrete technical advice
   */
  function generateDiagnosticAdvice(metrics) {
    if (!metrics || metrics.rsrp === undefined || metrics.rsrp === null || isNaN(metrics.rsrp)) {
      return 'No active router telemetry detected. Ensure the Zyxel NR5103E router interface at http://192.168.1.1 is active or trigger a manual refresh.';
    }

    const rsrp = Number(metrics.rsrp);
    const sinr = metrics.sinr !== undefined && metrics.sinr !== null ? Number(metrics.sinr) : null;
    const rsrq = metrics.rsrq !== undefined && metrics.rsrq !== null ? Number(metrics.rsrq) : null;
    const band = metrics.band || 'Unknown Band';

    const observations = [];

    // RSRP Evaluation
    if (rsrp >= -80) {
      observations.push(`Physical RF signal strength is top tier (${rsrp} dBm) on ${band}.`);
    } else if (rsrp >= -90) {
      observations.push(`Physical RF signal strength is solid (${rsrp} dBm) on ${band}.`);
    } else if (rsrp >= -100) {
      observations.push(`RF signal attenuation is moderate (${rsrp} dBm). Repositioning router closer to a window facing the gNB cell site may yield gain.`);
    } else {
      observations.push(`Severe path loss observed (${rsrp} dBm). High signal degradation likely causing throughput throttling or packet retransmissions.`);
    }

    // SINR & RSRQ Analysis
    if (sinr !== null && rsrq !== null) {
      if (sinr >= 20 && rsrq >= -9) {
        observations.push(`Signal-to-Interference ratio (${sinr} dB) and RSRQ (${rsrq} dB) confirm clean spectral environment with minimal tower loading.`);
      } else if (rsrq < -14 && rsrp >= -92) {
        observations.push(`High RSRQ load (${rsrq} dB) despite solid RSRP (${rsrp} dBm) points directly to serving cell sector congestion rather than local wireless blockage.`);
      } else if (sinr < 8 && rsrp >= -90) {
        observations.push(`Poor SINR (${sinr} dB) in the presence of strong RSRP indicates adjacent cell co-channel interference. Testing alternate router orientation or external antenna polarity can isolate the main beam.`);
      } else if (sinr < 5) {
        observations.push(`Critical SINR degradation (${sinr} dB). Downlink modulation schemes will fall back to lower order QAM (QPSK / 16QAM), capping burst speeds.`);
      }
    }

    // Carrier Aggregation Note
    if (metrics.caBands && Array.isArray(metrics.caBands) && metrics.caBands.length > 1) {
      observations.push(`Carrier Aggregation active with ${metrics.caBands.length} component carriers (${metrics.caBands.join(' + ')}), providing aggregated channel bandwidth.`);
    } else if (metrics.dlBandwidth) {
      observations.push(`Operating channel bandwidth: ${metrics.dlBandwidth}.`);
    }

    return observations.join(' ');
  }

  /**
   * Correlate Speedtest with underlying RF telemetry
   */
  function correlateSpeedtestWithRF(speedtest, routerMetrics) {
    if (!speedtest || !routerMetrics) {
      return 'Insufficient telemetry to generate correlation.';
    }

    const dl = Number(speedtest.downloadMbps || 0);
    const rsrp = routerMetrics.rsrp !== undefined ? Number(routerMetrics.rsrp) : null;
    const sinr = routerMetrics.sinr !== undefined ? Number(routerMetrics.sinr) : null;
    const rsrq = routerMetrics.rsrq !== undefined ? Number(routerMetrics.rsrq) : null;
    const band = routerMetrics.band || 'Cellular';

    if (rsrp === null) {
      return `Speedtest recorded at ${dl.toFixed(1)} Mbps DL. No simultaneous router RF snapshot was registered.`;
    }

    if (dl >= 250 && sinr !== null && sinr >= 18) {
      return `High throughput (${dl.toFixed(1)} Mbps) correlated directly with pristine SINR (${sinr} dB) on ${band}, enabling 256-QAM modulation.`;
    }

    if (dl < 80 && rsrp >= -85 && rsrq !== null && rsrq < -13) {
      return `Throughput bottlenecked at ${dl.toFixed(1)} Mbps despite strong signal (${rsrp} dBm). RSRQ (${rsrq} dB) indicates tower sector congestion or backhaul saturation.`;
    }

    if (dl < 50 && sinr !== null && sinr < 7) {
      return `Reduced speed (${dl.toFixed(1)} Mbps) driven by low SINR (${sinr} dB). High interference induced block errors and modulation downshift.`;
    }

    if (dl < 30 && rsrp < -100) {
      return `Speed capped at ${dl.toFixed(1)} Mbps primarily by severe RF path attenuation (RSRP ${rsrp} dBm).`;
    }

    return `Achieved ${dl.toFixed(1)} Mbps DL on ${band} with RSRP ${rsrp} dBm and SINR ${sinr !== null ? sinr + ' dB' : 'N/A'}. Balanced cellular performance.`;
  }

  /**
   * Feature 1: Robust Carrier Aggregation & Dynamic Multi-Band Parsing
   * Parses comma-separated downlink bandwidths and extracts all component carriers (PCC, SCC1..n)
   */
  function parseCarrierAggregation(metrics) {
    if (!metrics) {
      return {
        carriersCount: 1,
        totalDlBw: 20,
        carriers: [{ type: 'PCC', band: 'B3', bw: 20, freq: 'LTE Primary', tagClass: 'tag-pcc' }]
      };
    }

    // 1. Extract Band list
    let bands = [];
    if (Array.isArray(metrics.caBands) && metrics.caBands.length > 0) {
      metrics.caBands.forEach(b => {
        const name = typeof b === 'object' ? (b.band || '') : String(b);
        name.split(/[,\s/+]+/).map(s => s.trim()).filter(Boolean).forEach(x => bands.push(x));
      });
    } else if (metrics.band) {
      String(metrics.band).split(/[,\s/+]+/).map(s => s.trim()).filter(Boolean).forEach(x => bands.push(x));
    }
    if (bands.length === 0) bands = ['B3'];

    // 2. Extract and parse individual bandwidths from dlBandwidth
    let dlBwArray = [];
    if (metrics.dlBandwidth !== null && metrics.dlBandwidth !== undefined) {
      const rawBwStr = String(metrics.dlBandwidth);
      // Matches numbers like "20M, 10M, 10M, 10M MHz" or "20, 10, 10, 10" or "100 MHz"
      const matchedNumbers = rawBwStr.match(/\d+(?:\.\d+)?/g);
      if (matchedNumbers && matchedNumbers.length > 0) {
        dlBwArray = matchedNumbers.map(n => Math.round(parseFloat(n))).filter(n => n > 0);
      }
    }

    // If caBands has objects with .bandwidth property, check those too
    if (Array.isArray(metrics.caBands) && dlBwArray.length <= 1) {
      const objBws = metrics.caBands.map(b => (typeof b === 'object' && b.bandwidth) ? parseInt(b.bandwidth) : null).filter(Boolean);
      if (objBws.length > 0) {
        const primaryBw = dlBwArray[0] || (bands[0] && bands[0].toLowerCase().startsWith('n') ? 100 : 20);
        dlBwArray = [primaryBw, ...objBws];
      }
    }

    // Fallback if no bandwidths were parsed
    if (dlBwArray.length === 0) {
      dlBwArray = [bands[0] && bands[0].toLowerCase().startsWith('n') ? 100 : 20];
    }

    // Ensure bands count matches bandwidths count or adjust
    const count = Math.max(bands.length, dlBwArray.length);
    const carriers = [];
    let totalDlBw = 0;

    for (let i = 0; i < count; i++) {
      const isPcc = i === 0;
      const type = isPcc ? 'PCC' : `SCC${i}`;
      const bandName = bands[i] || (bands[0] ? `${bands[0]}` : 'B3');
      const bw = dlBwArray[i] || (dlBwArray.length === 1 && !isPcc ? Math.round(dlBwArray[0] / count) : 10);
      totalDlBw += bw;

      let freqLabel = 'LTE Primary';
      if (bandName.toLowerCase().startsWith('n')) {
        freqLabel = isPcc ? '5G NR (Primary)' : '5G Sub-6 (Secondary)';
      } else {
        freqLabel = isPcc ? 'LTE Primary' : 'LTE Secondary';
      }

      const tagClass = isPcc ? 'tag-pcc' : `tag-scc${Math.min(i, 4)}`;

      carriers.push({
        type,
        band: bandName,
        bw,
        freq: freqLabel,
        tagClass
      });
    }

    return {
      carriersCount: carriers.length,
      totalDlBw,
      carriers
    };
  }

  /**
   * Feature 2: Link Spectral Efficiency & Theoretical Capacity Engine
   */
  function computeSpectralEfficiency(metrics, speedtest) {
    const caInfo = parseCarrierAggregation(metrics);
    const totalDlBw = caInfo.totalDlBw || 20;

    // Estimate spectral efficiency (bps/Hz) based on SINR & modulation
    const sinr = (metrics && metrics.sinr !== null && metrics.sinr !== undefined) ? Number(metrics.sinr) : null;
    let bpsPerHz = 7.5; // Default baseline (256-QAM / 4x4 MIMO)

    if (sinr !== null) {
      if (sinr >= 20) {
        bpsPerHz = 7.8; // Peak 256-QAM 4x4 MIMO
      } else if (sinr >= 13) {
        bpsPerHz = 6.0; // 64-QAM / 256-QAM mix
      } else if (sinr >= 5) {
        bpsPerHz = 4.2; // 16-QAM / 64-QAM
      } else {
        bpsPerHz = 2.0; // QPSK under interference
      }
    }

    const theoreticalPeakMbps = Math.round(totalDlBw * bpsPerHz);

    let dlSpeed = null;
    if (speedtest && speedtest.downloadMbps) {
      dlSpeed = Number(speedtest.downloadMbps);
    } else if (speedtest && speedtest.download) {
      dlSpeed = Number(speedtest.download);
    }

    let efficiencyPercent = null;
    let tierKey = 'efficiency_unknown';
    let tierGrade = 'Awaiting Speedtest';
    let tierColor = '#9ca3af';

    if (dlSpeed !== null && dlSpeed > 0 && theoreticalPeakMbps > 0) {
      efficiencyPercent = Math.min(100, Math.round((dlSpeed / theoreticalPeakMbps) * 100));
      if (efficiencyPercent >= 70) {
        tierKey = 'efficiency_saturated';
        tierGrade = 'Near Physical Saturation';
        tierColor = '#10b981'; // Emerald
      } else if (efficiencyPercent >= 40) {
        tierKey = 'efficiency_optimal';
        tierGrade = 'Optimal Multi-User Balance';
        tierColor = '#3b82f6'; // Blue
      } else if (efficiencyPercent >= 20) {
        tierKey = 'efficiency_moderate';
        tierGrade = 'Moderate Sector Load';
        tierColor = '#f59e0b'; // Amber
      } else {
        tierKey = 'efficiency_severe';
        tierGrade = 'Severe Tower Congestion / Bottleneck';
        tierColor = '#f43f5e'; // Rose
      }
    }

    return {
      totalDlBw,
      bpsPerHz,
      theoreticalPeakMbps,
      latestDlMbps: dlSpeed,
      efficiencyPercent,
      tierKey,
      tierGrade,
      tierColor
    };
  }

  /**
   * Feature 4: Privacy & Public Sharing Mode (Sensitive Data Redaction)
   * Redacts IP addresses, Cell IDs, PCIs, and MAC addresses for safe sharing.
   */
  function redactSensitiveData(val, type = 'generic') {
    if (val === null || val === undefined) return '--';
    const str = String(val).trim();
    if (!str || str === '--') return '--';

    if (type === 'ip' || str.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      const parts = str.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
      }
      return str.replace(/\.\d+$/g, '.*');
    }

    if (type === 'pci') {
      return '*';
    }

    if (type === 'cell_id' || type === 'cell') {
      if (str.length <= 3) return '***';
      const visibleLen = Math.max(1, Math.min(3, Math.floor(str.length / 2)));
      return str.slice(0, visibleLen) + '*'.repeat(str.length - visibleLen);
    }

    if (type === 'mac' || (str.includes(':') && str.length === 17)) {
      const parts = str.split(':');
      if (parts.length === 6) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:**:**:**`;
      }
    }

    // Generic fallback: if length > 4, mask second half
    if (str.length > 4) {
      const half = Math.floor(str.length / 2);
      return str.slice(0, half) + '*'.repeat(str.length - half);
    }
    return '****';
  }

  /**
   * Feature 5: 1-Click "Export Diagnostic Card as PNG" Engine
   * Pure client-side HTML5 Canvas rendering (0 external CDNs, 100% MV3 CSP compliant).
   * Generates a high-contrast, flat diagnostic report card.
   */
  function generateDiagnosticCardCanvas(options = {}) {
    const {
      router = {},
      speedtest = {},
      privacyMode = false,
      title = 'NetPulse RF Telemetry & Speed Report',
      timeWindow = new Date().toLocaleString(),
      lang = 'en'
    } = options;

    const r = router || {};
    const st = speedtest || {};
    const ca = parseCarrierAggregation(r);
    const eff = computeSpectralEfficiency(r, st);
    const health = getOverallHealth(r.rsrp, r.sinr, r.rsrq);

    const redact = (val, type) => {
      return privacyMode ? redactSensitiveData(val, type) : (val !== null && val !== undefined ? String(val) : '--');
    };

    const width = 800;
    const height = 540;
    const scale = 2; // 2x for sharp high-DPI rendering

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 1. Solid Canvas Background (#0b0f19)
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Helper: Rounded Rectangle
    function roundRect(x, y, w, h, radius, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 2. Top Header Bar Card
    roundRect(24, 24, width - 48, 70, 6, '#111827', '#1f2937');

    // Brand / Title
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f9fafb';
    ctx.fillText(title, 40, 52);

    // Subtitle & Time Window
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`Time Window: ${timeWindow} ${privacyMode ? '(Privacy Redacted)' : ''}`, 40, 74);

    // Overall Health Badge
    const badgeText = health.status || 'Optimal RF';
    const badgeColor = health.color || '#10b981';
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 20;
    roundRect(width - 40 - badgeWidth, 42, badgeWidth, 26, 4, '#0f172a', badgeColor);
    ctx.fillStyle = badgeColor;
    ctx.fillText(badgeText, width - 40 - badgeWidth + 10, 59);

    // 3. Section: Cellular RF Telemetry (4 Cards Grid)
    const rfCards = [
      {
        name: 'RSRP',
        val: r.rsrp !== null && r.rsrp !== undefined ? `${r.rsrp} dBm` : '--',
        eval: evaluateMetric('rsrp', r.rsrp),
        desc: 'Signal Power'
      },
      {
        name: 'SINR',
        val: r.sinr !== null && r.sinr !== undefined ? `${r.sinr} dB` : '--',
        eval: evaluateMetric('sinr', r.sinr),
        desc: 'Signal Purity'
      },
      {
        name: 'RSRQ',
        val: r.rsrq !== null && r.rsrq !== undefined ? `${r.rsrq} dB` : '--',
        eval: evaluateMetric('rsrq', r.rsrq),
        desc: 'Sector Load'
      },
      {
        name: 'RSSI',
        val: r.rssi !== null && r.rssi !== undefined ? `${r.rssi} dBm` : '--',
        eval: evaluateMetric('rssi', r.rssi),
        desc: 'Total Power'
      }
    ];

    const cardW = (width - 48 - 36) / 4;
    rfCards.forEach((c, idx) => {
      const cx = 24 + idx * (cardW + 12);
      const cy = 106;
      roundRect(cx, cy, cardW, 95, 6, '#111827', '#1f2937');

      // Metric Title
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(c.name, cx + 12, cy + 24);

      // Grade Tag
      ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = c.eval.color || '#9ca3af';
      const gradeText = c.eval.grade || '--';
      const gWidth = ctx.measureText(gradeText).width;
      ctx.fillText(gradeText, cx + cardW - 12 - gWidth, cy + 24);

      // Value
      ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = c.eval.color || '#f3f4f6';
      ctx.fillText(c.val, cx + 12, cy + 58);

      // Sub Description
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(c.desc, cx + 12, cy + 80);
    });

    // 4. Section: Throughput Performance & Spectral Efficiency (4 Cards Grid)
    const dlSpeed = st.downloadMbps !== undefined ? st.downloadMbps : (st.download !== undefined ? st.download : null);
    const ulSpeed = st.uploadMbps !== undefined ? st.uploadMbps : (st.upload !== undefined ? st.upload : null);
    const pingVal = st.pingMs !== undefined ? st.pingMs : (st.ping !== undefined ? st.ping : null);
    
    const sourceName = st.source || (st.speedtest && st.speedtest.source) || '';
    const isSpeedtestDotNet = /speedtest/i.test(sourceName) && !/fast/i.test(sourceName);
    const rawJitter = st.jitterMs !== undefined ? st.jitterMs : (st.jitter !== undefined ? st.jitter : null);
    const numJitter = (rawJitter !== null && rawJitter !== undefined && !isNaN(rawJitter)) ? Number(rawJitter) : null;
    const hasValidJitter = !isSpeedtestDotNet && numJitter !== null && numJitter > 0;

    let latencyTitle = hasValidJitter ? 'LATENCY / JITTER' : 'LATENCY (PING)';
    let latencyVal = '--';
    if (pingVal !== null && pingVal !== undefined) {
      latencyVal = hasValidJitter ? `${pingVal} ms / ${numJitter} ms` : `${pingVal} ms`;
    }

    const perfCards = [
      {
        name: 'DOWNLOAD',
        val: dlSpeed !== null ? `${Number(dlSpeed).toFixed(1)} Mbps` : '--',
        color: '#10b981',
        desc: 'Speedtest Throughput'
      },
      {
        name: 'UPLOAD',
        val: ulSpeed !== null ? `${Number(ulSpeed).toFixed(1)} Mbps` : '--',
        color: '#3b82f6',
        desc: 'Uplink Throughput'
      },
      {
        name: latencyTitle,
        val: latencyVal,
        color: '#f59e0b',
        desc: hasValidJitter ? 'Round Trip Ping / Jitter' : 'Round Trip Ping'
      },
      {
        name: 'LINK EFFICIENCY',
        val: eff.efficiencyPercent !== null ? `${eff.efficiencyPercent}%` : '--',
        color: eff.tierColor || '#6366f1',
        desc: `${eff.theoreticalPeakMbps} Mbps Sector Peak`
      }
    ];

    perfCards.forEach((c, idx) => {
      const cx = 24 + idx * (cardW + 12);
      const cy = 213;
      roundRect(cx, cy, cardW, 95, 6, '#111827', '#1f2937');

      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(c.name, cx + 12, cy + 24);

      ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = c.color;
      ctx.fillText(c.val, cx + 12, cy + 58);

      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(c.desc, cx + 12, cy + 80);
    });

    // 5. Section: Serving Cell & Carrier Aggregation Details
    roundRect(24, 320, width - 48, 140, 6, '#111827', '#1f2937');

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f9fafb';
    ctx.fillText('Carrier Aggregation (CA) & Serving Cell Topology', 40, 346);

    // Row 1: Band & Bandwidth
    const bandDisplay = r.band || (r.caBands && r.caBands.length > 0 ? r.caBands.join(' + ') : 'LTE/5G');
    const caCapacityText = `${ca.carriersCount}CA Carriers - ${ca.totalDlBw} MHz DL Bandwidth`;

    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Active Bands:', 40, 376);
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(bandDisplay, 130, 376);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText('DL Capacity:', 440, 376);
    ctx.fillStyle = '#34d399';
    ctx.fillText(caCapacityText, 530, 376);

    // Row 2: Serving Cell ID & PCI
    const pciDisplay = redact(r.pci, 'pci');
    const cellIdDisplay = redact(r.cellId, 'cell_id');

    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Physical Cell ID:', 40, 404);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText(`PCI ${pciDisplay}`, 160, 404);

    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Cell Tower ID:', 440, 404);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillText(`Cell ID ${cellIdDisplay}`, 540, 404);

    // Row 3: Modulation & Sector Assessment
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Efficiency State:', 40, 432);
    ctx.fillStyle = eff.tierColor || '#a7f3d0';
    ctx.fillText(`${eff.tierGrade} (${eff.bpsPerHz} bps/Hz on 256-QAM)`, 160, 432);

    // 6. Footer Strip
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText('100% Local Diagnostic Telemetry - No External Network Requests', 24, 490);

    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#6366f1';
    const footerBrand = 'Generated by NetPulse - @ZerroDevs';
    const fWidth = ctx.measureText(footerBrand).width;
    ctx.fillText(footerBrand, width - 24 - fWidth, 490);

    return canvas;
  }

  /**
   * Helper to trigger immediate browser download of the diagnostic card canvas
   */
  function downloadDiagnosticCardPng(options = {}) {
    const canvas = generateDiagnosticCardCanvas(options);
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const ts = Date.now();
    a.href = dataUrl;
    a.download = `NetPulse_Diagnostic_Report_${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }

  return {
    BENCHMARKS,
    evaluateMetric,
    evaluateRSRP,
    evaluateSINR,
    evaluateRSRQ,
    getOverallHealth,
    generateDiagnosticAdvice,
    correlateSpeedtestWithRF,
    parseCarrierAggregation,
    computeSpectralEfficiency,
    redactSensitiveData,
    generateDiagnosticCardCanvas,
    downloadDiagnosticCardPng
  };
});

