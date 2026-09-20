/**
 * Automated Verification Suite for NetPulse Extension
 * Validates Manifest V3 compliance, benchmark logic, files integrity,
 * i18n English/Arabic coverage, and verifies strict zero-gradient and zero-emoji compliance.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    passes++;
    console.log(`[PASS] ${message}`);
  } else {
    failures++;
    console.error(`[FAIL] ${message}`);
  }
}

console.log('=== NETPULSE VERIFICATION SUITE ===\n');

// 1. Check Manifest V3
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert(manifest.manifest_version === 3, 'Manifest version is 3');
assert(manifest.name === 'NetPulse', 'Extension name is "NetPulse"');
assert(manifest.action && manifest.action.default_popup === 'popup/popup.html', 'Action popup path is configured');
assert(manifest.background && manifest.background.service_worker === 'background.js', 'Service worker is configured');

// Check permissions
assert(manifest.permissions.includes('scripting'), 'Permissions include scripting');
assert(manifest.permissions.includes('tabs'), 'Permissions include tabs');
assert(manifest.permissions.includes('storage'), 'Permissions include storage');

// Check host permissions
assert(manifest.host_permissions.includes('<all_urls>') || manifest.host_permissions.some(h => h.includes('192.168')), 'Host permissions cover 192.168 router subnets');
assert(manifest.host_permissions.includes('<all_urls>') || manifest.host_permissions.some(h => h.includes('speedtest.net')), 'Host permissions include speedtest.net');
assert(manifest.host_permissions.includes('<all_urls>') || manifest.host_permissions.some(h => h.includes('fast.com')), 'Host permissions include fast.com');

// 2. Check File Existence
const requiredFiles = [
  'background.js',
  'shared/evaluator.js',
  'shared/i18n.js',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'dashboard/dashboard.html',
  'dashboard/dashboard.css',
  'dashboard/dashboard.js',
  'options/options.html',
  'options/options.css',
  'options/options.js',
  'analysis/analysis.html',
  'analysis/analysis.css',
  'analysis/analysis.js',
  'scripts/router_scraper.js',
  'scripts/speedtest_scraper.js',
  'icons/icon.svg',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'LICENSE',
  'README.md'
];

requiredFiles.forEach((relPath) => {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`);
});

// 3. Test Shared Evaluator
const Evaluator = require('./shared/evaluator.js');

// RSRP Tests
const rsrpExc = Evaluator.evaluateMetric('rsrp', -75);
assert(rsrpExc.grade === 'Excellent' && rsrpExc.color === '#10b981', 'RSRP -75 evaluated as Excellent');
const rsrpGood = Evaluator.evaluateMetric('rsrp', -85);
assert(rsrpGood.grade === 'Good' && rsrpGood.color === '#3b82f6', 'RSRP -85 evaluated as Good');
const rsrpFair = Evaluator.evaluateMetric('rsrp', -95);
assert(rsrpFair.grade === 'Fair' && rsrpFair.color === '#f59e0b', 'RSRP -95 evaluated as Fair');
const rsrpPoor = Evaluator.evaluateMetric('rsrp', -108);
assert(rsrpPoor.grade === 'Poor' && rsrpPoor.color === '#f43f5e', 'RSRP -108 evaluated as Poor');

// SINR Tests
const sinrExc = Evaluator.evaluateMetric('sinr', 24);
assert(sinrExc.grade === 'Excellent' && sinrExc.color === '#10b981', 'SINR 24 evaluated as Excellent');
const sinrGood = Evaluator.evaluateMetric('sinr', 15);
assert(sinrGood.grade === 'Good' && sinrGood.color === '#3b82f6', 'SINR 15 evaluated as Good');
const sinrFair = Evaluator.evaluateMetric('sinr', 8);
assert(sinrFair.grade === 'Fair' && sinrFair.color === '#f59e0b', 'SINR 8 evaluated as Fair');
const sinrPoor = Evaluator.evaluateMetric('sinr', 2);
assert(sinrPoor.grade === 'Poor' && sinrPoor.color === '#f43f5e', 'SINR 2 evaluated as Poor');

// RSRQ Tests
const rsrqClean = Evaluator.evaluateMetric('rsrq', -7);
assert(rsrqClean.grade === 'Clean' && rsrqClean.color === '#10b981', 'RSRQ -7 evaluated as Clean');
const rsrqCongested = Evaluator.evaluateMetric('rsrq', -12);
assert(rsrqCongested.grade === 'Congested' && rsrqCongested.color === '#f59e0b', 'RSRQ -12 evaluated as Congested');
const rsrqHeavy = Evaluator.evaluateMetric('rsrq', -17);
assert(rsrqHeavy.grade === 'Heavy Load' && rsrqHeavy.color === '#f43f5e', 'RSRQ -17 evaluated as Heavy Load');

// Overall Health Tests
const healthOpt = Evaluator.getOverallHealth(-78, 22, -8);
assert(healthOpt.status === 'Optimal RF', 'Healthy metrics return "Optimal RF"');

const healthCongested = Evaluator.getOverallHealth(-80, 15, -16);
assert(healthCongested.status === 'Sector Congestion', 'Heavy RSRQ triggers "Sector Congestion"');

// 4. Test i18n Engine
const I18n = require('./shared/i18n.js');
assert(I18n.TRANSLATIONS.en && I18n.TRANSLATIONS.ar, 'Both EN and AR dictionaries exist in i18n engine');
assert(I18n.t('status_optimal', 'en') === 'Optimal RF', 'EN translation for status_optimal is "Optimal RF"');
assert(I18n.t('status_optimal', 'ar') === 'استقبال إشارة مثالي', 'AR translation for status_optimal is "استقبال إشارة مثالي"');
assert(I18n.t('clear_all_data', 'ar') === 'مسح جميع البيانات', 'AR translation for clear_all_data is "مسح جميع البيانات"');
assert(I18n.t('modal_btn_confirm', 'ar') === 'تأكيد الحذف', 'AR translation for modal_btn_confirm is "تأكيد الحذف"');
assert(I18n.t('portals_modal_btn', 'en') === 'Portals & Links', 'EN translation for portals_modal_btn is "Portals & Links"');
assert(I18n.t('portals_modal_btn', 'ar') === 'روابط البوابات', 'AR translation for portals_modal_btn is "روابط البوابات"');
assert(I18n.t('portal_autofill_badge', 'en') === 'Auto-Fill Active', 'EN translation for portal_autofill_badge is "Auto-Fill Active"');
assert(I18n.t('portal_autofill_badge', 'ar') === 'التعبئة التلقائية مفعلة', 'AR translation for portal_autofill_badge is "التعبئة التلقائية مفعلة"');

// 5. Portals Modal & Auto-fill Verification
const dashboardHtml = fs.readFileSync(path.join(ROOT_DIR, 'dashboard/dashboard.html'), 'utf8');
assert(dashboardHtml.includes('id="modal-portals-overlay"'), 'Dashboard contains modal-portals-overlay');
assert(dashboardHtml.includes('https://192.168.1.1'), 'Dashboard modal links to https://192.168.1.1');
assert(dashboardHtml.includes('https://www.speedtest.net'), 'Dashboard modal links to speedtest.net');
assert(dashboardHtml.includes('https://fast.com'), 'Dashboard modal links to fast.com');
assert(dashboardHtml.includes('id="btn-open-portals"'), 'Dashboard topbar contains btn-open-portals');

const routerScraperCode = fs.readFileSync(path.join(ROOT_DIR, 'scripts/router_scraper.js'), 'utf8');
assert(routerScraperCode.includes('autoFillRouterCredentials'), 'router_scraper.js includes autoFillRouterCredentials function');
assert(routerScraperCode.includes('SKdigital8008@'), 'router_scraper.js includes target password SKdigital8008@');
assert(routerScraperCode.includes('admin'), 'router_scraper.js includes target username admin');

// 6. Speedtest Scraper Engine Verification
const speedtestCode = fs.readFileSync(path.join(ROOT_DIR, 'scripts/speedtest_scraper.js'), 'utf8');
assert(speedtestCode.includes('extractSpeedtestNetMetrics'), 'speedtest_scraper.js includes extractSpeedtestNetMetrics');
assert(speedtestCode.includes('findNumericFromSelectors'), 'speedtest_scraper.js includes multi-selector scanner');
assert(speedtestCode.includes('DOWNLOAD[^\\r\\n]*UPLOAD'), 'speedtest_scraper.js includes multi-column layout fallback regex');

// Test speedtest regex on real screenshot text
const testPageText = `
  DOWNLOAD Mbps       UPLOAD Mbps
     58.51              32.10
  Ping ms   20   126   159
  Result ID: 19696300354
  Connections Multi
  Almadar Aljadid
`;

const multiColTest = testPageText.match(/DOWNLOAD[^\r\n]*UPLOAD[^\r\n]*[\r\n]+[\s]*([\d.]+)[\s]+([\d.]+)/i);
assert(multiColTest && multiColTest[1] === '58.51' && multiColTest[2] === '32.10', 'Regex parses DL: 58.51 and UL: 32.10 from Speedtest layout');

const pingTest = testPageText.match(/Ping\s*(?:ms)?[\s\r\n]+([\d]+)/i);
assert(pingTest && pingTest[1] === '20', 'Regex parses idle Ping: 20 ms');

const idTest = testPageText.match(/Result\s*ID:?\s*(\d+)/i);
assert(idTest && idTest[1] === '19696300354', 'Regex parses Result ID: 19696300354');

// 7. Check Manifest Options UI
assert(manifest.options_ui && manifest.options_ui.page === 'options/options.html', 'Manifest includes options_ui page options/options.html');

// 8. Check i18n Keys for Options & Analysis
assert(I18n.t('options_title', 'en') === 'Settings & Gateway Configuration', 'EN translation for options_title exists');
assert(I18n.t('options_title', 'ar') === 'الإعدادات وتكوين البوابة', 'AR translation for options_title exists');
assert(I18n.t('analysis_title', 'en') === 'Deep RF Correlation & Carrier Aggregation Studio', 'EN translation for analysis_title exists');
assert(I18n.t('analysis_title', 'ar') === 'استوديو التحليل العميق للتردد اللاسلكي ودمج الترددات', 'AR translation for analysis_title exists');
assert(I18n.t('nav_analysis', 'en') === 'Deep RF Analysis', 'EN translation for nav_analysis exists');
assert(I18n.t('nav_analysis', 'ar') === 'التحليل العميق للإشارة', 'AR translation for nav_analysis exists');
assert(I18n.t('btn_sync_telemetry', 'en') === 'Sync with Dashboard', 'EN translation for btn_sync_telemetry exists');
assert(I18n.t('btn_sync_telemetry', 'ar') === 'مزامنة مع لوحة التحكم', 'AR translation for btn_sync_telemetry exists');
assert(I18n.t('btn_clear_analysis', 'en') === 'Clear History', 'EN translation for btn_clear_analysis exists');
assert(I18n.t('btn_clear_analysis', 'ar') === 'مسح السجل', 'AR translation for btn_clear_analysis exists');
assert(I18n.t('toast_telemetry_synced', 'en') === 'Telemetry successfully synced with Dashboard.', 'EN translation for toast_telemetry_synced exists');
assert(I18n.t('toast_telemetry_synced', 'ar') === 'تمت مزامنة البيانات مع لوحة التحكم بنجاح.', 'AR translation for toast_telemetry_synced exists');
assert(I18n.t('modal_clear_analysis_title', 'en') === 'Clear Analytical History', 'EN translation for modal_clear_analysis_title exists');
assert(I18n.t('modal_clear_analysis_title', 'ar') === 'مسح سجل التحليلات', 'AR translation for modal_clear_analysis_title exists');

// Verify removal of simulate telemetry button from dashboard and analysis html
const dashHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'dashboard/dashboard.html'), 'utf8');
assert(!dashHtmlContent.includes('id="btn-simulate-telemetry"'), 'dashboard.html does NOT contain btn-simulate-telemetry');
const analysisHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'analysis/analysis.html'), 'utf8');
assert(!analysisHtmlContent.includes('id="btn-inject-sample"'), 'analysis.html does NOT contain btn-inject-sample');
assert(analysisHtmlContent.includes('id="btn-sync-telemetry"'), 'analysis.html contains btn-sync-telemetry');
assert(analysisHtmlContent.includes('id="btn-clear-analysis"'), 'analysis.html contains btn-clear-analysis');
assert(analysisHtmlContent.includes('id="modal-clear-overlay"'), 'analysis.html contains modal-clear-overlay confirmation modal');
assert(analysisHtmlContent.includes('id="toast-banner"'), 'analysis.html contains toast-banner notification element');

// 9. Strict ZERO GRADIENT Verification across all project source files
const filesToCheck = [
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'dashboard/dashboard.html',
  'dashboard/dashboard.css',
  'dashboard/dashboard.js',
  'options/options.html',
  'options/options.css',
  'options/options.js',
  'analysis/analysis.html',
  'analysis/analysis.css',
  'analysis/analysis.js',
  'scripts/router_scraper.js',
  'scripts/speedtest_scraper.js',
  'shared/evaluator.js',
  'shared/i18n.js',
  'background.js'
];

const gradientRegex = /(?:linear-gradient|radial-gradient|conic-gradient|-webkit-gradient)/i;
filesToCheck.forEach((f) => {
  const content = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
  const hasGradient = gradientRegex.test(content);
  assert(!hasGradient, `Zero-Gradient check: ${f} contains NO gradient functions`);
});

// 6. Strict ZERO EMOJI Verification across all project source files
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
filesToCheck.forEach((f) => {
  const content = fs.readFileSync(path.join(ROOT_DIR, f), 'utf8');
  const hasEmoji = emojiRegex.test(content);
  assert(!hasEmoji, `Zero-Emoji check: ${f} contains NO unicode emojis`);
});

// 10. Speedtest & Fast.com Non-Blocking Performance & Responsiveness Assertions
const scraperContent = fs.readFileSync(path.join(ROOT_DIR, 'scripts/speedtest_scraper.js'), 'utf8');
assert(!scraperContent.includes('new MutationObserver'), 'speedtest_scraper.js does NOT instantiate runaway MutationObserver on document.body');
assert(!scraperContent.includes('document.body.innerText'), 'speedtest_scraper.js does NOT trigger synchronous layout reflow with document.body.innerText');
assert(scraperContent.includes('window.top !== window.self'), 'speedtest_scraper.js includes top-level benchmark window guard');
assert(scraperContent.includes('netpulse-st-close-btn'), 'speedtest_scraper.js includes dismissible HUD close button');
assert(scraperContent.includes('Speedtest.net Ready'), 'speedtest_scraper.js includes fast idle short-circuit for Speedtest home screen');

// 11. Developer Attribution & License Verification
const readmeContent = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
assert(readmeContent.includes('@ZerroDevs'), 'README.md mentions lead developer @ZerroDevs');
assert(readmeContent.includes('https://github.com/ZerroDevs'), 'README.md links to ZerroDevs GitHub profile');
assert(readmeContent.includes('MIT License'), 'README.md specifies MIT License');

const licenseContent = fs.readFileSync(path.join(ROOT_DIR, 'LICENSE'), 'utf8');
assert(licenseContent.includes('ZerroDevs'), 'LICENSE includes ZerroDevs copyright holder');
assert(licenseContent.includes('MIT License'), 'LICENSE is valid MIT License');

console.log(`\nVerification Complete: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY.');
}
