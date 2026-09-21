/**
 * NetPulse - Options & Settings Controller
 * Manages cellular router gateway, credentials vault, polling rates,
 * automation switches, RF thresholds, and bilingual i18n / theme preferences.
 * 
 * Strict Guidelines: Zero gradients, zero emojis, pure vector icons, flat matte colors.
 */

(function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    gatewayIp: '192.168.1.1',
    routerModel: 'zyxel_nr5103e',
    routerUsername: 'admin',
    routerPassword: 'SKdigital8008@',
    autofillEnabled: true,
    pollingRate: 5,
    autoCaptureSpeedtest: true,
    autoCaptureFast: true,
    minSpeedThreshold: 0.5,
    alertThresholdRsrp: -105,
    alertThresholdSinr: 3,
    alertThresholdRsrq: -15,
    desktopNotifications: true,
    handoverNotificationsEnabled: true
  };

  let currentSettings = Object.assign({}, DEFAULT_SETTINGS);
  let currentLang = 'en';
  let currentTheme = 'dark';

  // DOM Elements
  const inputGatewayIp = document.getElementById('cfg-gateway-ip');
  const selectRouterModel = document.getElementById('cfg-router-model');
  const inputUsername = document.getElementById('cfg-username');
  const inputPassword = document.getElementById('cfg-password');
  const checkAutofill = document.getElementById('cfg-autofill-enabled');
  const checkSpeedtest = document.getElementById('cfg-autocapture-speedtest');
  const checkFast = document.getElementById('cfg-autocapture-fast');
  const inputMinSpeed = document.getElementById('cfg-min-speed');
  const sliderRsrp = document.getElementById('cfg-rsrp-threshold');
  const badgeRsrp = document.getElementById('rsrp-threshold-val');
  const sliderSinr = document.getElementById('cfg-sinr-threshold');
  const badgeSinr = document.getElementById('sinr-threshold-val');
  const sliderRsrq = document.getElementById('cfg-rsrq-threshold');
  const badgeRsrq = document.getElementById('rsrq-threshold-val');
  const checkDesktopNotifs = document.getElementById('cfg-desktop-notifs');
  const checkHandoverNotifs = document.getElementById('cfg-handover-notifs');

  const btnTogglePass = document.getElementById('btn-toggle-cfg-pass');
  const btnTestGateway = document.getElementById('btn-test-gateway');
  const gatewayStatus = document.getElementById('gateway-test-status');

  const btnSave = document.getElementById('btn-save-settings');
  const btnReset = document.getElementById('btn-reset-defaults');
  const btnExport = document.getElementById('btn-export-settings');
  const toastElem = document.getElementById('options-toast');

  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');

  /**
   * Display toast notification
   */
  function showToast(message) {
    if (!toastElem) return;
    toastElem.textContent = message;
    toastElem.classList.add('show');
    setTimeout(() => {
      toastElem.classList.remove('show');
    }, 4000);
  }

  /**
   * Load stored settings
   */
  async function loadSettings() {
    try {
      const storage = await chrome.storage.local.get(['netpulse_settings', 'netpulse_lang', 'netpulse_theme']);
      if (storage.netpulse_settings) {
        currentSettings = Object.assign({}, DEFAULT_SETTINGS, storage.netpulse_settings);
      }
      currentLang = storage.netpulse_lang || 'en';
      currentTheme = storage.netpulse_theme || 'dark';

      applyTheme(currentTheme);
      applyLanguage(currentLang);
      populateForm(currentSettings);
    } catch (err) {
      console.error('[NetPulse] Failed to load settings:', err);
      populateForm(DEFAULT_SETTINGS);
    }
  }

  /**
   * Populate UI form fields
   */
  function populateForm(cfg) {
    if (inputGatewayIp) inputGatewayIp.value = cfg.gatewayIp || '192.168.1.1';
    if (selectRouterModel) selectRouterModel.value = cfg.routerModel || 'zyxel_nr5103e';
    if (inputUsername) inputUsername.value = cfg.routerUsername || 'admin';
    if (inputPassword) inputPassword.value = cfg.routerPassword || 'SKdigital8008@';
    if (checkAutofill) checkAutofill.checked = cfg.autofillEnabled !== false;

    // Polling rate radio
    const radio = document.querySelector(`input[name="pollingRate"][value="${cfg.pollingRate || 5}"]`);
    if (radio) radio.checked = true;

    if (checkSpeedtest) checkSpeedtest.checked = cfg.autoCaptureSpeedtest !== false;
    if (checkFast) checkFast.checked = cfg.autoCaptureFast !== false;
    if (inputMinSpeed) inputMinSpeed.value = cfg.minSpeedThreshold !== undefined ? cfg.minSpeedThreshold : 0.5;

    // Sliders
    if (sliderRsrp) {
      sliderRsrp.value = cfg.alertThresholdRsrp !== undefined ? cfg.alertThresholdRsrp : -105;
      badgeRsrp.textContent = `${sliderRsrp.value} dBm`;
    }
    if (sliderSinr) {
      sliderSinr.value = cfg.alertThresholdSinr !== undefined ? cfg.alertThresholdSinr : 3;
      badgeSinr.textContent = `${sliderSinr.value} dB`;
    }
    if (sliderRsrq) {
      sliderRsrq.value = cfg.alertThresholdRsrq !== undefined ? cfg.alertThresholdRsrq : -15;
      badgeRsrq.textContent = `${sliderRsrq.value} dB`;
    }

    if (checkDesktopNotifs) checkDesktopNotifs.checked = cfg.desktopNotifications !== false;
    if (checkHandoverNotifs) checkHandoverNotifs.checked = cfg.handoverNotificationsEnabled !== false;
  }

  /**
   * Gather form values into object
   */
  function collectForm() {
    const selectedRadio = document.querySelector('input[name="pollingRate"]:checked');
    return {
      gatewayIp: (inputGatewayIp.value || '192.168.1.1').trim(),
      routerModel: selectRouterModel.value,
      routerUsername: (inputUsername.value || 'admin').trim(),
      routerPassword: inputPassword.value || '',
      autofillEnabled: checkAutofill.checked,
      pollingRate: selectedRadio ? parseInt(selectedRadio.value, 10) : 5,
      autoCaptureSpeedtest: checkSpeedtest.checked,
      autoCaptureFast: checkFast.checked,
      minSpeedThreshold: parseFloat(inputMinSpeed.value) || 0.5,
      alertThresholdRsrp: parseInt(sliderRsrp.value, 10),
      alertThresholdSinr: parseInt(sliderSinr.value, 10),
      alertThresholdRsrq: parseInt(sliderRsrq.value, 10),
      desktopNotifications: checkDesktopNotifs.checked,
      handoverNotificationsEnabled: checkHandoverNotifs ? checkHandoverNotifs.checked : true
    };
  }

  /**
   * Save configuration to chrome.storage.local
   */
  async function saveSettings() {
    try {
      const newSettings = collectForm();
      await chrome.storage.local.set({ netpulse_settings: newSettings });
      currentSettings = newSettings;
      const i18n = window.NetPulseI18n;
      const msg = i18n ? i18n.t('toast_settings_saved', currentLang) : 'Configuration successfully saved and applied.';
      showToast(msg);
    } catch (err) {
      console.error('[NetPulse] Failed to save settings:', err);
      showToast('Error saving configuration.');
    }
  }

  /**
   * Reset settings to factory defaults
   */
  async function resetDefaults() {
    try {
      await chrome.storage.local.set({ netpulse_settings: DEFAULT_SETTINGS });
      currentSettings = Object.assign({}, DEFAULT_SETTINGS);
      populateForm(DEFAULT_SETTINGS);
      const i18n = window.NetPulseI18n;
      const msg = i18n ? i18n.t('toast_settings_reset', currentLang) : 'Settings reset to default factory values.';
      showToast(msg);
    } catch (err) {
      console.error('[NetPulse] Failed to reset settings:', err);
    }
  }

  /**
   * Export settings as JSON
   */
  function exportSettings() {
    const current = collectForm();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(current, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'netpulse_config.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  /**
   * Test Gateway Reachability
   */
  async function testGateway() {
    const ip = (inputGatewayIp.value || '192.168.1.1').trim();
    gatewayStatus.className = 'test-status mono';
    gatewayStatus.textContent = currentLang === 'ar' ? 'جاري الفحص...' : 'Probing...';

    const testUrl = `http://${ip}/`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      await fetch(testUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timer);
      gatewayStatus.className = 'test-status success mono';
      gatewayStatus.textContent = currentLang === 'ar' ? `البوابة متاحة (${ip})` : `Gateway reachable (${ip})`;
    } catch (e) {
      clearTimeout(timer);
      gatewayStatus.className = 'test-status error mono';
      gatewayStatus.textContent = currentLang === 'ar' ? `تعذر الاتصال بـ (${ip})` : `Host unreachable (${ip})`;
    }
  }

  /**
   * Theme toggling
   */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (themeLabelText) {
      themeLabelText.textContent = theme === 'light' ? 'Dark' : 'Light';
    }
  }

  /**
   * Language toggling
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

  // Sliders live badges
  if (sliderRsrp) {
    sliderRsrp.addEventListener('input', () => {
      badgeRsrp.textContent = `${sliderRsrp.value} dBm`;
    });
  }
  if (sliderSinr) {
    sliderSinr.addEventListener('input', () => {
      badgeSinr.textContent = `${sliderSinr.value} dB`;
    });
  }
  if (sliderRsrq) {
    sliderRsrq.addEventListener('input', () => {
      badgeRsrq.textContent = `${sliderRsrq.value} dB`;
    });
  }

  // Password toggle
  if (btnTogglePass && inputPassword) {
    btnTogglePass.addEventListener('click', () => {
      const isPass = inputPassword.type === 'password';
      inputPassword.type = isPass ? 'text' : 'password';
    });
  }

  // Action buttons
  if (btnSave) btnSave.addEventListener('click', saveSettings);
  if (btnReset) btnReset.addEventListener('click', resetDefaults);
  if (btnExport) btnExport.addEventListener('click', exportSettings);
  if (btnTestGateway) btnTestGateway.addEventListener('click', testGateway);

  // Theme button
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', async () => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      await chrome.storage.local.set({ netpulse_theme: nextTheme });
    });
  }

  // Language button
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', async () => {
      const nextLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(nextLang);
      await chrome.storage.local.set({ netpulse_lang: nextLang });
    });
  }

  // Init
  loadSettings();
})();
