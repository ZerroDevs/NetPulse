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

// Track active cell identifiers for handover detection
let lastKnownPci = null;
let lastKnownCellId = null;

// Initialize in-memory cell IDs from storage
chrome.storage.local.get(['netpulse_router_latest'], (res) => {
  if (res.netpulse_router_latest && res.netpulse_router_latest.metrics) {
    const m = res.netpulse_router_latest.metrics;
    if (m.pci !== null && m.pci !== undefined) lastKnownPci = String(m.pci);
    if (m.cellId !== null && m.cellId !== undefined) lastKnownCellId = String(m.cellId);
  }
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

// Feature 3: Tower Handover & PCI Flapping Background Alert Engine
async function handleHandoverCheck(newMetrics) {
  if (!newMetrics) return;

  const newPci = (newMetrics.pci !== null && newMetrics.pci !== undefined) ? String(newMetrics.pci) : null;
  const newCellId = (newMetrics.cellId !== null && newMetrics.cellId !== undefined) ? String(newMetrics.cellId) : null;
  const newBand = newMetrics.band || 'Cellular';

  if (!newPci && !newCellId) return;

  const hasPciChanged = lastKnownPci && newPci && newPci !== lastKnownPci;
  const hasCellChanged = lastKnownCellId && newCellId && newCellId !== lastKnownCellId;

  if (hasPciChanged || hasCellChanged) {
    const fromPci = lastKnownPci || 'N/A';
    const toPci = newPci || 'N/A';
    const fromCell = lastKnownCellId || 'N/A';
    const toCell = newCellId || 'N/A';

    const handoverEvent = {
      timestamp: Date.now(),
      fromPci,
      toPci,
      fromCell,
      toCell,
      band: newBand
    };

    console.log('[NetPulse Background] Tower handover detected:', handoverEvent);

    // Persist into netpulse_handover_events (max 50 entries)
    try {
      const storage = await chrome.storage.local.get(['netpulse_handover_events', 'netpulse_settings', 'netpulse_lang']);
      let events = storage.netpulse_handover_events || [];
      events.unshift(handoverEvent);
      if (events.length > 50) events = events.slice(0, 50);

      await chrome.storage.local.set({ netpulse_handover_events: events });

      // Dispatch non-intrusive Chrome notification if enabled
      const settings = storage.netpulse_settings || {};
      const isNotificationEnabled = settings.handoverNotificationsEnabled !== false && settings.notificationsEnabled !== false;

      if (isNotificationEnabled && chrome.notifications) {
        const isAr = (storage.netpulse_lang === 'ar');
        const notifTitle = isAr ? 'NetPulse: تم رصد تحويل في البرج' : 'NetPulse: Cell Handover Detected';
        const notifMsg = isAr
          ? `تم التبديل من البرج PCI ${fromPci} (خلية ${fromCell}) إلى PCI ${toPci} (خلية ${toCell}).`
          : `Switched from PCI ${fromPci} (Cell ${fromCell}) to PCI ${toPci} (Cell ${toCell}).`;

        chrome.notifications.create(`netpulse_handover_${Date.now()}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: notifTitle,
          message: notifMsg,
          priority: 1
        }, () => {
          if (chrome.runtime.lastError) {
            // Silently ignore notification creation errors if permissions blocked
          }
        });
      }
    } catch (e) {
      console.warn('[NetPulse Background] Failed to record handover:', e);
    }
  }

  if (newPci) lastKnownPci = newPci;
  if (newCellId) lastKnownCellId = newCellId;
}

// Listen for storage changes to synchronize badge and monitor tower handovers
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.netpulse_router_latest) {
    const latest = changes.netpulse_router_latest.newValue;
    if (latest && latest.metrics) {
      updateBadge(latest.metrics);
      handleHandoverCheck(latest.metrics);
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
