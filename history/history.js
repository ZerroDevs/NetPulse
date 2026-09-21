/**
 * NetPulse - Hourly History Audit & Diagnostic Studio Controller
 * Groups historical cellular RF telemetry and broadband speedtests into hourly audit blocks.
 * Provides granular hourly averages, router RF snapshots, screenshot previews,
 * and prominent one-click "Copy for AI Analysis" export in Arabic and English.
 * 
 * Strict Guidelines: Zero gradients, zero emojis, pure vector SVGs, flat solid colors,
 * full bidirectional (LTR/RTL) localization.
 */

(function () {
  'use strict';

  // --- State Variables ---
  let currentLang = 'en';
  let currentTheme = 'dark';
  let rawSpeedtestHistory = [];
  let rawRfTimeline = [];
  let latestRouterPayload = null;
  let allHourlyBuckets = [];
  let filteredHourlyBuckets = [];

  // --- DOM Elements ---
  const hourlyContainer = document.getElementById('hourly-blocks-container');
  const hourlyEmptyState = document.getElementById('hourly-empty-state');
  const badgeTotalHours = document.getElementById('badge-total-hours');

  // Filters & Search
  const inputSearch = document.getElementById('input-search-history');
  const inputDateFilter = document.getElementById('input-date-filter');
  const btnClearDate = document.getElementById('btn-clear-date');
  const selectProvider = document.getElementById('select-provider');

  // Topbar Actions
  const btnRefresh = document.getElementById('btn-refresh-history');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnOpenClearModal = document.getElementById('btn-open-clear-modal');
  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');

  // Screenshot Modal
  const modalScreenshot = document.getElementById('modal-screenshot-overlay');
  const imgScreenshot = document.getElementById('screenshot-img');
  const btnScreenshotClose = document.getElementById('btn-screenshot-close');
  const btnScreenshotCloseFooter = document.getElementById('btn-screenshot-close-footer');

  // Clear Confirmation Modal
  const modalClear = document.getElementById('modal-clear-overlay');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // Delete Hour Modal
  const modalDeleteHour = document.getElementById('modal-delete-hour-overlay');
  const deleteHourModalBody = document.getElementById('delete-hour-modal-body');
  const btnDeleteHourCancel = document.getElementById('btn-delete-hour-cancel');
  const btnDeleteHourConfirm = document.getElementById('btn-delete-hour-confirm');
  let pendingDeleteHourKey = null;
  let pendingDeleteStartTime = null;
  let pendingDeleteEndTime = null;

  // Toast Banner
  const toastBanner = document.getElementById('toast-banner');
  const toastMessage = document.getElementById('toast-message');
  let toastTimeout = null;

  /* ==========================================================================
     TOAST NOTIFICATION ENGINE
     ========================================================================== */
  function showToast(msg) {
    if (!toastBanner || !toastMessage) return;
    toastMessage.textContent = msg;
    toastBanner.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastBanner.classList.remove('active');
    }, 3500);
  }

  /* ==========================================================================
     CLIPBOARD COPY ENGINE (WITH FALLBACK)
     ========================================================================== */
  function copyTextToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
      }).catch((err) => {
        console.warn('[NetPulse History] Clipboard API write failed, using textarea fallback:', err);
        fallbackCopy(text, successMessage);
      });
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(successMessage);
      } else {
        showToast(currentLang === 'ar' ? 'فشل النسخ إلى الحافظة' : 'Failed to copy to clipboard');
      }
    } catch (err) {
      console.error('[NetPulse History] Fallback copy failed:', err);
      showToast(currentLang === 'ar' ? 'فشل النسخ إلى الحافظة' : 'Failed to copy to clipboard');
    }
    document.body.removeChild(textArea);
  }

  /* ==========================================================================
     DATA LOADING & NORMALIZATION
     ========================================================================== */
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        'netpulse_history',
        'netpulse_rf_timeline',
        'netpulse_router_latest',
        'netpulse_lang',
        'netpulse_theme'
      ]);

      // Apply Language & Theme
      if (data.netpulse_lang) {
        applyLanguage(data.netpulse_lang);
      }
      if (data.netpulse_theme) {
        applyTheme(data.netpulse_theme);
      }

      rawSpeedtestHistory = Array.isArray(data.netpulse_history) ? data.netpulse_history : [];
      rawRfTimeline = Array.isArray(data.netpulse_rf_timeline) ? data.netpulse_rf_timeline : [];
      latestRouterPayload = data.netpulse_router_latest || null;

      buildHourlyBuckets();
      applyFilters();
    } catch (err) {
      console.error('[NetPulse History] Error loading storage:', err);
    }
  }

  /* ==========================================================================
     HOURLY BUCKETING ALGORITHM
     ========================================================================== */
  function getHourKey(timestamp) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:00`;
  }

  function getDateStr(timestamp) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function buildHourlyBuckets() {
    const bucketsMap = new Map();

    // 1. Process Speedtest History
    for (const test of rawSpeedtestHistory) {
      if (test.speedtest && typeof test.speedtest.pingMs === 'number' && test.speedtest.pingMs > 1000) {
        const s = String(Math.round(test.speedtest.pingMs));
        if (s.length >= 7) test.speedtest.pingMs = parseInt(s.substring(0, s.length - 6), 10);
        else if (s.length >= 5) test.speedtest.pingMs = parseInt(s.substring(0, s.length - 3), 10);
      }
      const ts = test.timestamp || Date.now();
      const hourKey = getHourKey(ts);
      if (!hourKey) continue;

      if (!bucketsMap.has(hourKey)) {
        const d = new Date(ts);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');

        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0).getTime();
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999).getTime();

        bucketsMap.set(hourKey, {
          hourKey,
          dateStr: `${yyyy}-${mm}-${dd}`,
          startHour: d.getHours(),
          label: `${yyyy}-${mm}-${dd} ${hh}:00 - ${hh}:59`,
          startTime,
          endTime,
          speedtests: [],
          rfSnapshots: [],
          routerMetrics: null
        });
      }

      bucketsMap.get(hourKey).speedtests.push(test);
    }

    // 2. Process RF Snapshots Timeline
    for (const snap of rawRfTimeline) {
      const ts = snap.timestamp || Date.now();
      const hourKey = getHourKey(ts);
      if (!hourKey) continue;

      if (!bucketsMap.has(hourKey)) {
        const d = new Date(ts);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');

        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0).getTime();
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999).getTime();

        bucketsMap.set(hourKey, {
          hourKey,
          dateStr: `${yyyy}-${mm}-${dd}`,
          startHour: d.getHours(),
          label: `${yyyy}-${mm}-${dd} ${hh}:00 - ${hh}:59`,
          startTime,
          endTime,
          speedtests: [],
          rfSnapshots: [],
          routerMetrics: null
        });
      }

      bucketsMap.get(hourKey).rfSnapshots.push(snap);
    }

    // 3. If no entries exist yet but latestRouterPayload exists, create an active hour block
    if (bucketsMap.size === 0 && latestRouterPayload && latestRouterPayload.metrics) {
      const ts = latestRouterPayload.timestamp || Date.now();
      const hourKey = getHourKey(ts);
      if (hourKey) {
        const d = new Date(ts);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0).getTime();
        const endTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999).getTime();

        bucketsMap.set(hourKey, {
          hourKey,
          dateStr: `${yyyy}-${mm}-${dd}`,
          startHour: d.getHours(),
          label: `${yyyy}-${mm}-${dd} ${hh}:00 - ${hh}:59`,
          startTime,
          endTime,
          speedtests: [],
          rfSnapshots: [latestRouterPayload.metrics],
          routerMetrics: latestRouterPayload.metrics
        });
      }
    }

    // 4. Calculate aggregates and synthesize representative router metrics per hour
    const bucketsArray = Array.from(bucketsMap.values());

    for (const bucket of bucketsArray) {
      // Sort speedtests chronologically inside bucket
      bucket.speedtests.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      // Sort rfSnapshots chronologically inside bucket
      bucket.rfSnapshots.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Resolve Router Metrics - RF timeline stores { timestamp, router: metrics }
      if (bucket.rfSnapshots.length > 0) {
        // Take the latest RF snapshot in that hour, unwrap .router if present
        const latestSnap = bucket.rfSnapshots[bucket.rfSnapshots.length - 1];
        bucket.routerMetrics = latestSnap.router ? { ...latestSnap.router } : { ...latestSnap };
      } else {
        // Check if any speedtest has a paired router snapshot (stored under .router)
        for (let i = bucket.speedtests.length - 1; i >= 0; i--) {
          const test = bucket.speedtests[i];
          // Support both old .pairedRouter and new .router field names
          const paired = test.router || test.pairedRouter;
          if (paired && (paired.rsrp !== null && paired.rsrp !== undefined)) {
            bucket.routerMetrics = { ...paired };
            break;
          }
        }
      }

      // Always try to inject latestRouterPayload if hour matches and no metrics yet
      if (latestRouterPayload && latestRouterPayload.metrics) {
        const lts = latestRouterPayload.timestamp || 0;
        if (lts >= bucket.startTime && lts <= bucket.endTime) {
          // Prefer latestRouterPayload over older snapshots for the current hour
          if (!bucket.routerMetrics) {
            bucket.routerMetrics = { ...latestRouterPayload.metrics };
          }
        } else if (!bucket.routerMetrics) {
          // For older hours still missing metrics, don't inject — leave as null
        }
      }

      // Compute Speedtest Averages
      if (bucket.speedtests.length > 0) {
        let totalDl = 0;
        let totalUl = 0;
        let totalPing = 0;
        let peakDl = 0;
        let validDlCount = 0;
        let validUlCount = 0;
        let validPingCount = 0;

        for (const st of bucket.speedtests) {
          // Log entries store under .speedtest.downloadMbps (new format)
          // Older entries may store directly as .download (legacy)
          const stData = st.speedtest || st;
          const dl = parseFloat(stData.downloadMbps !== undefined ? stData.downloadMbps : stData.download);
          const ul = parseFloat(stData.uploadMbps !== undefined ? stData.uploadMbps : stData.upload);
          const ping = parseFloat(stData.pingMs !== undefined ? stData.pingMs : stData.ping);

          if (!isNaN(dl) && dl >= 0) {
            totalDl += dl;
            validDlCount++;
            if (dl > peakDl) peakDl = dl;
          }
          if (!isNaN(ul) && ul >= 0) {
            totalUl += ul;
            validUlCount++;
          }
          if (!isNaN(ping) && ping >= 0) {
            totalPing += ping;
            validPingCount++;
          }
        }

        bucket.avgDownload = validDlCount > 0 ? (totalDl / validDlCount).toFixed(1) : '--';
        bucket.avgUpload = validUlCount > 0 ? (totalUl / validUlCount).toFixed(1) : '--';
        bucket.avgPing = validPingCount > 0 ? Math.round(totalPing / validPingCount) : '--';
        bucket.peakDownload = peakDl > 0 ? peakDl.toFixed(1) : '--';
      } else {
        bucket.avgDownload = '--';
        bucket.avgUpload = '--';
        bucket.avgPing = '--';
        bucket.peakDownload = '--';
      }
    }

    // Sort buckets descending (most recent hour first)
    bucketsArray.sort((a, b) => b.startTime - a.startTime);
    allHourlyBuckets = bucketsArray;
  }

  /* ==========================================================================
     SEARCH & FILTERING
     ========================================================================== */
  function applyFilters() {
    const searchTerm = (inputSearch ? inputSearch.value : '').trim().toLowerCase();
    const dateVal = inputDateFilter ? inputDateFilter.value : '';
    const providerVal = selectProvider ? selectProvider.value : 'ALL';

    filteredHourlyBuckets = allHourlyBuckets.filter((bucket) => {
      // 1. Date Filter
      if (dateVal && bucket.dateStr !== dateVal) {
        return false;
      }

      // 2. Provider / Source Filter
      if (providerVal !== 'ALL') {
        if (providerVal === 'Router') {
          if (!bucket.routerMetrics && bucket.rfSnapshots.length === 0) {
            return false;
          }
        } else {
          // Check if speedtests contain specified provider
          const hasProvider = bucket.speedtests.some((st) => {
            const src = (st.source || '').toLowerCase();
            return src.includes(providerVal.toLowerCase());
          });
          if (!hasProvider) return false;
        }
      }

      // 3. Free Text Search Filter
      if (searchTerm) {
        const matchesHour = bucket.label.toLowerCase().includes(searchTerm);
        const matchesRouter = bucket.routerMetrics && (
          String(bucket.routerMetrics.band || '').toLowerCase().includes(searchTerm) ||
          String(bucket.routerMetrics.pci || '').toLowerCase().includes(searchTerm) ||
          String(bucket.routerMetrics.cellId || '').toLowerCase().includes(searchTerm) ||
          String(bucket.routerMetrics.rsrp || '').includes(searchTerm)
        );
        const matchesSpeedtest = bucket.speedtests.some((st) => {
          return (
            String(st.source || '').toLowerCase().includes(searchTerm) ||
            String(st.isp || (st.speedtest && st.speedtest.isp) || '').toLowerCase().includes(searchTerm) ||
            String(st.server || (st.speedtest && st.speedtest.server) || '').toLowerCase().includes(searchTerm) ||
            String((st.speedtest && st.speedtest.downloadMbps) || st.download || '').includes(searchTerm) ||
            String((st.speedtest && st.speedtest.uploadMbps) || st.upload || '').includes(searchTerm)
          );
        });

        if (!matchesHour && !matchesRouter && !matchesSpeedtest) {
          return false;
        }
      }

      return true;
    });

    renderHourlyBlocks();
  }

  /* ==========================================================================
     MARKDOWN GENERATOR FOR AI ANALYSIS (EXACT REQUIRED FORMAT)
     ========================================================================== */
  function generateAiReportMarkdown(bucket, lang) {
    const timeWindow = bucket.label;
    const isAr = lang === 'ar';
    const m = bucket.routerMetrics;

    // 1. Cellular Signal & Router Metrics
    let rsrp = '--';
    let sinr = '--';
    let rsrq = '--';
    let rssi = '--';
    let bands = '--';
    let ul = '--';
    let dl = '--';
    let cellId = '--';

    if (m) {
      if (m.rsrp !== null && m.rsrp !== undefined) rsrp = String(m.rsrp);
      if (m.sinr !== null && m.sinr !== undefined) sinr = String(m.sinr);
      if (m.rsrq !== null && m.rsrq !== undefined) rsrq = String(m.rsrq);
      if (m.rssi !== null && m.rssi !== undefined) rssi = String(m.rssi);
      
      const pBand = m.band || m.primaryBand || '';
      const sBands = Array.isArray(m.secondaryBands) ? m.secondaryBands.filter(Boolean) : [];
      if (pBand) {
        bands = sBands.length > 0 ? `${pBand} + ${sBands.join(' + ')}` : pBand;
      } else if (sBands.length > 0) {
        bands = sBands.join(' + ');
      }

      if (m.ulBandwidth) ul = String(m.ulBandwidth).replace(/mhz|m/i, '');
      if (m.dlBandwidth) dl = String(m.dlBandwidth).replace(/mhz|m/i, '');
      if (m.cellId) cellId = String(m.cellId);
    }

    // 2. Speedtest Runs Within This Hour
    let speedtestLines = '';
    if (bucket.speedtests.length === 0) {
      speedtestLines = isAr
        ? '- لم يتم تسجيل أي اختبارات سرعة خلال هذه الساعة.'
        : '- No speedtests logged during this hour.';
    } else {
      const lines = bucket.speedtests.map((st) => {
        const d = new Date(st.timestamp || Date.now());
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        const sourceName = st.source || (st.speedtest && st.speedtest.source) || 'Speedtest';

        // Support both new format (.speedtest.downloadMbps) and legacy (.download)
        const std = st.speedtest || st;
        const dlVal = std.downloadMbps !== undefined ? std.downloadMbps : (std.download !== undefined ? std.download : '--');
        const ulVal = std.uploadMbps !== undefined ? std.uploadMbps : (std.upload !== undefined ? std.upload : '--');
        const pingVal = std.pingMs !== undefined ? std.pingMs : (std.ping !== undefined ? std.ping : '--');
        const jitterVal = std.jitterMs !== undefined ? std.jitterMs : (std.jitter !== undefined ? std.jitter : '--');

        // Add paired router RF info if available
        const pr = st.router || st.pairedRouter;
        const rfNote = pr && pr.rsrp !== null && pr.rsrp !== undefined
          ? ` [RF: RSRP ${pr.rsrp} dBm, SINR ${pr.sinr !== null ? pr.sinr + ' dB' : '--'}, Band: ${pr.band || '--'}]`
          : '';

        if (isAr) {
          return `- [${timeStr}] ${sourceName}: تنزيل ${dlVal} Mbps | رفع ${ulVal} Mbps (استجابة: ${pingVal} ms, تذبذب: ${jitterVal} ms)${rfNote}`;
        } else {
          return `- [${timeStr}] ${sourceName}: Download ${dlVal} Mbps | Upload ${ulVal} Mbps (Ping: ${pingVal} ms, Jitter: ${jitterVal} ms)${rfNote}`;
        }
      });
      speedtestLines = lines.join('\n');
    }

    const avgDl = bucket.avgDownload !== undefined ? bucket.avgDownload : '--';
    const avgUl = bucket.avgUpload !== undefined ? bucket.avgUpload : '--';

    if (isAr) {
      return `# تقرير فحص الشبكة - NetPulse
