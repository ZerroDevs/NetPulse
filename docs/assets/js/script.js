/**
 * NetPulse - Documentation Engine Controller
 * Handles English / Arabic RTL translations, theme persistence,
 * real-time live search filtering, and 1-click prompt copy actions.
 */

(function () {
  'use strict';

  let currentLang = 'en';
  let currentTheme = 'dark';

  const TRANSLATIONS = {
    en: {
      doc_title: 'NetPulse Documentation',
      doc_sub: 'Cellular RF Telemetry & Speedtest Correlation Engine',
      search_ph: 'Search docs (e.g. SINR, IP, CSV)...',
      search_commits_ph: 'Search commits...',

      nav_docs_home: 'Docs Home',
      nav_changelog: 'Changelog',
      nav_antenna: '5G Antenna Guide',
      nav_privacy: 'Privacy Policy',
      nav_developer: 'Developer API',

      nav_overview: 'Overview & Features',
      nav_install: 'Installation & Setup',
      nav_gateways: 'Gateway IPs & Compatibility',
      nav_dashboard: 'Telemetry Dashboard',
      nav_rf_matrix: 'RF Benchmark Matrix',
      nav_analysis: 'Deep RF Studio',
      nav_history: 'Hourly Audit & AI',
      nav_isp: 'ISP Complaint Generator',
      nav_faq: 'FAQ & Troubleshooting',
      nav_settings: 'Settings & Gateway',
      nav_author: 'Author & Open Source',

      hero_title: 'NetPulse Complete Guide & Documentation',
      hero_desc: 'Comprehensive technical guide on installation, router RF telemetry extraction, signal quality benchmarks, speed test pairing, hourly rollups, AI diagnostic reports, and gateway configuration.',

      sec_overview_title: 'Overview & Architecture',
      overview_p1: 'NetPulse is a Manifest V3 browser extension engineered to bridge physical radio-frequency (RF) cellular signal metrics (RSRP, SINR, RSRQ, RSSI, Cell ID, Bandwidth, Carrier Aggregation) with real network speed benchmarks (Speedtest.net, Fast.com).',
      overview_p2: 'Designed specifically for 5G and 4G LTE Fixed Wireless Access (FWA) routers (Zyxel NR5103E, Huawei, ZTE, Nokia, Mikrotik), NetPulse extracts live radio stats without modifying router firmware and pairs each speed test with the exact RF signal snapshot.',
      overview_privacy_title: '100% Privacy Guarantee:',
      overview_privacy_desc: 'All telemetry data is saved locally inside chrome.storage.local. Zero tracking or telemetry data is ever sent to external servers.',

      sec_install_title: 'Installation & Developer Setup',
      install_step1: 'Download or clone the repository from GitHub: https://github.com/ZerroDevs/NetPulse',
      install_step2: 'Open Google Chrome or Microsoft Edge and navigate to chrome://extensions or edge://extensions.',
      install_step3: 'Enable Developer Mode in the top-right corner of the extensions page.',
      install_step4: 'Click "Load unpacked" and select the NetPulse directory (or unzip release/NetPulse.zip and select the folder).',
      install_step5: 'Pin the NetPulse extension icon to your browser toolbar for quick access.',

      sec_gateways_title: 'Gateway Default IPs & Auto-Detect Matrix',
      gateways_desc: 'NetPulse features auto-detection across standard private IP subnets (192.168.*.*, 10.*.*.*, 172.16.*.*). Reference default router addresses below:',
      gw_zyxel_title: 'Zyxel 5G / 4G Gateways',
      gw_zyxel_models: 'NR5103E, NR5103, Three Hub 5G, EE Smart Hub 2',
      gw_huawei_title: 'Huawei CPE Routers',
      gw_huawei_models: '5G CPE Pro (H112/H122), B535, B818, B525',
      gw_zte_title: 'ZTE 5G Routers',
      gw_zte_models: 'MC801A, MC801, Hyperbox 5G, MC888',
      gw_nokia_title: 'Nokia & Generic Gateways',
      gw_nokia_models: 'Nokia FastMile 5G, Alcatel HH70, Netgear Nighthawk',
      gw_auto_title: 'Generic Auto-Detect Engine',
      gw_auto_models: 'Scans all local subnets automatically during browser tab navigation',

      sec_dash_title: '1. Telemetry Dashboard',
      dash_desc: 'The main dashboard provides real-time RF signal meters, carrier aggregation details, and paired speed test history.',
      dash_cap1: 'Live RF Signal Gauges: Real-time visual progress meters for RSRP (Signal Power), SINR (Purity), RSRQ (Tower Load), and RSSI (Signal Level).',
      dash_cap2: 'Carrier Aggregation Breakdown: Primary Band (PCC), Physical Cell ID (PCI), Cell ID, Downlink/Uplink Bandwidths, and Secondary Component Carriers (SCC1, SCC2, etc.).',
      dash_cap3: 'Multi-Select Record Merge: Select 2 or more log rows using checkboxes to average speed test metrics while retaining paired router signal telemetry.',
      dash_cap4: 'Per-Row Delete: Hover over any entry row to reveal the trash icon button and confirm deletion via modal.',
      dash_cap5: 'Export Options: Export complete telemetry log history to CSV or JSON format with 1-click.',
      dash_img_cap: 'Figure 1: NetPulse Telemetry Dashboard Interface with Live Gauges and Multi-Select Record Merge Bar.',

      sec_rf_title: 'Signal Quality Reference Chart (RF Benchmark Matrix)',
      rf_desc: 'Use this standardized rating matrix to evaluate 5G NR and 4G LTE physical layer radio signal conditions:',
      rf_th_metric: 'Radio Metric',
      rf_th_excellent: 'Excellent (Green)',
      rf_th_good: 'Good (Blue)',
      rf_th_fair: 'Fair (Amber)',
      rf_th_poor: 'Poor (Rose)',
      rf_th_action: 'Troubleshooting Action',
      rf_advice_rsrp: 'If RSRP < -105 dBm, move router closer to an elevated window facing the nearest cellular tower.',
      rf_advice_sinr: 'If SINR < 0 dB, rotate antenna/router 15° away from interference sources (microwaves, power supplies).',
      rf_advice_rsrq: 'If RSRQ < -14 dB, the cell tower is congested. Use Band Locking to switch to a less congested secondary band.',
      rf_advice_cqi: 'If CQI < 7, connection modulation drops to QPSK. Re-orient router to achieve higher QAM modulation.',

      sec_analysis_title: '2. Deep RF Correlation Studio',
      analysis_desc: 'The Deep RF Studio provides advanced visual waveforms and scatter correlation matrices for in-depth network diagnostics.',
      analysis_cap1: 'RF Waveform Timeline: Multi-layer continuous time-series tracking RSRP power, SINR purity, and RSRQ tower load.',
      analysis_cap2: 'PCI Handover Tracker: Monitors tower handovers between Cell IDs to identify cell ping-pong instability.',
      analysis_cap3: 'Signal vs. Speed Scatter Matrix: Maps RSRP vs. Download speed and SINR vs. Upload speed to isolate cell congestion from radio path loss.',
      analysis_cap4: 'Live Auto-Sync Engine: Continuously updates waveforms from active router background telemetry.',
      analysis_img_cap: 'Figure 2: Deep RF Correlation & Carrier Aggregation Studio with Waveform Timeline and Scatter Quadrants.',

      sec_history_title: '3. Hourly Audit Studio & AI Prompt Generator',
      history_desc: 'Organizes connection logs into 1-hour time blocks and generates AI diagnostic reports for LLM analysis.',
      history_cap1: 'Hourly Accordion Blocks: Consolidates tests into 1-hour windows (e.g. 02:00 - 02:59) showing hourly averages and peak speeds.',
      history_cap2: '1-Click "Copy for AI Analysis": Formats hourly cellular metrics and speed runs into clean Markdown prompt queries optimized for ChatGPT, Claude, and Gemini.',
      history_cap3: 'Date & Provider Filters: Instantly search history by date or test platform (Speedtest.net vs Fast.com).',
      history_cap4: 'Screenshot Viewer: Click screenshot badges to view full-screen result capture modals.',
      history_img_cap: 'Figure 3: Hourly History Audit Studio showing 1-Hour Accordion Blocks and AI Report Copy Tool.',

      sec_isp_title: 'Official ISP Complaint & AI Prompt Generator',
      isp_desc: 'Generate a standardized technical report containing raw RF telemetry snapshots and speed test logs to submit directly to your ISP support or run through ChatGPT / Claude for analysis.',
      isp_copy_btn: 'Copy Official ISP Complaint Report',
      isp_copied_toast: 'Report copied to clipboard successfully!',

      sec_faq_title: 'Frequently Asked Questions & Troubleshooting',
      faq_desc: 'Solutions to common questions and troubleshooting steps for router telemetry connections:',
      faq_q1: 'Why are signal gauges displaying "N/A"?',
      faq_a1: 'Signal metrics show N/A when NetPulse cannot communicate with your router. Fixes: 1) Verify Gateway IP in Settings (default 192.168.1.1). 2) Log into your router admin page in another tab to keep the session active. 3) Ensure your router is powered on and connected to your PC.',
      faq_q2: 'Can I run hourly speed tests while my PC is locked?',
      faq_a2: 'Yes! NetPulse utilizes Chrome Background Alarms and Service Workers (Manifest V3). As long as your browser remains open in the background, scheduled hourly tests will execute automatically.',
      faq_q3: 'How do I submit telemetry reports to my ISP for speed complaints?',
      faq_a3: 'Use the "ISP Complaint Generator" section above. Click "Copy Official ISP Complaint Report" to copy a pre-formatted technical ticket including your exact RSRP, SINR, Cell ID, and speed test averages. You can attach this to your ISP support ticket.',
      faq_q4: 'Is my router model supported?',
      faq_a4: 'NetPulse works out-of-the-box with Zyxel NR5103E / NR5103, Huawei 5G CPE Pro series, ZTE MC801A, Nokia FastMile, and generic routers operating on standard private subnets (192.168.*.*, 10.*.*.*).',
      faq_q5: 'How do I export historical RF data to CSV or JSON?',
      faq_a5: 'Open the Telemetry Dashboard and click the "Export CSV" or "Export JSON" buttons in the top action toolbar to download your complete historical database.',

      sec_settings_title: '4. Settings & Gateway Configuration',
      settings_desc: 'Allows users to configure router credentials, polling frequencies, auto-capture rules, and critical RF thresholds.',
      settings_cap1: 'Subnet & Router Profile: Support for 192.168.1.1, 192.168.*.*, 10.*.*.*, and device profiles (Zyxel, Huawei, ZTE, Generic).',
      settings_cap2: 'Automated Credential Vault: Secure administrative username and password storage with multi-pass reactive form injection.',
      settings_cap3: 'Polling Engine Rates: Configurable polling intervals (2 seconds High Performance, 5 seconds Balanced, 15 seconds Power Saver).',
      settings_cap4: 'RF Health Threshold Sliders: Customize critical alert warning thresholds for RSRP and SINR degradation.',
      settings_img_cap: 'Figure 4: Settings Studio with Gateway Subnet Configuration, Credential Manager, and Polling Rates.',

      sec_author_title: 'Author, Credits & Open Source License',
      author_desc: 'NetPulse is created and maintained as an open-source project under the MIT License.',
      author_made_by: 'Made by Osama Abdallatif',
      author_whatsapp: 'Contact on WhatsApp (+218 916808225)',
      author_github: 'Lead Developer Profile (@ZerroDevs)',
      author_repo: 'Official GitHub Repository (ZerroDevs/NetPulse)',
      author_license: 'Released under the MIT License. Copyright (c) 2026 ZerroDevs.',

      cl_title: 'NetPulse Changelog',
      cl_sub: 'Commit History & Release Timeline',
      cl_hero_title: 'NetPulse Release History & Changelog',
      cl_hero_desc: 'Complete timeline of commits, structural updates, feature releases, and optimizations for NetPulse.',
      cl_sec_commits: 'Git Commit History',

      ant_title: '5G Antenna Placement Guide',
      ant_sub: 'RF Signal Tuning & Path Loss Calculator',
      ant_hero_title: 'Interactive 5G Antenna Tuning & RF Placement Calculator',
      ant_hero_desc: 'Calculate your estimated throughput penalty based on current RSRP and SINR metrics, and optimize your 4x4 MIMO router positioning.',
      ant_calc_title: 'RF Placement & Path Loss Calculator',
      ant_lbl_rsrp: 'Enter RSRP (Signal Power in dBm):',
      ant_lbl_sinr: 'Enter SINR (Signal Purity in dB):',
      ant_mimo_title: '4x4 MIMO Antenna Cross-Polarization Guide',
      ant_mimo_desc: 'For external TS9 / SMA antennas, ensure dual elements are angled at ±45° (slant cross-polarization) to align with cell tower transmit arrays:',
      ant_mimo_tip1: 'Element A (+45°): Primary Downlink/Uplink transceiver array.',
      ant_mimo_tip2: 'Element B (-45°): Secondary Downlink diversity receiver.',
      ant_mimo_tip3: 'Line of Sight (LoS): Elevate antenna above rooflines to clear tree foliage and building obstacles.',

      priv_title: 'NetPulse Privacy Policy',
      priv_sub: '100% Local Storage & Zero Tracking Guarantee',
      priv_hero_title: 'NetPulse Privacy Policy & Security Assurance',
      priv_hero_desc: 'Your telemetry data is 100% private, saved locally in your browser, and never shared or uploaded to third-party servers.',
      priv_sec_guarantee: 'Core Privacy Commitments',
      priv_p1: 'Local Storage Only: All cellular signal metrics (RSRP, SINR, Cell ID) and speedtest results are stored exclusively in chrome.storage.local inside your browser.',
      priv_p2: 'Zero Analytics / Tracking: NetPulse contains zero tracking scripts, zero telemetry trackers, and zero Google Analytics.',
      priv_p3: 'No External Data Transmission: Router stats and credentials never leave your local machine or your local subnet (192.168.*.*, 10.*.*.*).',
      priv_p4: 'Open Source Auditability: The complete source code is publicly accessible on GitHub under the MIT License for community security auditing.',

      dev_title: 'NetPulse Developer Guide',
      dev_sub: 'Internal Message Bus & JSON Schemas',
      dev_hero_title: 'NetPulse Extension API & Architecture Reference',
      dev_hero_desc: 'Technical specification of internal messaging bus, background alarms, and JSON data schemas.'
    },

    ar: {
      doc_title: 'توثيق ودليل NetPulse',
      doc_sub: 'محرك أداء وقياس الإشارة اللاسلكية واختبارات السرعة',
      search_ph: 'البحث في التوثيق (مثال: SINR, IP, CSV)...',
      search_commits_ph: 'البحث في السجلات...',

      nav_docs_home: 'رئيسية التوثيق',
      nav_changelog: 'سجل التغييرات',
      nav_antenna: 'دليل الهوائي',
      nav_privacy: 'سياسة الخصوصية',
      nav_developer: 'دليل المطورين',

      nav_overview: 'نظرة عامة والمميزات',
      nav_install: 'التثبيت والتهيئة',
      nav_gateways: 'عناوين الموجه والتوافق',
      nav_dashboard: 'لوحة التحكم الرئيسية',
      nav_rf_matrix: 'جدول تقييم الإشارة',
      nav_analysis: 'استوديو التحليل العميق',
      nav_history: 'التدقيق الساعي والذكاء الاصطناعي',
      nav_isp: 'مولد شكاوى الاتصالات',
      nav_faq: 'الأسئلة الشائعة وتصحيح الأعطال',
      nav_settings: 'الإعدادات والبوابة',
      nav_author: 'المطور وحقوق الاستخدام',

      hero_title: 'الدليل الكامل وتوثيق استخدام NetPulse',
      hero_desc: 'دليل فني شامل لشرح التثبيت، واستخراج بيانات التردد اللاسلكي من الموجه، وتقييم جودة الإشارة، وربط اختبارات السرعة، والتجميع الساعي، وتوليد تقارير الذكاء الاصطناعي، وإعدادات البوابة.',

      sec_overview_title: 'النظرة العامة وبنية النظام',
      overview_p1: 'محرك NetPulse هو إضافة متصفح مبنية بمعيار Manifest V3 تم تطويرها لربط قياسات الإشارة اللاسلكية الخلوية (RSRP, SINR, RSRQ, RSSI, Cell ID, Bandwidth, Carrier Aggregation) مع نتائج اختبارات السرعة الفعلية (Speedtest.net, Fast.com).',
      overview_p2: 'تم تصميم الأداة خصيصاً لموجهات 5G و4G LTE المنزلية (Zyxel NR5103E, Huawei, ZTE, Nokia, Mikrotik) لجلب البيانات المباشرة بدون الحاجة لتعديل البرمجيات الأصلية للموجه.',
      overview_privacy_title: 'ضمان الخصوصية 100%:',
      overview_privacy_desc: 'جميع البيانات تُحفظ محلياً داخل التخزين المحلي chrome.storage.local. لا يتم إرسال أي بيانات لخوادم خارجية نهائياً.',

      sec_install_title: 'التثبيت والتهيئة',
      install_step1: 'قم بتنزيل أو نسخ المستودع من GitHub: https://github.com/ZerroDevs/NetPulse',
      install_step2: 'افتح متصفح Google Chrome أو Microsoft Edge وانتقل إلى chrome://extensions أو edge://extensions.',
      install_step3: 'قم بتفعيل وضع المطور (Developer Mode) من الزاوية العلوية.',
      install_step4: 'انقر على "تحميل إضافة مفكوكة" (Load unpacked) واختر مجلد NetPulse (أو فك الضغط عن release/NetPulse.zip واختر المجلد).',
      install_step5: 'قم بتثبيت أيقونة NetPulse في شريط أدوات المتصفح للوصول السريع.',

      sec_gateways_title: 'عناوين الموجهات الافتراضية ومصفوفة الكشف التلقائي',
      gateways_desc: 'يدعم NetPulse الكشف التلقائي للموجهات عبر الشبكات الفرعية (192.168.*.*, 10.*.*.*, 172.16.*.*). ابحث عن عنوان موجهك الافتراضي أدناه:',
      gw_zyxel_title: 'موجهات Zyxel 5G / 4G',
      gw_zyxel_models: 'NR5103E, NR5103, Three Hub 5G, EE Smart Hub 2',
      gw_huawei_title: 'موجهات Huawei CPE',
      gw_huawei_models: '5G CPE Pro (H112/H122), B535, B818, B525',
      gw_zte_title: 'موجهات ZTE 5G',
      gw_zte_models: 'MC801A, MC801, Hyperbox 5G, MC888',
      gw_nokia_title: 'موجهات Nokia والموجهات العامة',
      gw_nokia_models: 'Nokia FastMile 5G, Alcatel HH70, Netgear Nighthawk',
      gw_auto_title: 'محرك الكشف التلقائي الذكي',
      gw_auto_models: 'يمسح جميع الشبكات الفرعية محلياً تلقائياً أثناء التصفح',

      sec_dash_title: '1. لوحة التحكم الرئيسية (Dashboard)',
      dash_desc: 'توفر لوحة التحكم مقاييس الإشارة المباشرة، وتفاصيل دمج الترددات، وسجل اختبارات السرعة المربوط بالإشارة.',
      dash_cap1: 'مؤشرات الإشارة المباشرة: عدادات مرئية فورية لقوة الإشارة RSRP، ونقاء SINR، وحمل البرج RSRQ، ومستوى الإشارة RSSI.',
      dash_cap2: 'تفاصيل دمج الترددات: النطاق الأساسي (PCC)، معرّف الخلية (PCI)، النطاق الترددي، والنطاقات الثانوية المدمجة (SCC1, SCC2).',
      dash_cap3: 'دمج السجلات المتعددة: اختر سجلين أو أكثر باستخدام مربعات الاختيار لشريط الدمج لحساب متوسط السرعات مع الاحتفاظ ببيانات الإشارة.',
      dash_cap4: 'حذف سجل منفرد: تمرير المؤشر فوق أي سجل يظهر أيقونة سلة المهملات للحذف الفوري مع نافذة تأكيد.',
      dash_cap5: 'خيارات التصدير: تصدير سجل القياسات بالكامل إلى ملفات CSV أو JSON بنقرة واحدة.',
      dash_img_cap: 'شكل 1: واجهة لوحة التحكم الرئيسية NetPulse مع عدادات الإشارة وشريط دمج السجلات.',

      sec_rf_title: 'جدول تقييم وقوة الإشارة اللاسلكية (RF Benchmarks)',
      rf_desc: 'استخدم هذا الجدول المرجعي لتقييم إشارات 5G و4G LTE الفيزيائية لتشخيص جودة الاتصال بموجهك:',
      rf_th_metric: 'مقياس الإشارة',
      rf_th_excellent: 'ممتاز (أخضر)',
      rf_th_good: 'جيد (أزرق)',
      rf_th_fair: 'مقبول (أصفر)',
      rf_th_poor: 'ضعيف (أحمر)',
      rf_th_action: 'إجراء تحسين الاتصال',
      rf_advice_rsrp: 'إذا كان RSRP أقل من -105 dBm، انقل الموجه بالقرب من نافذة مرتفعة تطل على برج الاتصالات.',
      rf_advice_sinr: 'إذا كان SINR أقل من 0 dB، ادر الموجه/الهوائي 15 درجة بعيداً عن مصادر التداخل الكهربائي (الميكروويف ومحولات الطاقة).',
      rf_advice_rsrq: 'إذا كان RSRQ أقل من -14 dB، فالبرج يعاني من ازدحام شديد. استخدم قفل التردد للتبديل لنطاق ثانوي أقل ازدحاماً.',
      rf_advice_cqi: 'إذا كان CQI أقل من 7، ينخفض التضمين إلى QPSK. اعد توجيه الموجه للحصول على تضمين QAM أعلى.',

      sec_analysis_title: '2. استوديو التحليل العميق للتردد اللاسلكي',
      analysis_desc: 'يوفر استوديو التحليل العميق مخططات زمنيّة ومصفوفات ارتباط مرئية لتشخيص أداء الشبكة بدقة.',
      analysis_cap1: 'موجات الإشارة الزمنية: تتبع مستمر لقوة RSRP ونقاء SINR وحمل البرج RSRQ.',
      analysis_cap2: 'رادار تبديل الأبراج: يرصد التبديل بين معرّفات الخلايا (PCI) ويكشف تذبذب البرج.',
      analysis_cap3: 'مصفوفة تناثر الإشارة مقابل السرعة: يربط RSRP مع سرعة التنزيل وSINR مع سرعة الرفع لتمييز ازدحام البرج عن ضعف الإشارة.',
      analysis_cap4: 'محرك المزامنة التلقائية المباشرة: يحدد المخططات تلقائياً من بيانات الموجه في الخلفية.',
      analysis_img_cap: 'شكل 2: استوديو التحليل العميق للتردد اللاسلكي ومصفوفة تناثر الإشارة وتفكيك الترددات.',

      sec_history_title: '3. استوديو التدقيق الساعي ومولد تقارير الذكاء الاصطناعي',
      history_desc: 'ينظم سجلات الاتصال في كتل ساعية ويولد تقارير تشخيصية جاهزة لنماذج الذكاء الاصطناعي.',
      history_cap1: 'كتل التدقيق الساعي: تجميع الاختبارات في فترات ساعية (مثل 02:00 - 02:59) مع عرض المتوسطات وأعلى سرعة.',
      history_cap2: 'زر "نسخ للتحليل بالذكاء الاصطناعي": ينسق بيانات الإشارة والسرعات في نص Markdown محسّن لـ ChatGPT وClaude وGemini.',
      history_cap3: 'فلترة التواريخ والمزودين: البحث الفوري بالتاريخ أو منصة الاختبار (Speedtest.net مقابل Fast.com).',
      history_cap4: 'عارض لقطات الشاشة: انقر على شارة لقطة الشاشة لعرض النتيجة بالكامل.',
      history_img_cap: 'شكل 3: استوديو التدقيق الساعي يظهر كتل الساعات وأداة نسخ التقرير بالذكاء الاصطناعي.',

      sec_isp_title: 'مولد شكاوى شركات الاتصال وتقارير الذكاء الاصطناعي',
      isp_desc: 'إنشاء تقرير فني موحد يحتوي على لقطات الإشارة اللاسلكية واختبارات السرعة لتقديمه مباشرة للدعم الفني لمزود الخدمة أو تحليله عبر ChatGPT / Claude.',
      isp_copy_btn: 'نسخ تقرير الشكوى لمزود الخدمة',
      isp_copied_toast: 'تم نسخ تقرير الشكوى بنجاح!',

      sec_faq_title: 'الأسئلة الشائعة وتصحيح الأعطال',
      faq_desc: 'حلول للمشاكل الشائعة وإرشادات التغلب على الأعطال أثناء الاتصال بالموجه:',
      faq_q1: 'لماذا تظهر مؤشرات الإشارة بالرمز "N/A"؟',
      faq_a1: 'تظهر N/A عندما يتعذر على NetPulse الاتصال بالموجه. الحلول: 1) تحقق من عنوان البوابة في الإعدادات (الافتراضي 192.168.1.1). 2) افتح صفحة إعدادات الموجه في تبويب آخر للحفاظ على الجلسة نشطة. 3) تأكد من توصيل الموجه بالكمبيوتر.',
      faq_q2: 'هل يمكن تشغيل اختبارات السرعة الساعية أثناء قفل الشاشة؟',
      faq_a2: 'نعم! يعمل NetPulse باستخدام محرك التنبيهات في خلفية المتصفح (Service Worker MV3). طالما أن المتصفح مفتوح في الخلفية، ستعمل الاختبارات الساعية المجدولة تلقائياً.',
      faq_q3: 'كيف أقدم تقارير قياس الإشارة لمزود الخدمة لتقديم شكوى تراجع السرعة؟',
      faq_a3: 'استخدم قسم "مولد شكاوى الاتصالات" أعلاه. انقر على "نسخ تقرير الشكوى لمزود الخدمة" لنسخ تذكرة دعم فني جاهزة تتضمن قيم RSRP وSINR ومعرّف الخلية ومتوسطات السرعة لتقديمها للدعم الفني.',
      faq_q4: 'هل موجهي مدعوم في الأداة؟',
      faq_a4: 'تعمل الأداة مباشرة مع موجهات Zyxel NR5103E / NR5103 وموجهات Huawei 5G CPE وZTE MC801A وNokia FastMile والموجهات التي تعمل على الشبكات الفرعية المحلية (192.168.*.*, 10.*.*.*).',
      faq_q5: 'كيف أقوم بتصدير سجل الإشارة إلى CSV أو JSON؟',
      faq_a5: 'افتح لوحة التحكم الرئيسية وانقر على زر "تصدير CSV" أو "تصدير JSON" في شريط الأدوات العلوي لتنزيل قاعدة البيانات بالكامل.',

      sec_settings_title: '4. الإعدادات وتهيئـة البوابة',
      settings_desc: 'يتيح للمستخدم تهيئة بيانات دخول الموجه، وفترات التحديث، وقواعد الالتقاط التلقائي، وعتبات التنبيه.',
      settings_cap1: 'عنوان البوابة وملف الموجه: دعم 192.168.1.1 و10.*.*.* وملفات الموجهات (Zyxel, Huawei, ZTE, Generic).',
      settings_cap2: 'خزنة البيانات التلقائية: حفظ آمن لاسم المستخدم وكلمة المرور مع ملء تلقائي ذكي.',
      settings_cap3: 'معدلات محرك التحديث: فترات قابلة للتخصيص (2 ثانية للأداء العالي، 5 ثوانٍ متوازن، 15 ثانية لموفر الطاقة).',
      settings_cap4: 'مؤشرات التنبيه للإشارة: تخصيص عتبات التنبيه الحرجة لانخفاض RSRP وSINR.',
      settings_img_cap: 'شكل 4: استوديو الإعدادات مع تهيئة عنوان البوابة وخزنة البيانات ومعدلات التحديث.',

      sec_author_title: 'المطور وحقوق الاستخدام المفتوح',
      author_desc: 'تم تطوير NetPulse كشروع مفتوح المصدر بموجب ترخيص MIT.',
      author_made_by: 'تطوير أسامة عبد اللطيف (Osama Abdallatif)',
      author_whatsapp: 'تواصل عبر واتساب (+218 916808225)',
      author_github: 'الملف الشخصي للمطور الرئيسي (@ZerroDevs)',
      author_repo: 'مستودع GitHub الرسمي (ZerroDevs/NetPulse)',
      author_license: 'مرخص بموجب ترخيص MIT. حقوق الطبع والنشر (c) 2026 ZerroDevs.'
    }
  };

  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');
  const searchInput = document.getElementById('docs-search-input');
  const btnCopyIspPrompt = document.getElementById('btn-copy-isp-prompt');

  function init() {
    loadPreferences();
    setupEventListeners();
  }

  function loadPreferences() {
    const savedLang = localStorage.getItem('netpulse_docs_lang') || 'en';
    const savedTheme = localStorage.getItem('netpulse_docs_theme') || 'dark';

    applyLanguage(savedLang);
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeLabelText) {
      themeLabelText.textContent = currentTheme === 'dark' ? 'Light' : 'Dark';
    }
    localStorage.setItem('netpulse_docs_theme', currentTheme);
  }

  function applyLanguage(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';
    const isAr = currentLang === 'ar';

    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);

    if (langToggleText) {
      langToggleText.textContent = isAr ? 'English' : 'العربية';
    }

    // Apply translations for data-i18n attributes
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach((elem) => {
      const key = elem.getAttribute('data-i18n');
      if (dict[key]) {
        elem.textContent = dict[key];
      }
    });

    // Apply translations for placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((elem) => {
      const key = elem.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        elem.setAttribute('placeholder', dict[key]);
      }
    });

    localStorage.setItem('netpulse_docs_lang', currentLang);
  }

  function filterDocs(query) {
    const q = query.trim().toLowerCase();
    const searchableItems = document.querySelectorAll('.doc-card, .gateway-card, .faq-item, .isp-prompt-card, .rf-table-container');

    searchableItems.forEach((item) => {
      if (!q) {
        item.classList.remove('hidden-by-search');
        return;
      }

      const text = item.textContent.toLowerCase();
      if (text.includes(q)) {
        item.classList.remove('hidden-by-search');
      } else {
        item.classList.add('hidden-by-search');
      }
    });
  }

  function setupEventListeners() {
    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'ar' : 'en';
        applyLanguage(nextLang);
      });
    }

    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterDocs(e.target.value);
      });
    }

    if (btnCopyIspPrompt) {
      btnCopyIspPrompt.addEventListener('click', () => {
        const promptBlock = document.getElementById('isp-prompt-text');
        if (!promptBlock) return;

        const textToCopy = promptBlock.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
          const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
          const originalText = btnCopyIspPrompt.innerHTML;
          btnCopyIspPrompt.textContent = dict.isp_copied_toast || 'Copied!';
          btnCopyIspPrompt.style.backgroundColor = '#10b981';

          setTimeout(() => {
            btnCopyIspPrompt.innerHTML = originalText;
            btnCopyIspPrompt.style.backgroundColor = '';
          }, 2500);
        });
      });
    }

    // Scroll active link highlight
    const sections = document.querySelectorAll('.docs-section');
    const navLinks = document.querySelectorAll('.sidebar-link');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach((sec) => {
        const sectionTop = sec.offsetTop;
        if (pageYOffset >= sectionTop - 120) {
          current = sec.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
