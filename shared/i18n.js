/**
 * NetPulse - Internationalization (i18n) Engine
 * Comprehensive English (LTR) and Arabic (RTL) dictionary & layout switcher.
 * 
 * Strict Guidelines: Zero emojis, pure technical vector iconography, solid states.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NetPulseI18n = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TRANSLATIONS = {
    en: {
      // Branding & Headers
      brand_name: 'NetPulse',
      brand_sub: 'Zyxel NR5103E & RF Performance Engine',
      gateway_listening: 'Gateway: 192.168.* (Listening)',
      gateway_connected: 'Connected ({source})',
      awaiting_router: 'Awaiting Router',
      last_sync: 'Last Sync: {time}',
      last_sync_never: 'Last Sync: Never',
      detected_active_tab: 'Detected: {platform} active in current tab',
      detected_router: 'Detected Router: {host}',

      // RF Telemetry Section
      rf_telemetry_title: 'Live Cellular RF Telemetry',
      overall_state: 'OVERALL STATE',
      awaiting_signal: 'Awaiting Signal',
      rf_link_health: 'RF LINK HEALTH',
      no_signal_telemetry: 'No Signal Telemetry',

      // Health Grades
      status_optimal: 'Optimal RF',
      status_good: 'Good Connection',
      status_warning_congestion: 'Sector Congestion',
      status_warning_interference: 'RF Interference',
      status_critical: 'Signal Loss / Critical',
      status_fair: 'Fair Connectivity',

      // Metric Cards
      metric_rsrp_name: 'RSRP',
      metric_rsrp_desc: 'Reference Signal Received Power',
      metric_sinr_name: 'SINR',
      metric_sinr_desc: 'Signal-to-Interference-plus-Noise',
      metric_rsrq_name: 'RSRQ',
      metric_rsrq_desc: 'Reference Signal Received Quality',
      metric_rssi_name: 'RSSI',
      metric_rssi_desc: 'Received Signal Strength Indicator',

      // Benchmark Tier Labels
      tier_excellent: 'Excellent',
      tier_good: 'Good',
      tier_fair: 'Fair',
      tier_poor: 'Poor',
      tier_clean: 'Clean',
      tier_congested: 'Congested',
      tier_heavy_load: 'Heavy Load',
      tier_strong: 'Strong',
      tier_weak: 'Weak',

      // Range Guides
      rsrp_guide: 'Poor < -100 | Fair -90 | Good -80 | >= -80 Exc',
      sinr_guide: 'Poor < 5 | Fair 5-12 | Good 13-19 | >= 20 Exc',
      rsrq_guide: 'Heavy < -15 | Congested -10 to -15 | >= -9 Clean',
      rssi_guide: 'Weak < -85 | Fair -76 to -85 | Good -66 to -75 | >= -65 Strong',

      // Carrier Aggregation
      ca_title: 'Carrier Aggregation Breakdown',
      ca_primary_band: 'PRIMARY SERVING BAND',
      ca_bandwidth: 'BANDWIDTH',
      ca_dl_bw: 'DOWNLINK BANDWIDTH',
      ca_ul_bw: 'UPLINK BANDWIDTH',
      ca_pci: 'PHYSICAL CELL ID (PCI)',
      ca_cell_id: 'CELL ID / E-GNB ID',
      ca_carriers_count: 'CARRIER AGG',
      ca_aggregated_carriers: 'AGGREGATED CARRIERS',
      ca_active_components: 'ACTIVE COMPONENT CARRIERS (CC)',
      ca_no_secondary: 'No secondary carriers currently aggregated',
      ca_single_carrier: '1x Component Carrier',
      ca_multi_carrier: '{count}x Carrier Aggregation',

      // Diagnostic Advice Engine
      diagnostic_title: 'Diagnostic Advice Engine',
      active_analysis: 'Active Analysis',
      diagnostic_awaiting: 'Awaiting cellular telemetry snapshot from router interface (e.g. 192.168.*). Click "Scan Router Tab" or "Open Router GUI" to capture live metrics.',
      rule_optimal: 'High RSRP + High SINR + Clean RSRQ: Peak modulation capacity (256-QAM) and maximum line rates.',
      rule_congested: 'Solid RSRP + Heavy RSRQ (< -14 dB): Serving cell tower congestion. Throughput drops stem from sector load, not physical path loss.',
      rule_interference: 'Low SINR (< 8 dB): High RF interference. Signal modulation downgrades to QPSK/16QAM, capping throughput.',

      // Latest Speedtest
      latest_speedtest: 'LATEST SPEEDTEST',
      no_tests_recorded: 'No tests recorded',
      stat_down: 'DOWN',
      stat_up: 'UP',
      stat_ping: 'PING',
      stat_jitter: 'JITTER',
      rf_paired: 'RF Paired:',
      rf_unpaired: 'Test ran without simultaneous router RF lock.',
      rf_pairing_placeholder: 'RF telemetry pairing will appear here.',

      // History Table & Controls
      history_title: 'Speedtest & RF Correlation History Log',
      export_csv: 'Export CSV',
      export_json: 'Export JSON',
      clear_all_data: 'Clear All Data',
      search_placeholder: 'Search by Band, ISP, source, or notes...',
      source_label: 'Source:',
      sort_label: 'Sort By:',
      source_all: 'All Sources',
      sort_ts_desc: 'Timestamp (Newest)',
      sort_ts_asc: 'Timestamp (Oldest)',
      sort_dl_desc: 'Download (High to Low)',
      sort_dl_asc: 'Download (Low to High)',
      sort_ping_asc: 'Ping (Lowest)',
      sort_rsrp_desc: 'RSRP (Strongest)',
      records_count: '{filtered} of {total} records',

      // Table Headers
      th_timestamp: 'TIMESTAMP',
      th_source: 'SOURCE',
      th_download: 'DOWNLOAD',
      th_upload: 'UPLOAD',
      th_ping: 'PING',
      th_jitter: 'JITTER',
      th_paired_rsrp: 'PAIRED RSRP',
      th_paired_sinr: 'PAIRED SINR',
      th_band: 'BAND',
      th_correlation: 'RF CORRELATION & DIAGNOSTIC CONCLUSION',
      empty_history_title: 'No network speedtest or RF correlation records recorded yet.',
      empty_history_sub: 'Run a test on Speedtest.net or Fast.com, or click "Capture Speedtest Tab" or "Simulate Telemetry" above.',
      empty_search_title: 'No matching records found for the current search filter.',
      empty_search_sub: 'Try adjusting search keywords or resetting source filter.',

      // Actions & Buttons
      scan_router_tab: 'Scan Router Tab',
      searching_tabs: 'Searching Tabs...',
      capture_speedtest_tab: 'Capture Speedtest Tab',
      locating_test: 'Locating Test...',
      simulate_telemetry: 'Simulate Telemetry',
      refresh: 'Refresh',
      open_router_gui: 'Open Router GUI',
      open_dashboard: 'Open Full Analytics Dashboard',
      manual_check_router: 'Manual Check / Scan Router Tab',
      manual_capture_speedtest: 'Manual Capture Speedtest Tab',
      scanning_active_tab: 'Scanning Router Tab...',
      searching_speedtest_tab: 'Searching Speedtest Tab...',
      theme_toggle: 'Toggle Light/Dark Theme',
      lang_toggle: 'العربية',

      // Clear Data Modal
      modal_clear_title: 'Clear All Stored Telemetry',
      modal_clear_message: 'Are you sure you want to permanently clear all historical speedtest logs and router snapshots? This action cannot be undone.',
      modal_btn_cancel: 'Cancel',
      modal_btn_confirm: 'Confirm Delete',
      toast_data_cleared: 'All historical telemetry and speedtest records have been permanently cleared.',
      toast_telemetry_simulated: 'Simulated RF telemetry and Speedtest sample injected successfully.',

      // General Units
      unit_dbm: 'dBm',
      unit_db: 'dB',
      unit_mbps: 'Mbps',
      unit_ms: 'ms'
    },

    ar: {
      // Branding & Headers
      brand_name: 'نبض الشبكة NetPulse',
      brand_sub: 'محرك أداء التردد اللاسلكي وموجه Zyxel NR5103E',
      gateway_listening: 'البوابة: 192.168.* (قيد الاستماع)',
      gateway_connected: 'متصل ({source})',
      awaiting_router: 'بانتظار الموجه',
      last_sync: 'آخر مزامنة: {time}',
      last_sync_never: 'آخر مزامنة: أبداً',
      detected_active_tab: 'تم اكتشاف: {platform} نشط في علامة التبويب الحالية',
      detected_router: 'تم اكتشاف الموجه: {host}',

      // RF Telemetry Section
      rf_telemetry_title: 'بيانات التردد اللاسلكي الخلوي المباشرة',
      overall_state: 'الحالة العامة',
      awaiting_signal: 'بانتظار الإشارة',
      rf_link_health: 'صحة اتصال التردد اللاسلكي',
      no_signal_telemetry: 'لا توجد بيانات إشارة',

      // Health Grades
      status_optimal: 'استقبال إشارة مثالي',
      status_good: 'اتصال جيد ومستقر',
      status_warning_congestion: 'رصد ازدحام على البرج',
      status_warning_interference: 'تشويش في التردد اللاسلكي',
      status_critical: 'فقدان الإشارة / حرج',
      status_fair: 'اتصال متوسط ومقبول',

      // Metric Cards
      metric_rsrp_name: 'RSRP',
      metric_rsrp_desc: 'قدرة استقبال الإشارة المرجعية',
      metric_sinr_name: 'SINR',
      metric_sinr_desc: 'نسبة الإشارة إلى التداخل والضوضاء',
      metric_rsrq_name: 'RSRQ',
      metric_rsrq_desc: 'جودة استقبال الإشارة المرجعية',
      metric_rssi_name: 'RSSI',
      metric_rssi_desc: 'مؤشر قوة الإشارة المستقبلة',

      // Benchmark Tier Labels
      tier_excellent: 'ممتاز',
      tier_good: 'جيد',
      tier_fair: 'متوسط',
      tier_poor: 'ضعيف',
      tier_clean: 'نظيف',
      tier_congested: 'مزدحم',
      tier_heavy_load: 'حمولة عالية',
      tier_strong: 'قوي',
      tier_weak: 'ضعيف',

      // Range Guides
      rsrp_guide: 'ضعيف < -100 | متوسط -90 | جيد -80 | >= -80 ممتاز',
      sinr_guide: 'ضعيف < 5 | متوسط 5-12 | جيد 13-19 | >= 20 ممتاز',
      rsrq_guide: 'حمل ثقيل < -15 | مزدحم -10 إلى -15 | >= -9 نظيف',
      rssi_guide: 'ضعيف < -85 | متوسط -76 إلى -85 | جيد -66 إلى -75 | >= -65 قوي',

      // Carrier Aggregation
      ca_title: 'تفاصيل تجميع النطاقات (CA)',
      ca_primary_band: 'نطاق الخدمة الأساسي',
      ca_bandwidth: 'عرض النطاق الترددي',
      ca_dl_bw: 'عرض نطاق التنزيل',
      ca_ul_bw: 'عرض نطاق الرفع',
      ca_pci: 'معرف الخلية الفيزيائي (PCI)',
      ca_cell_id: 'معرف الخلية / E-GNB ID',
      ca_carriers_count: 'تجميع النطاقات',
      ca_aggregated_carriers: 'النطاقات المجمعة',
      ca_active_components: 'نطاقات المكونات النشطة (CC)',
      ca_no_secondary: 'لا توجد نطاقات ثانوية مجمعة حالياً',
      ca_single_carrier: 'نطاق مفرد 1x',
      ca_multi_carrier: 'تجميع {count}x نطاقات',

      // Diagnostic Advice Engine
      diagnostic_title: 'محرك التحليل والتشخيص الفني',
      active_analysis: 'تحليل نشط',
      diagnostic_awaiting: 'بانتظار لقطة البيانات الخلوية من واجهة الموجه (مثل 192.168.*). انقر فوق "فحص علامة الموجه" أو "فتح واجهة الموجه" لالتقاط البيانات.',
      rule_optimal: 'RSRP عالي + SINR عالي + RSRQ نظيف: أقصى سعة لتعديل التردد (256-QAM) وسرعات نقل قصوى.',
      rule_congested: 'RSRP ثابت + RSRQ مرتفع الحمول (< -14 dB): ازدحام على برج الخلية المخدّم. انخفاض السرعة ناتج عن ضغط الشبكة وليس عن ضعف الإشارة الفيزيائية.',
      rule_interference: 'SINR منخفض (< 8 dB): تشويش وتداخل لاسلكي مرتفع. انحدار نظام التعديل إلى QPSK/16QAM مما يحد من السرعة.',

      // Latest Speedtest
      latest_speedtest: 'آخر قياس سرعة',
      no_tests_recorded: 'لم تسجل اختبارات بعد',
      stat_down: 'تنزيل',
      stat_up: 'رفع',
      stat_ping: 'استجابة',
      stat_jitter: 'تذبذب',
      rf_paired: 'الاقتران اللاسلكي:',
      rf_unpaired: 'أجري الاختبار دون قفل تزامني مع الموجه.',
      rf_pairing_placeholder: 'سيظهر الاقتران اللاسلكي هنا عند القياس.',

      // History Table & Controls
      history_title: 'سجل اختبارات السرعة والاقتران اللاسلكي',
      export_csv: 'تصدير CSV',
      export_json: 'تصدير JSON',
      clear_all_data: 'مسح جميع البيانات',
      search_placeholder: 'بحث بالنطاق، مزود الخدمة، المصدر، أو الملاحظات...',
      source_label: 'المصدر:',
      sort_label: 'ترتيب حسب:',
      source_all: 'جميع المصادر',
      sort_ts_desc: 'الوقت (الأحدث)',
      sort_ts_asc: 'الوقت (الأقدم)',
      sort_dl_desc: 'التنزيل (من الأعلى للأدنى)',
      sort_dl_asc: 'التنزيل (من الأدنى للأعلى)',
      sort_ping_asc: 'الاستجابة (الأقل والأسرع)',
      sort_rsrp_desc: 'RSRP (الإشارة الأقوى)',
      records_count: '{filtered} من {total} سجلات',

      // Table Headers
      th_timestamp: 'الوقت والتاريخ',
      th_source: 'المصدر',
      th_download: 'التنزيل',
      th_upload: 'الرفع',
      th_ping: 'الاستجابة',
      th_jitter: 'التذبذب',
      th_paired_rsrp: 'RSRP المقترن',
      th_paired_sinr: 'SINR المقترن',
      th_band: 'النطاق',
      th_correlation: 'تحليل الاقتران والتشخيص الفني',
      empty_history_title: 'لم يتم تسجيل أي اختبارات سرعة أو اقتران لاسلكي بعد.',
      empty_history_sub: 'قم بإجراء اختبار على Speedtest.net أو Fast.com، أو انقر فوق "التقاط اختبار السرعة" أو "محاكاة البيانات" أعلاه.',
      empty_search_title: 'لم يتم العثور على سجلات تطابق معايير البحث الحالية.',
      empty_search_sub: 'جرب تعديل كلمات البحث أو إعادة تعيين فلتر المصدر.',

      // Actions & Buttons
      scan_router_tab: 'فحص علامة الموجه',
      searching_tabs: 'جاري البحث...',
      capture_speedtest_tab: 'التقاط اختبار السرعة',
      locating_test: 'جاري تحديد الاختبار...',
      simulate_telemetry: 'محاكاة البيانات',
      refresh: 'تحديث',
      open_router_gui: 'فتح واجهة الموجه',
      open_dashboard: 'فتح لوحة التحليلات الكاملة',
      manual_check_router: 'فحص يدوي / مسح علامة الموجه',
      manual_capture_speedtest: 'التقاط يدوي لعلامة السرعة',
      scanning_active_tab: 'جاري فحص الموجه...',
      searching_speedtest_tab: 'جاري البحث عن اختبار السرعة...',
      theme_toggle: 'تبديل المظهر (فاتح / داكن)',
      lang_toggle: 'English',

      // Clear Data Modal
      modal_clear_title: 'مسح جميع البيانات المسجلة',
      modal_clear_message: 'هل أنت متأكد من رغبتك في حذف جميع سجلات اختبار السرعة ولقطات الموجه بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.',
      modal_btn_cancel: 'إلغاء',
      modal_btn_confirm: 'تأكيد الحذف',
      toast_data_cleared: 'تم مسح جميع سجلات التردد اللاسلكي واختبارات السرعة بنجاح.',
      toast_telemetry_simulated: 'تم حقن عينة بيانات لاسلكية واختبار سرعة بنجاح.',

      // General Units
      unit_dbm: 'dBm',
      unit_db: 'dB',
      unit_mbps: 'Mbps',
      unit_ms: 'ms'
    }
  };

  /**
   * Translate key with optional template parameters
   */
  function t(key, lang = 'en', params = {}) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || key;

    for (const p in params) {
      if (Object.prototype.hasOwnProperty.call(params, p)) {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      }
    }
    return text;
  }

  /**
   * Apply language direction and update all DOM elements marked with data-i18n
   */
  function applyLanguage(lang, targetDoc = document) {
    const isAr = lang === 'ar';
    targetDoc.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    targetDoc.documentElement.setAttribute('lang', isAr ? 'ar' : 'en');

    const elements = targetDoc.querySelectorAll('[data-i18n]');
    elements.forEach((elem) => {
      const key = elem.getAttribute('data-i18n');
      if (!key) return;
      const translated = t(key, lang);
      elem.textContent = translated;
    });

    const placeholders = targetDoc.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((elem) => {
      const key = elem.getAttribute('data-i18n-placeholder');
      if (!key) return;
      elem.setAttribute('placeholder', t(key, lang));
    });

    const titles = targetDoc.querySelectorAll('[data-i18n-title]');
    titles.forEach((elem) => {
      const key = elem.getAttribute('data-i18n-title');
      if (!key) return;
      elem.setAttribute('title', t(key, lang));
    });
  }

  return {
    TRANSLATIONS,
    t,
    applyLanguage
  };
});