**الفترة الزمنية:** ${timeWindow}

### 1. بيانات إشارة البرج والراوتر:
- قوة الإشارة (RSRP): ${rsrp} dBm
- نقاء الإشارة (SINR): ${sinr} dB
- جودة واستقرار البرج (RSRQ): ${rsrq} dB
- طاقة الإشارة الكلية (RSSI): ${rssi} dBm
- الترددات المدمجة (Bands): ${bands}
- نطاق الرفع / التنزيل: UL ${ul}M / DL ${dl}M
- معرّف الخلية (Cell ID): ${cellId}

### 2. نتائج اختبارات السرعة خلال هذه الساعة:
${speedtestLines}
- متوسط السرعة المسجل: تنزيل ${avgDl} Mbps | رفع ${avgUl} Mbps

المطلوب من الذكاء الاصطناعي: قم بتحليل هذه القراءات، وتقييم أداء البرج والشبكة خلال هذه الساعة، وتحديد هل السرعة المسجلة متوافقة مع جودة الإشارة أم يوجد عنق زجاجة أو ازدحام.`;
    } else {
      return `# Network Diagnostic Report - NetPulse
**Time Window:** ${timeWindow}

### 1. Cellular Signal & Router Metrics:
- RSRP: ${rsrp} dBm
- SINR: ${sinr} dB
- RSRQ: ${rsrq} dB
- RSSI: ${rssi} dBm
- Carrier Aggregation: ${bands}
- Bandwidth: UL ${ul}M / DL ${dl}M
- Cell ID: ${cellId}

