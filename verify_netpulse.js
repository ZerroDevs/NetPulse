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
  'scripts/router_scraper.js',
  'scripts/speedtest_scraper.js',
  'icons/icon.svg',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
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

// 5. Strict ZERO GRADIENT Verification across all project source files
const filesToCheck = [
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'dashboard/dashboard.html',
  'dashboard/dashboard.css',
  'dashboard/dashboard.js',
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

console.log(`\nVerification Complete: ${passes} passed, ${failures} failed.`);
if (failures > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY.');
}
