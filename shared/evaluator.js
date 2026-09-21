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

  return {
    BENCHMARKS,
    evaluateMetric,
    evaluateRSRP,
    evaluateSINR,
    evaluateRSRQ,
    getOverallHealth,
    generateDiagnosticAdvice,
    correlateSpeedtestWithRF
  };
});
