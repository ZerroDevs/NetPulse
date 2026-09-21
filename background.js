/**
 * NetPulse - Background Service Worker (Manifest V3)
 * Handles lifecycle, badge updates, storage synchronization, and tab navigation.
 */

// Initialize storage defaults on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get(['netpulse_history', 'netpulse_settings', 'netpulse_router_latest']);
  
  const updates = {};
  if (!existing.netpulse_history) {
    updates.netpulse_history = [];
  }
  if (!existing.netpulse_settings) {
    updates.netpulse_settings = {
      routerUrl: 'http://192.168.1.1',
      autoSyncIntervalSec: 15,
      notificationsEnabled: true
    };
  }
  if (!existing.netpulse_router_latest) {
    // Initial empty state
    updates.netpulse_router_latest = {
      timestamp: Date.now(),
      status: 'waiting',
      source: 'unconnected',
      metrics: null
    };
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }

  // Configure initial badge
  updateBadge(null);
});

// Update Action Badge based on RSRP value
function updateBadge(metrics) {
  if (!metrics || metrics.rsrp === undefined || metrics.rsrp === null) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const rsrp = Number(metrics.rsrp);
  let badgeColor = '#3b82f6'; // Default solid blue
  let text = String(Math.round(rsrp));

  if (rsrp >= -80) {
    badgeColor = '#10b981'; // Solid Emerald
  } else if (rsrp >= -90) {
    badgeColor = '#3b82f6'; // Solid Blue
  } else if (rsrp >= -100) {
    badgeColor = '#f59e0b'; // Solid Amber
  } else {
    badgeColor = '#f43f5e'; // Solid Rose
  }

  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  chrome.action.setBadgeText({ text: text });
}

// Listen for storage changes to synchronize badge
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.netpulse_router_latest) {
    const latest = changes.netpulse_router_latest.newValue;
    if (latest && latest.metrics) {
      updateBadge(latest.metrics);
    } else {
      updateBadge(null);
    }
  }
});

// Handle incoming messages from content scripts and UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard/dashboard.html');
    chrome.tabs.query({ url: dashboardUrl }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        if (tabs[0].windowId) {
          chrome.windows.update(tabs[0].windowId, { focused: true });
        }
      } else {
        chrome.tabs.create({ url: dashboardUrl });
      }
    });
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'OPEN_HISTORY') {
    const historyUrl = chrome.runtime.getURL('history/history.html');
    chrome.tabs.query({ url: historyUrl }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true });
        if (tabs[0].windowId) {
          chrome.windows.update(tabs[0].windowId, { focused: true });
        }
      } else {
        chrome.tabs.create({ url: historyUrl });
      }
    });
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'CAPTURE_ACTIVE_TAB') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        sendResponse({ status: 'ok', dataUrl: dataUrl });
      }
    });
    return true;
  }

  if (message.type === 'GET_ROUTER_METRICS') {
    chrome.storage.local.get('netpulse_router_latest', (res) => {
      sendResponse(res.netpulse_router_latest || null);
    });
    return true;
  }

  if (message.type === 'ROUTER_TELEMETRY_COMMITTED') {
    if (message.data && message.data.metrics) {
      updateBadge(message.data.metrics);
    }
    sendResponse({ status: 'acknowledged' });
    return true;
  }
});
