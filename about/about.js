/**
 * NetPulse - About & Author Page Controller
 * Handles theme toggling, language switching (English / Arabic RTL),
 * and links live chrome.storage.local preferences across all extension pages.
 */

(function () {
  'use strict';

  let currentLang = 'en';
  let currentTheme = 'dark';

  const btnLangToggle = document.getElementById('btn-lang-toggle');
  const langToggleText = document.getElementById('lang-toggle-text');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeLabelText = document.getElementById('theme-label-text');

  function init() {
    loadPreferences();
    setupEventListeners();
    listenForStorageChanges();
  }

  function loadPreferences() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['netpulse_lang', 'netpulse_theme'], (res) => {
        if (res.netpulse_lang) {
          currentLang = res.netpulse_lang;
        }
        if (res.netpulse_theme) {
          currentTheme = res.netpulse_theme;
        }
        applyTheme(currentTheme);
        applyLanguage(currentLang);
      });
    } else {
      applyTheme(currentTheme);
      applyLanguage(currentLang);
    }
  }

  function applyTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeLabelText) {
      themeLabelText.textContent = currentTheme === 'dark' ? 'Light' : 'Dark';
    }
  }

  function applyLanguage(lang) {
    currentLang = lang === 'ar' ? 'ar' : 'en';
    if (window.NetPulseI18n) {
      window.NetPulseI18n.applyLanguage(currentLang, document);
    } else {
      document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', currentLang);
    }
    if (langToggleText) {
      langToggleText.textContent = currentLang === 'ar' ? 'English' : 'العربية';
    }
  }

  function setupEventListeners() {
    if (btnLangToggle) {
      btnLangToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'ar' : 'en';
        applyLanguage(nextLang);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ netpulse_lang: nextLang });
        }
      });
    }

    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ netpulse_theme: nextTheme });
        }
      });
    }
  }

  function listenForStorageChanges() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;

        if (changes.netpulse_theme) {
          applyTheme(changes.netpulse_theme.newValue);
        }
        if (changes.netpulse_lang) {
          applyLanguage(changes.netpulse_lang.newValue);
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