### 2. Speedtest Runs Within This Hour:
${speedtestLines}
- Hourly Average: Download ${avgDl} Mbps | Upload ${avgUl} Mbps

AI Prompt: Analyze these network metrics and speedtest results for this hour. Evaluate RF link quality, detect potential tower congestion, and verify if throughput matches signal parameters.`;
    }
  }

  /* ==========================================================================
     DOM RENDERING FOR HOURLY CARDS (ACCORDION PATTERN)
     ========================================================================== */
  function renderHourlyBlocks() {
    if (!hourlyContainer) return;

    // Update counter badge
    if (badgeTotalHours) {
      badgeTotalHours.textContent = filteredHourlyBuckets.length;
    }

    if (filteredHourlyBuckets.length === 0) {
      hourlyContainer.innerHTML = '';
      if (hourlyEmptyState) hourlyEmptyState.style.display = 'block';
      return;
    }

    if (hourlyEmptyState) hourlyEmptyState.style.display = 'none';

    const isAr = currentLang === 'ar';
    const fragment = document.createDocumentFragment();

    filteredHourlyBuckets.forEach((bucket, index) => {
      const card = document.createElement('article');
      card.className = 'hourly-card expanded';
      card.setAttribute('data-hour-key', bucket.hourKey);

      // 1. Card Header
      const headerRow = document.createElement('div');
      headerRow.className = 'hourly-card-header';
      headerRow.style.cursor = 'pointer';

      // Left: Clock & Time window
      const headerLeft = document.createElement('div');
      headerLeft.className = 'hourly-title-wrap';

      const clockIcon = `
        <svg class="hourly-clock-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      `;

      const titleEl = document.createElement('h2');
      titleEl.className = 'hourly-card-title mono';
      titleEl.textContent = bucket.label;

      headerLeft.innerHTML = clockIcon;
      headerLeft.appendChild(titleEl);

      // Right: Badges, AI Copy Button & Accordion Toggle
      const headerRight = document.createElement('div');
      headerRight.className = 'hourly-header-actions';

      // Test Count Badge
      const testCountBadge = document.createElement('span');
      testCountBadge.className = 'hourly-badge-count mono';
      testCountBadge.textContent = isAr
        ? `${bucket.speedtests.length} اختبارات`
        : `${bucket.speedtests.length} Tests`;
      headerRight.appendChild(testCountBadge);

      // RF Snapshots Badge (if any)
      if (bucket.rfSnapshots.length > 0) {
        const rfCountBadge = document.createElement('span');
        rfCountBadge.className = 'hourly-badge-rf mono';
        rfCountBadge.textContent = isAr
          ? `${bucket.rfSnapshots.length} لقطة إشارة`
          : `${bucket.rfSnapshots.length} RF Snapshots`;
        headerRight.appendChild(rfCountBadge);
      }

      // "Copy for AI Analysis" Button
      const btnCopyAi = document.createElement('button');
      btnCopyAi.type = 'button';
      btnCopyAi.className = 'btn-copy-ai';
      btnCopyAi.setAttribute('title', isAr ? 'نسخ تقرير الساعة بتنسيق مهيأ للذكاء الاصطناعي' : 'Copy hourly diagnostics formatted for AI analysis');
      btnCopyAi.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>${isAr ? 'نسخ للتحليل بالذكاء الاصطناعي' : 'Copy for AI Analysis'}</span>
      `;

      btnCopyAi.addEventListener('click', (e) => {
        e.stopPropagation();
        const report = generateAiReportMarkdown(bucket, currentLang);
        const toastMsg = isAr
          ? 'تم النسخ إلى الحافظة بتنسيق التحليل بالذكاء الاصطناعي'
          : 'Copied to clipboard formatted for AI analysis';
        copyTextToClipboard(report, toastMsg);
      });

      headerRight.appendChild(btnCopyAi);

      // Delete Hour Block Button
      const btnDeleteHour = document.createElement('button');
      btnDeleteHour.type = 'button';
      btnDeleteHour.className = 'btn-delete-hour';
      btnDeleteHour.setAttribute('title', isAr ? 'حذف سجلات هذه الساعة' : 'Delete this hour\'s records');
      btnDeleteHour.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path><path d="M14 11v6"></path>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
        </svg>
      `;
      btnDeleteHour.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteHourModal(bucket.hourKey, bucket.label);
      });
      headerRight.appendChild(btnDeleteHour);

      // Accordion Chevron Toggle Button
      const btnToggle = document.createElement('button');
      btnToggle.type = 'button';
      btnToggle.className = 'btn-accordion-toggle';
      btnToggle.setAttribute('title', isAr ? 'طي / إظهار تفاصيل الساعة' : 'Toggle hour details');
      btnToggle.innerHTML = `
        <svg class="accordion-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(180deg); transition: transform 0.2s;">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      `;
      headerRight.appendChild(btnToggle);

      headerRow.appendChild(headerLeft);
      headerRow.appendChild(headerRight);
      card.appendChild(headerRow);

      // Accordion Content Wrapper
      const contentWrap = document.createElement('div');
      contentWrap.className = 'hourly-accordion-content';

      const toggleAccordion = () => {
        const isExpanded = card.classList.contains('expanded');
        const chevron = btnToggle.querySelector('.accordion-chevron');

        if (isExpanded) {
          // COLLAPSE: animate to 0
          contentWrap.style.height = contentWrap.scrollHeight + 'px';
          contentWrap.style.overflow = 'hidden';
          requestAnimationFrame(() => {
            contentWrap.style.height = '0px';
          });
          card.classList.remove('expanded');
          card.classList.add('collapsed');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
          const hint = summaryBar ? summaryBar.querySelector('.summary-click-hint') : null;
          if (hint) hint.textContent = isAr ? 'انقر للتفاصيل' : 'Click to expand';
        } else {
          // EXPAND: animate to scrollHeight then set auto
          contentWrap.style.height = '0px';
          contentWrap.style.overflow = 'hidden';
          requestAnimationFrame(() => {
            contentWrap.style.height = contentWrap.scrollHeight + 'px';
          });
          contentWrap.addEventListener('transitionend', function onDone() {
            if (card.classList.contains('expanded')) {
              contentWrap.style.height = 'auto';
            }
            contentWrap.removeEventListener('transitionend', onDone);
          });
          card.classList.add('expanded');
          card.classList.remove('collapsed');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
          const hint = summaryBar ? summaryBar.querySelector('.summary-click-hint') : null;
          if (hint) hint.textContent = isAr ? 'انقر للطي' : 'Click to collapse';
        }
      };

      headerRow.addEventListener('click', toggleAccordion);
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccordion();
      });

      // 2. Always-visible summary bar (speed + RF quick stats)
      const summaryBar = document.createElement('div');
      summaryBar.className = 'hourly-summary-bar';
      summaryBar.style.cursor = 'pointer';

      const mQuick = bucket.routerMetrics;
      const rsrpQuick = mQuick && mQuick.rsrp !== null && mQuick.rsrp !== undefined ? `${mQuick.rsrp} dBm` : '--';
      const sinrQuick = mQuick && mQuick.sinr !== null && mQuick.sinr !== undefined ? `${mQuick.sinr} dB` : '--';
      const bandQuick = mQuick ? (mQuick.band || mQuick.primaryBand || '--') : '--';

      summaryBar.innerHTML = `
        <div class="summary-metric">
          <span class="summary-label">${isAr ? 'متوسط التنزيل' : 'Avg DL'}</span>
          <span class="summary-val mono text-cyan">${bucket.avgDownload !== '--' ? bucket.avgDownload : '--'} <small>Mbps</small></span>
        </div>
        <div class="summary-metric">
          <span class="summary-label">${isAr ? 'متوسط الرفع' : 'Avg UL'}</span>
          <span class="summary-val mono text-purple">${bucket.avgUpload !== '--' ? bucket.avgUpload : '--'} <small>Mbps</small></span>
        </div>
        <div class="summary-metric">
          <span class="summary-label">${isAr ? 'متوسط الاستجابة' : 'Avg Ping'}</span>
          <span class="summary-val mono text-amber">${bucket.avgPing !== '--' ? bucket.avgPing : '--'} <small>ms</small></span>
        </div>
        <div class="summary-metric">
          <span class="summary-label">${isAr ? 'أعلى تنزيل' : 'Peak DL'}</span>
          <span class="summary-val mono text-emerald">${bucket.peakDownload !== '--' ? bucket.peakDownload : '--'} <small>Mbps</small></span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-metric">
          <span class="summary-label">RSRP</span>
          <span class="summary-val mono text-cyan">${rsrpQuick}</span>
        </div>
        <div class="summary-metric">
          <span class="summary-label">SINR</span>
          <span class="summary-val mono text-emerald">${sinrQuick}</span>
        </div>
        <div class="summary-metric">
          <span class="summary-label">${isAr ? 'النطاق' : 'Band'}</span>
          <span class="summary-val mono text-amber">${bandQuick}</span>
        </div>
        <div class="summary-click-hint">${isAr ? 'انقر للتفاصيل' : 'Click to expand'}</div>
      `;
      summaryBar.addEventListener('click', toggleAccordion);
      card.appendChild(summaryBar);

      // 3. Two-Column Diagnostic Body (Router Metrics on Left, Speedtests on Right)
      const bodyGrid = document.createElement('div');
      bodyGrid.className = 'hourly-body-grid';

      // --- Column A: Router RF Snapshot ---
      const colRouter = document.createElement('div');
      colRouter.className = 'hourly-col hourly-col-router';

      const routerTitle = document.createElement('h3');
      routerTitle.className = 'hourly-section-heading';
      routerTitle.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span>${isAr ? 'بيانات إشارة الموجه والبرج' : 'Cellular Signal & Router Metrics'}</span>
      `;
      colRouter.appendChild(routerTitle);

      const m = bucket.routerMetrics;
      if (m && (m.rsrp !== null || m.band || m.pci)) {
        const rfGrid = document.createElement('div');
        rfGrid.className = 'rf-metrics-subgrid';

        // Format RF parameters
        const rsrpStr = m.rsrp !== null && m.rsrp !== undefined ? `${m.rsrp} dBm` : '--';
        const sinrStr = m.sinr !== null && m.sinr !== undefined ? `${m.sinr} dB` : '--';
        const rsrqStr = m.rsrq !== null && m.rsrq !== undefined ? `${m.rsrq} dB` : '--';
        const rssiStr = m.rssi !== null && m.rssi !== undefined ? `${m.rssi} dBm` : '--';
        
        let bandStr = m.band || m.primaryBand || '--';
        if (Array.isArray(m.secondaryBands) && m.secondaryBands.length > 0) {
          bandStr += ` + ${m.secondaryBands.join(' + ')}`;
        }

        const bwStr = (m.dlBandwidth || m.ulBandwidth)
          ? `UL ${m.ulBandwidth || '--'}M / DL ${m.dlBandwidth || '--'}M`
          : '--';
        const cellStr = m.cellId || '--';
        const pciStr = m.pci !== null && m.pci !== undefined ? String(m.pci) : '--';

        // Signal Health Grade Badge
        let gradeBadge = '';
        if (window.NetPulseEvaluator && m.rsrp !== null && m.rsrp !== undefined) {
          try {
            const evalRes = typeof window.NetPulseEvaluator.evaluateRSRP === 'function'
              ? window.NetPulseEvaluator.evaluateRSRP(m.rsrp)
              : (typeof window.NetPulseEvaluator.evaluateMetric === 'function'
                  ? window.NetPulseEvaluator.evaluateMetric('rsrp', m.rsrp)
                  : null);
            if (evalRes) {
              const label = evalRes.grade || evalRes.label || 'N/A';
              const color = evalRes.color || '#9ca3af';
              gradeBadge = `<span style="display:inline-block; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:700; background-color:#111827; border:1px solid ${color}; color:${color}; margin-left:4px;">${label}</span>`;
            }
          } catch (e) {
            console.warn('[NetPulse History] Error evaluating RSRP badge:', e);
          }
        }

        rfGrid.innerHTML = `
          <div class="rf-item">
            <span class="rf-item-label">RSRP (Power):</span>
            <span class="rf-item-val mono text-cyan">${rsrpStr} ${gradeBadge}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">SINR (Purity):</span>
            <span class="rf-item-val mono text-emerald">${sinrStr}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">RSRQ (Quality):</span>
            <span class="rf-item-val mono text-purple">${rsrqStr}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">RSSI (Total):</span>
            <span class="rf-item-val mono">${rssiStr}</span>
          </div>
          <div class="rf-item rf-item-wide">
            <span class="rf-item-label">${isAr ? 'الترددات المدمجة:' : 'Carrier Aggregation:'}</span>
            <span class="rf-item-val mono text-amber">${bandStr}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">${isAr ? 'عرض النطاق:' : 'Bandwidth:'}</span>
            <span class="rf-item-val mono">${bwStr}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">Cell ID:</span>
            <span class="rf-item-val mono">${cellStr}</span>
          </div>
          <div class="rf-item">
            <span class="rf-item-label">PCI:</span>
            <span class="rf-item-val mono text-rose">${pciStr}</span>
          </div>
        `;
        colRouter.appendChild(rfGrid);
      } else {
        const noDataNotice = document.createElement('div');
        noDataNotice.className = 'router-unavailable-notice';
        noDataNotice.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
          <span>${isAr ? 'بيانات الموجه غير متوفرة لهذه الساعة' : 'Router data unavailable for this hour'}</span>
        `;
        colRouter.appendChild(noDataNotice);
      }

      bodyGrid.appendChild(colRouter);

      // --- Column B: Speedtest Runs ---
      const colTests = document.createElement('div');
      colTests.className = 'hourly-col hourly-col-tests';

      const testsTitle = document.createElement('h3');
      testsTitle.className = 'hourly-section-heading';
      testsTitle.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>${isAr ? 'اختبارات السرعة خلال هذه الساعة' : 'Speedtest Runs Within This Hour'}</span>
      `;
      colTests.appendChild(testsTitle);

      if (bucket.speedtests.length === 0) {
        const noTestsNotice = document.createElement('div');
        noTestsNotice.className = 'speedtest-empty-notice';
        noTestsNotice.textContent = isAr
          ? 'لا توجد اختبارات سرعة مسجلة خلال هذه الساعة.'
          : 'No speedtests logged during this hour.';
        colTests.appendChild(noTestsNotice);
      } else {
        const testsList = document.createElement('div');
        testsList.className = 'speedtests-run-list';

        bucket.speedtests.forEach((st) => {
          const runRow = document.createElement('div');
          runRow.className = 'speedtest-run-row';

          const d = new Date(st.timestamp || Date.now());
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

          // Support both log formats: new (.speedtest.downloadMbps) and legacy (.download)
          const stData = st.speedtest || st;
          const dl = stData.downloadMbps !== undefined ? stData.downloadMbps
                    : stData.download !== undefined ? stData.download : undefined;
          const ul = stData.uploadMbps !== undefined ? stData.uploadMbps
                    : stData.upload !== undefined ? stData.upload : undefined;
          const ping = stData.pingMs !== undefined ? stData.pingMs
                      : stData.ping !== undefined ? stData.ping : undefined;
          const jitter = stData.jitterMs !== undefined ? stData.jitterMs
                        : stData.jitter !== undefined ? stData.jitter : undefined;

          const dlDisp = dl !== undefined && dl !== null ? dl : '--';
          const ulDisp = ul !== undefined && ul !== null ? ul : '--';
          const pingDisp = ping !== undefined && ping !== null ? ping : '--';
          const jitterDisp = jitter !== undefined && jitter !== null ? jitter : '--';

          // Source: top-level .source, or from .speedtest.source
          const entrySource = st.source || (st.speedtest && st.speedtest.source) || '';
          const isFast = entrySource.toLowerCase().includes('fast');
          const sourceBadgeClass = isFast ? 'badge-source-fast' : 'badge-source-speedtest';
          const sourceLabel = isFast ? 'Fast.com' : 'Speedtest.net';

          let screenshotBtnHtml = '';
          if (st.screenshotUrl) {
            screenshotBtnHtml = `
              <button type="button" class="btn-preview-screenshot" title="${isAr ? 'عرض لقطة الشاشة' : 'View Screenshot'}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>${isAr ? 'لقطة' : 'Shot'}</span>
              </button>
            `;
          }

          runRow.innerHTML = `
            <div class="run-time-source">
              <span class="run-timestamp mono">${timeStr}</span>
              <span class="badge-source ${sourceBadgeClass}">${sourceLabel}</span>
            </div>
            <div class="run-speeds">
              <span class="run-metric"><strong class="mono text-cyan">${dlDisp}</strong> <small>DL</small></span>
              <span class="run-metric"><strong class="mono text-purple">${ulDisp}</strong> <small>UL</small></span>
              <span class="run-metric"><strong class="mono text-amber">${pingDisp}</strong> <small>ms</small></span>
              <span class="run-metric"><strong class="mono text-muted">${jitterDisp}</strong> <small>jit</small></span>
            </div>
            <div class="run-extra">
              ${screenshotBtnHtml}
            </div>
          `;

          // Handle Screenshot Modal Opening
          if (st.screenshotUrl) {
            const btnThumb = runRow.querySelector('.btn-preview-screenshot');
            if (btnThumb) {
              btnThumb.addEventListener('click', () => {
                openScreenshotModal(st.screenshotUrl, `${sourceLabel} - ${bucket.dateStr} ${timeStr}`);
              });
            }
          }

          testsList.appendChild(runRow);
        });

        colTests.appendChild(testsList);
      }

      bodyGrid.appendChild(colTests);
      contentWrap.appendChild(bodyGrid);
      card.appendChild(contentWrap);
      fragment.appendChild(card);

      // Set initial open/closed state
      const isFirst = (index === 0);
      if (!isFirst) {
        card.classList.remove('expanded');
        card.classList.add('collapsed');
        contentWrap.style.overflow = 'hidden';
        contentWrap.style.height = '0px';
        contentWrap.style.transition = 'height 0.28s ease';
        const chevron = btnToggle.querySelector('.accordion-chevron');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        // Update hint text
        const hint = summaryBar.querySelector('.summary-click-hint');
        if (hint) hint.textContent = isAr ? 'انقر للتفاصيل' : 'Click to expand';
      } else {
        contentWrap.style.overflow = 'hidden';
        contentWrap.style.height = 'auto';
        contentWrap.style.transition = 'height 0.28s ease';
        const hint = summaryBar.querySelector('.summary-click-hint');
        if (hint) hint.textContent = isAr ? 'انقر للطي' : 'Click to collapse';
      }
    });

    hourlyContainer.innerHTML = '';
    hourlyContainer.appendChild(fragment);
  }

  /* ==========================================================================
     SCREENSHOT MODAL WORKFLOW
     ========================================================================== */
  function openScreenshotModal(imgSrc, title) {
    if (!modalScreenshot || !imgScreenshot) return;
    imgScreenshot.src = imgSrc;
    const titleEl = document.getElementById('screenshot-modal-title');
    if (titleEl && title) titleEl.textContent = title;
    modalScreenshot.classList.add('active');
  }

  function closeScreenshotModal() {
    if (!modalScreenshot) return;
    modalScreenshot.classList.remove('active');
    if (imgScreenshot) imgScreenshot.src = '';
  }

  if (btnScreenshotClose) btnScreenshotClose.addEventListener('click', closeScreenshotModal);
  if (btnScreenshotCloseFooter) btnScreenshotCloseFooter.addEventListener('click', closeScreenshotModal);
  if (modalScreenshot) {
    modalScreenshot.addEventListener('click', (e) => {
      if (e.target === modalScreenshot) closeScreenshotModal();
    });
  }

  /* ==========================================================================
     CLEAR DATA MODAL WORKFLOW
     ========================================================================== */
  function openClearModal() {
    if (modalClear) modalClear.classList.add('active');
  }

  function closeClearModal() {
    if (modalClear) modalClear.classList.remove('active');
  }

  if (btnOpenClearModal) btnOpenClearModal.addEventListener('click', openClearModal);
  if (btnModalCancel) btnModalCancel.addEventListener('click', closeClearModal);
  if (modalClear) {
    modalClear.addEventListener('click', (e) => {
      if (e.target === modalClear) closeClearModal();
    });
  }

  async function executeClearData() {
    closeClearModal();
    try {
      await chrome.storage.local.set({
        netpulse_history: [],
        netpulse_rf_timeline: []
      });

      rawSpeedtestHistory = [];
      rawRfTimeline = [];
      allHourlyBuckets = [];
      filteredHourlyBuckets = [];
      renderHourlyBlocks();

      const clearMsg = currentLang === 'ar'
        ? 'تم مسح جميع سجلات التردد اللاسلكي واختبارات السرعة بنجاح.'
        : 'All historical telemetry and speedtest records have been permanently cleared.';
      showToast(clearMsg);
    } catch (err) {
      console.error('[NetPulse History] Clear error:', err);
    }
  }

  if (btnModalConfirm) btnModalConfirm.addEventListener('click', executeClearData);

  /* ==========================================================================
     DELETE SINGLE HOUR BLOCK
     ========================================================================== */
  function openDeleteHourModal(hourKey, label) {
    pendingDeleteHourKey = hourKey;
    // Find the bucket to get time range
    const bucket = allHourlyBuckets.find(b => b.hourKey === hourKey);
    if (bucket) {
      pendingDeleteStartTime = bucket.startTime;
      pendingDeleteEndTime = bucket.endTime;
    }
    if (deleteHourModalBody) {
      const msg = currentLang === 'ar'
        ? `هل أنت متأكد من حذف جميع سجلات الساعة "${label}"؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Permanently delete all records for "${label}"? This cannot be undone.`;
      deleteHourModalBody.textContent = msg;
    }
    if (modalDeleteHour) modalDeleteHour.classList.add('active');
  }

  function closeDeleteHourModal() {
    if (modalDeleteHour) modalDeleteHour.classList.remove('active');
    pendingDeleteHourKey = null;
    pendingDeleteStartTime = null;
    pendingDeleteEndTime = null;
  }

  async function executeDeleteHour() {
    if (!pendingDeleteStartTime || !pendingDeleteEndTime) {
      closeDeleteHourModal();
      return;
    }
    const startTs = pendingDeleteStartTime;
    const endTs = pendingDeleteEndTime;
    closeDeleteHourModal();

    try {
      // Remove speedtest entries within the hour window
      rawSpeedtestHistory = rawSpeedtestHistory.filter(entry => {
        const ts = entry.timestamp || 0;
        return ts < startTs || ts > endTs;
      });

      // Remove RF timeline snapshots within the hour window
      rawRfTimeline = rawRfTimeline.filter(snap => {
        const ts = snap.timestamp || 0;
        return ts < startTs || ts > endTs;
      });

      await chrome.storage.local.set({
        netpulse_history: rawSpeedtestHistory,
        netpulse_rf_timeline: rawRfTimeline
      });

      buildHourlyBuckets();
      applyFilters();
      renderHourlyBlocks();

      const msg = currentLang === 'ar'
        ? 'تم حذف سجلات الساعة بنجاح.'
        : 'Hour block records deleted successfully.';
      showToast(msg);
    } catch (err) {
      console.error('[NetPulse History] Delete hour error:', err);
    }
  }

  if (btnDeleteHourCancel) btnDeleteHourCancel.addEventListener('click', closeDeleteHourModal);
  if (btnDeleteHourConfirm) btnDeleteHourConfirm.addEventListener('click', executeDeleteHour);
  if (modalDeleteHour) {
    modalDeleteHour.addEventListener('click', (e) => {
      if (e.target === modalDeleteHour) closeDeleteHourModal();
    });
  }


  function exportHistoryCsv() {
    if (allHourlyBuckets.length === 0) {
      showToast(currentLang === 'ar' ? 'لا توجد سجلات لتصديرها' : 'No records available to export.');
      return;
    }

    const headers = [
      'Hour_Window',
      'Record_Type',
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
      'Band',
      'Cell_ID',
      'PCI'
    ];

    const rows = [headers.join(',')];

    for (const bucket of allHourlyBuckets) {
      const rm = bucket.routerMetrics;
      const rsrpVal = rm && rm.rsrp !== null && rm.rsrp !== undefined ? rm.rsrp : '';
      const sinrVal = rm && rm.sinr !== null && rm.sinr !== undefined ? rm.sinr : '';
      const rsrqVal = rm && rm.rsrq !== null && rm.rsrq !== undefined ? rm.rsrq : '';
      const rssiVal = rm && rm.rssi !== null && rm.rssi !== undefined ? rm.rssi : '';
      const bandVal = rm && (rm.band || rm.primaryBand) ? `"${rm.band || rm.primaryBand}"` : '';
      const cellVal = rm && rm.cellId ? `"${rm.cellId}"` : '';
      const pciVal = rm && rm.pci !== null && rm.pci !== undefined ? rm.pci : '';

      if (bucket.speedtests.length === 0) {
        // Output an hourly RF baseline row
        rows.push([
          `"${bucket.label}"`,
          'ROUTER_BASELINE',
          new Date(bucket.startTime).toISOString(),
          'Router',
          '',
          '',
          '',
          '',
          rsrpVal,
          sinrVal,
          rsrqVal,
          rssiVal,
          bandVal,
          cellVal,
          pciVal
        ].join(','));
      } else {
        for (const st of bucket.speedtests) {
          // Support both new format (.speedtest.downloadMbps) and legacy (.download)
          const std = st.speedtest || st;
          const dl = std.downloadMbps !== undefined ? std.downloadMbps : (std.download !== undefined ? std.download : '');
          const ul = std.uploadMbps !== undefined ? std.uploadMbps : (std.upload !== undefined ? std.upload : '');
          const ping = std.pingMs !== undefined ? std.pingMs : (std.ping !== undefined ? std.ping : '');
          const jitter = std.jitterMs !== undefined ? std.jitterMs : (std.jitter !== undefined ? std.jitter : '');
          const src = (st.source || (st.speedtest && st.speedtest.source)) ? `"${st.source || st.speedtest.source}"` : '"Speedtest"';
          const iso = new Date(st.timestamp || bucket.startTime).toISOString();

          // Check if speedtest had a specific paired router
          const srm = st.pairedRouter || rm;
          const stRsrp = srm && srm.rsrp !== null && srm.rsrp !== undefined ? srm.rsrp : rsrpVal;
          const stSinr = srm && srm.sinr !== null && srm.sinr !== undefined ? srm.sinr : sinrVal;
          const stRsrq = srm && srm.rsrq !== null && srm.rsrq !== undefined ? srm.rsrq : rsrqVal;
          const stRssi = srm && srm.rssi !== null && srm.rssi !== undefined ? srm.rssi : rssiVal;
          const stBand = srm && (srm.band || srm.primaryBand) ? `"${srm.band || srm.primaryBand}"` : bandVal;
          const stCell = srm && srm.cellId ? `"${srm.cellId}"` : cellVal;
          const stPci = srm && srm.pci !== null && srm.pci !== undefined ? srm.pci : pciVal;

          rows.push([
            `"${bucket.label}"`,
            'SPEEDTEST_RUN',
            iso,
            src,
            dl,
            ul,
            ping,
            jitter,
            stRsrp,
            stSinr,
            stRsrq,
            stRssi,
            stBand,
            stCell,
            stPci
          ].join(','));
        }
      }
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    a.href = url;
    a.download = `netpulse_hourly_history_${dateStr}_${timeStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(currentLang === 'ar' ? 'تم تنزيل ملف CSV بنجاح.' : 'CSV export downloaded successfully.');
  }

  if (btnExportCsv) btnExportCsv.addEventListener('click', exportHistoryCsv);

  /* ==========================================================================
     THEME & LANGUAGE TOGGLES
     ========================================================================== */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (themeLabelText) {
      themeLabelText.textContent = theme === 'light' ? 'Dark' : 'Light';
    }
  }

  function applyLanguage(lang) {
    currentLang = lang;
    if (window.NetPulseI18n) {
      window.NetPulseI18n.applyLanguage(lang, document);
    }
    if (langToggleText) {
      langToggleText.textContent = lang === 'ar' ? 'English' : 'العربية';
    }
  }

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
      // Re-render blocks with new language translations
      renderHourlyBlocks();
    });
  }

  // Filters Event Listeners
  if (inputSearch) inputSearch.addEventListener('input', applyFilters);
  if (inputDateFilter) inputDateFilter.addEventListener('change', applyFilters);
  if (selectProvider) selectProvider.addEventListener('change', applyFilters);
  if (btnClearDate) {
    btnClearDate.addEventListener('click', () => {
      if (inputDateFilter) {
        inputDateFilter.value = '';
        applyFilters();
      }
    });
  }

  // Refresh Button
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      await loadData();
      showToast(currentLang === 'ar' ? 'تم تحديث سجلات التدقيق الساعي.' : 'Hourly audit records refreshed.');
    });
  }

  // Escape key closes open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalScreenshot && modalScreenshot.classList.contains('active')) closeScreenshotModal();
      if (modalClear && modalClear.classList.contains('active')) closeClearModal();
    }
  });

  // Storage live synchronization
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.netpulse_history || changes.netpulse_rf_timeline || changes.netpulse_router_latest) {
        loadData();
      }
    }
  });

  // Export functions to window for unit testing if running in test environment
  if (typeof window !== 'undefined') {
    window.NetPulseHistory = {
      buildHourlyBuckets,
      generateAiReportMarkdown,
      getHourKey
    };
  }

  // Initialize
  loadData();
})();
