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
      empty_history_sub: 'Run a test on Speedtest.net or Fast.com, or click "Capture Speedtest Tab" above.',
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

      // Portals & Quick Links Modal
      portals_modal_btn: 'Portals & Links',
      portals_modal_title: 'Network Portals & Quick Links',
      portals_modal_desc: 'Direct access to your local gateway controls and network benchmark tools with automatic credential injection.',
      portal_router_title: 'Zyxel Router Gateway (192.168.1.1)',
      portal_router_desc: 'Zyxel NR5103E Web Management Console. NetPulse automatically fills configured credentials upon opening.',
      portal_autofill_badge: 'Auto-Fill Active',
      portal_user_label: 'Username',
      portal_pass_label: 'Password',
      portal_btn_launch: 'Launch Portal',
      portal_speedtest_title: 'Speedtest by Ookla (speedtest.net)',
      portal_speedtest_desc: 'Global benchmark for broadband throughput, latency, and jitter with passive NetPulse correlation.',
      portal_fast_title: 'Fast.com by Netflix (fast.com)',
      portal_fast_desc: 'Lightweight Netflix CDN video streaming throughput measurement with automatic live capture.',
      modal_btn_close: 'Close',
      copied_to_clipboard: 'Copied to clipboard',

      // Cross-Page Navigation
      nav_dashboard: 'Telemetry Dashboard',
      nav_analysis: 'Deep RF Analysis',
      nav_options: 'Settings & Gateway',

      // Options & Configuration
      options_title: 'Settings & Gateway Configuration',
      options_subtitle: 'Manage cellular router gateway subnets, credentials, polling frequencies, and automation thresholds.',
      sec_gateway_title: 'Gateway & Subnet Configuration',
      sec_gateway_desc: 'Configure the cellular router IP address and device profile.',
      opt_gateway_ip: 'Router Gateway IP / Subnet',
      opt_gateway_ip_hint: 'Standard default is 192.168.1.1 (Supports 192.168.*.* and 10.*.*.*)',
      opt_router_model: 'Router Device Profile',
      opt_model_zyxel: 'Zyxel NR5103E / NR5101 5G',
      opt_model_huawei: 'Huawei B535 / B818 4G/5G',
      opt_model_zte: 'ZTE MC801A / MC888 5G',
      opt_model_generic: 'Generic Cellular Gateway (Auto-Detect)',
      btn_test_connection: 'Test Gateway Connection',
      sec_creds_title: 'Automated Credential Vault',
      sec_creds_desc: 'Credentials automatically populated into the router web console login form.',
      opt_username: 'Router Username',
      opt_password: 'Router Password',
      opt_autofill_enabled: 'Enable Automatic Credential Injection',
      sec_polling_title: 'Telemetry Polling Engine',
      sec_polling_desc: 'Frequency of background RF metric extraction when router tab is open.',
      opt_poll_fast: 'High Performance (2 seconds)',
      opt_poll_balanced: 'Balanced (5 seconds - Recommended)',
      opt_poll_eco: 'Power Saver (15 seconds)',
      sec_speedtest_title: 'Speedtest & Fast.com Automation',
      sec_speedtest_desc: 'Control passive capture and correlation upon speed test completion.',
      opt_autocapture_speedtest: 'Auto-Capture Speedtest.net Results',
      opt_autocapture_fast: 'Auto-Capture Fast.com Results',
      opt_min_speed_threshold: 'Minimum Speed Threshold to Log (Mbps)',
      sec_alerts_title: 'RF Signal Health Thresholds',
      sec_alerts_desc: 'Configure critical warning thresholds for radio frequency parameters.',
      opt_threshold_rsrp: 'Critical RSRP Threshold (Signal Power)',
      opt_threshold_sinr: 'Critical SINR Threshold (Signal Purity)',
      opt_threshold_rsrq: 'Critical RSRQ Threshold (Tower Load)',
      opt_desktop_notifications: 'Show Desktop Notifications on Threshold Breach',
      sec_backup_title: 'Settings Management',
      btn_save_settings: 'Save Configuration',
      btn_reset_defaults: 'Reset to Factory Defaults',
      btn_export_settings: 'Export Settings (JSON)',
      toast_settings_saved: 'Configuration successfully saved and applied.',
      toast_settings_reset: 'Settings reset to default factory values.',

      // Deep RF Analysis Studio
      analysis_title: 'Deep RF Correlation & Carrier Aggregation Studio',
      analysis_subtitle: 'Multi-layer telemetry waveforms, PCI handover timeline, carrier aggregation component breakdown, and throughput correlation.',
      kpi_dominant_pci: 'DOMINANT PCI',
      kpi_pcc_band: 'PRIMARY BAND (PCC)',
      kpi_agg_bandwidth: 'AGGREGATED BANDWIDTH',
      kpi_handover_count: 'TOWER HANDOVERS',
      kpi_congestion_prob: 'CONGESTION INDEX',
      kpi_correlation_r2: 'RSRP-SPEED FIT (R²)',
      chart_rf_waveform_title: 'Real-Time Multi-Layer RF Waveforms',
      chart_rf_waveform_desc: 'Continuous time-series tracking RSRP signal power, SINR purity, and RSRQ load.',
      legend_rsrp: 'RSRP (Signal Power)',
      legend_sinr: 'SINR (Signal Purity)',
      legend_rsrq: 'RSRQ (Tower Load)',
      chart_handover_title: 'Cell Tower Handover & PCI Ping-Pong Radar',
      chart_handover_desc: 'Monitors modem switching between Physical Cell IDs (PCIs) and detects unstable oscillation.',
      badge_tower_stable: 'Cell Link Stable',
      badge_ping_pong_detected: 'Ping-Pong Oscillation Detected',
      chart_ca_title: 'Carrier Aggregation (CA) Component Matrix',
      chart_ca_desc: 'Visual breakdown of Primary Component Carrier (PCC) and Secondary Carriers (SCC1, SCC2, SCC3).',
      ca_primary_carrier: 'Primary Carrier (PCC)',
      ca_secondary_carrier: 'Secondary Carrier',
      ca_total_capacity: 'Total Aggregated Capacity',
      chart_scatter_title: 'RF vs Throughput Scatter Matrix & Diagnostic Quadrants',
      chart_scatter_desc: 'Correlates Download Throughput against RSRP and Upload Throughput against SINR.',
      quadrant_optimal: 'Optimal Radio & Backhaul',
      quadrant_obstruction: 'Radio Signal Obstruction',
      quadrant_congestion: 'Tower Backhaul Congestion',
      quadrant_efficient: 'High Modulation Efficiency',
      diag_cause_label: 'Primary Diagnostic Diagnosis',
      diag_reposition_antenna: 'Signal Obstruction Detected: Reposition router or aim external antenna to increase RSRP.',
      diag_backhaul_congestion: 'Tower Congestion Detected: Signal is strong, but cell tower backhaul is saturated during peak hours.',
      diag_optimal_state: 'System Balanced: Both RF reception and ISP tower backhaul throughput are operating at peak efficiency.',
      btn_export_analysis: 'Export Analytical Audit (CSV)',
      btn_sync_telemetry: 'Sync with Dashboard',
      btn_clear_analysis: 'Clear History',
      confirm_clear_analysis: 'Are you sure you want to permanently clear all historical telemetry records? This cannot be undone.',
      toast_analysis_cleared: 'All analytical telemetry records have been cleared.',
      toast_telemetry_synced: 'Telemetry successfully synced with Dashboard.',
      modal_clear_analysis_title: 'Clear Analytical History',
      modal_clear_analysis_message: 'Are you sure you want to permanently clear all historical RF waveforms, handover records, and throughput correlation logs? This action cannot be undone.',

      // Hourly History Audit Page & AI Analysis Export
      nav_history: 'Hourly Audit',
      view_history_reports: 'View History Reports',
      hourly_audit_title: 'Hourly Historical Audit & Diagnostic Studio',
      hourly_audit_sub: 'Hourly audit blocks, speedtest aggregates, and one-click AI analysis formatting',
      filter_date: 'Date:',
      filter_all_dates: 'All Dates',
      btn_copy_ai: 'Copy for AI Analysis',
      toast_copied_ai: 'Copied to clipboard formatted for AI analysis',
      hourly_empty_title: 'No Hourly Records Available',
      hourly_empty_desc: 'Run speedtests or connect your cellular router to automatically populate hourly audit blocks.',
      router_data_unavailable: 'Router data unavailable for this hour',
      hourly_tests_count: '{count} Tests Completed',
      hourly_router_snapshots: '{count} RF Snapshots',
      hourly_avg_down: 'Hourly Avg Down',
      hourly_avg_up: 'Hourly Avg Up',
      hourly_avg_ping: 'Hourly Avg Ping',
      hourly_best_down: 'Peak Download',
      view_screenshot: 'Screenshot',
      close_modal: 'Close',

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
      empty_history_sub: 'قم بإجراء اختبار على Speedtest.net أو Fast.com، أو انقر فوق "التقاط اختبار السرعة" أعلاه.',
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

      // Portals & Quick Links Modal
      portals_modal_btn: 'روابط البوابات',
      portals_modal_title: 'بوابات الشبكة والروابط السريعة',
      portals_modal_desc: 'وصول فوري للوحة تحكم الراوتر المحلي وأدوات قياس الشبكة مع التعبئة التلقائية لبيانات الدخول.',
      portal_router_title: 'بوابة الراوتر Zyxel (192.168.1.1)',
      portal_router_desc: 'لوحة تحكم راوتر Zyxel NR5103E. يقوم NetPulse بتعبئة بيانات الدخول المحددة تلقائياً فور الفتح.',
      portal_autofill_badge: 'التعبئة التلقائية مفعلة',
      portal_user_label: 'اسم المستخدم',
      portal_pass_label: 'كلمة المرور',
      portal_btn_launch: 'فتح البوابة',
      portal_speedtest_title: 'مقياس Speedtest (speedtest.net)',
      portal_speedtest_desc: 'المعيار العالمي لقياس سعة النطاق الترددي وزمن الاستجابة مع الربط التلقائي في NetPulse.',
      portal_fast_title: 'مقياس Fast.com (fast.com)',
      portal_fast_desc: 'قياس مباشر لسرعة التنزيل عبر خوادم شبكة نتفليكس مع الالتقاط التلقائي.',
      modal_btn_close: 'إغلاق',
      copied_to_clipboard: 'تم النسخ إلى الحافظة',

      // Cross-Page Navigation
      nav_dashboard: 'لوحة التحكم',
      nav_analysis: 'التحليل العميق للإشارة',
      nav_options: 'الإعدادات والبوابة',

      // Options & Configuration
      options_title: 'الإعدادات وتكوين البوابة',
      options_subtitle: 'إدارة نطاقات عناوين الموجه الخلوي، وبيانات الاعتماد، ومعدلات الفحص، وحدود التنبيهات.',
      sec_gateway_title: 'تكوين البوابة والشبكة الفرعية',
      sec_gateway_desc: 'تحديد عنوان IP الخاص بالموجه الخلوي ونوع الجهاز.',
      opt_gateway_ip: 'عنوان IP / نطاق الموجه',
      opt_gateway_ip_hint: 'الافتراضي هو 192.168.1.1 (يدعم 192.168.*.* و 10.*.*.*)',
      opt_router_model: 'نوع جهاز الموجه',
      opt_model_zyxel: 'Zyxel NR5103E / NR5101 الجيل الخامس',
      opt_model_huawei: 'هواوي B535 / B818 الجيل الرابع والخامس',
      opt_model_zte: 'زد تي إي MC801A / MC888 الجيل الخامس',
      opt_model_generic: 'موجه خلوي عام (اكتشاف تلقائي)',
      btn_test_connection: 'اختبار الاتصال بالبوابة',
      sec_creds_title: 'خزنة بيانات الاعتماد التلقائية',
      sec_creds_desc: 'بيانات الاعتماد التي يتم تعبئتها تلقائياً في صفحة تسجيل الدخول للموجه.',
      opt_username: 'اسم مستخدم الموجه',
      opt_password: 'كلمة مرور الموجه',
      opt_autofill_enabled: 'تفعيل التعبئة التلقائية لبيانات الاعتماد',
      sec_polling_title: 'محرك سحب بيانات الإشارة',
      sec_polling_desc: 'معدل تكرار سحب مؤشرات التردد اللاسلكي عند فتح صفحة الموجه.',
      opt_poll_fast: 'أداء عالي (كل ثانيتين)',
      opt_poll_balanced: 'متوازن (كل 5 ثوانٍ - مستحسن)',
      opt_poll_eco: 'توفير الطاقة (كل 15 ثانية)',
      sec_speedtest_title: 'أتمتة اختبارات السرعة',
      sec_speedtest_desc: 'التحكم في الالتقاط التلقائي وربطه مع إشارة الموجه فور انتهاء الاختبار.',
      opt_autocapture_speedtest: 'الالتقاط التلقائي لنتائج Speedtest.net',
      opt_autocapture_fast: 'الالتقاط التلقائي لنتائج Fast.com',
      opt_min_speed_threshold: 'الحد الأدنى للسرعة لتسجيل الاختبار (ميجابت)',
      sec_alerts_title: 'حدود تنبيهات صحة الإشارة الخلوية',
      sec_alerts_desc: 'تحديد قيم التحذير الحرجة لمؤشرات التردد اللاسلكي.',
      opt_threshold_rsrp: 'حد RSRP الحرج (قدرة الإشارة)',
      opt_threshold_sinr: 'حد SINR الحرج (نقاء الإشارة)',
      opt_threshold_rsrq: 'حد RSRQ الحرج (حمل البرج)',
      opt_desktop_notifications: 'إظهار إشعارات سطح المكتب عند انخفاض الإشارة',
      sec_backup_title: 'إدارة الإعدادات',
      btn_save_settings: 'حفظ الإعدادات',
      btn_reset_defaults: 'استعادة الإعدادات الافتراضية',
      btn_export_settings: 'تصدير الإعدادات (JSON)',
      toast_settings_saved: 'تم حفظ الإعدادات وتطبيقها بنجاح.',
      toast_settings_reset: 'تمت استعادة الإعدادات الافتراضية للمصنع.',

      // Deep RF Analysis Studio
      analysis_title: 'استوديو التحليل العميق للتردد اللاسلكي ودمج الترددات',
      analysis_subtitle: 'موجات الإشارة متعددة الطبقات، سجل تبديل الأبراج والخلايا، تفكيك حزم دمج الترددات، ومصفوفة ارتباط سرعة النقل.',
      kpi_dominant_pci: 'معرّف الخلية المهيمنة',
      kpi_pcc_band: 'النطاق الأساسي (PCC)',
      kpi_agg_bandwidth: 'إجمالي النطاق الترددي المدمج',
      kpi_handover_count: 'عمليات تبديل البرج',
      kpi_congestion_prob: 'مؤشر الازدحام',
      kpi_correlation_r2: 'ارتباط الإشارة بالسرعة (R²)',
      chart_rf_waveform_title: 'موجات التردد اللاسلكي المباشرة متعددة الطبقات',
      chart_rf_waveform_desc: 'تتبع زمني مستمر لقوة إشارة RSRP، ونقاء SINR، وحمل البرج RSRQ.',
      legend_rsrp: 'RSRP (قدرة الإشارة)',
      legend_sinr: 'SINR (نقاء الإشارة)',
      legend_rsrq: 'RSRQ (حمل البرج)',
      chart_handover_title: 'رادار تبديل أبراج الخلايا واستقرار البرج',
      chart_handover_desc: 'يراقب تبديل المودم بين معرّفات الخلايا (PCI) ويرصد التذبذب غير المستقر.',
      badge_tower_stable: 'اتصال البرج مستقر',
      badge_ping_pong_detected: 'تم رصد تذبذب وتكرار تبديل البرج',
      chart_ca_title: 'مصفوفة مكونات دمج الترددات (Carrier Aggregation)',
      chart_ca_desc: 'تفكيك مرئي للنطاق الأساسي (PCC) والنطاقات التكميلية الثانوية (SCC).',
      ca_primary_carrier: 'النطاق الترددي الأساسي (PCC)',
      ca_secondary_carrier: 'نطاق ترددي تكميلي',
      ca_total_capacity: 'إجمالي سعة التردد المدمجة',
      chart_scatter_title: 'مصفوفة تناثر الإشارة مقابل السرعة وأرباع التشخيص',
      chart_scatter_desc: 'يربط سرعة التنزيل مع RSRP وسرعة الرفع مع SINR.',
      quadrant_optimal: 'إشارة وبرج بحالة مثالية',
      quadrant_obstruction: 'عائق في وصول الإشارة اللاسلكية',
      quadrant_congestion: 'ازدحام خانق على شبكة البرج',
      quadrant_efficient: 'كفاءة تعديل رقمي عالية',
      diag_cause_label: 'التشخيص الأساسي لحالة الشبكة',
      diag_reposition_antenna: 'رصد عائق في الإشارة: يُنصح بتغيير موضع الموجه أو توجيه الهوائي لرفع RSRP.',
      diag_backhaul_congestion: 'رصد ازدحام على البرج: الإشارة قوية لكن سعة البرج ممتلئة في ساعات الذروة.',
      btn_export_analysis: 'تصدير تدقيق التحليل (CSV)',
      btn_sync_telemetry: 'مزامنة مع لوحة التحكم',
      btn_clear_analysis: 'مسح السجل',
      confirm_clear_analysis: 'هل أنت متأكد من مسح جميع سجلات الإشارة واختبارات السرعة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      toast_analysis_cleared: 'تم مسح جميع سجلات التحليل والإشارة بالكامل.',
      toast_telemetry_synced: 'تمت مزامنة البيانات مع لوحة التحكم بنجاح.',
      modal_clear_analysis_title: 'مسح سجل التحليلات',
      modal_clear_analysis_message: 'هل أنت متأكد من مسح جميع موجات الإشارة اللاسلكية، وسجلات التبديل، وتحليلات السرعة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',

      // Hourly History Audit Page & AI Analysis Export
      nav_history: 'سجل التدقيق الساعي',
      view_history_reports: 'عرض تقارير السجل',
      hourly_audit_title: 'استوديو التدقيق الساعي والتحليل التاريخي',
      hourly_audit_sub: 'كتل التدقيق الساعي، وتجميع اختبارات السرعة، والتنسيق الفوري لتحليل الذكاء الاصطناعي',
      filter_date: 'التاريخ:',
      filter_all_dates: 'جميع التواريخ',
      btn_copy_ai: 'نسخ للتحليل بالذكاء الاصطناعي',
      toast_copied_ai: 'تم النسخ إلى الحافظة بتنسيق التحليل بالذكاء الاصطناعي',
      hourly_empty_title: 'لا توجد سجلات ساعية متاحة',
      hourly_empty_desc: 'قم بإجراء اختبارات السرعة أو ربط موجه الشبكة لبدء تجميع كتل التدقيق الساعي تلقائياً.',
      router_data_unavailable: 'بيانات الموجه غير متوفرة لهذه الساعة',
      hourly_tests_count: '{count} اختبارات منجزة',
      hourly_router_snapshots: '{count} لقطات إشارة',
      hourly_avg_down: 'متوسط التنزيل الساعي',
      hourly_avg_up: 'متوسط الرفع الساعي',
      hourly_avg_ping: 'متوسط الاستجابة الساعي',
      hourly_best_down: 'أعلى سرعة تنزيل',
      view_screenshot: 'لقطة الشاشة',
      close_modal: 'إغلاق',

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
