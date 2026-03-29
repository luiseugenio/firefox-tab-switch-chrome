/**
 * Firefox-Style Tab Switching for Chrome
 *
 * Tracks tab activation history and allows switching between
 * recently used tabs (MRU order), replicating Firefox's Ctrl+Tab behavior.
 */

// ── State ──────────────────────────────────────────────────────────────
// Stores tab IDs in most-recently-used order (index 0 = current tab)
let tabHistory = [];
const MAX_HISTORY = 50;

// Flag to prevent re-entrance when we ourselves switch tabs
let isSwitching = false;

// ── History helpers ────────────────────────────────────────────────────

function pushToHistory(tabId) {
  // Remove any existing occurrence so we don't get duplicates
  tabHistory = tabHistory.filter(id => id !== tabId);
  // Put at the front (most recent)
  tabHistory.unshift(tabId);
  // Trim to max size
  if (tabHistory.length > MAX_HISTORY) {
    tabHistory = tabHistory.slice(0, MAX_HISTORY);
  }
}

function removeFromHistory(tabId) {
  tabHistory = tabHistory.filter(id => id !== tabId);
}

// ── Tab event listeners ────────────────────────────────────────────────

// Track every tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isSwitching) return;
  pushToHistory(activeInfo.tabId);
});

// When a tab is closed, remove it from history
chrome.tabs.onRemoved.addListener((tabId) => {
  removeFromHistory(tabId);
});

// When a tab is replaced (e.g. prerender), update history
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  const idx = tabHistory.indexOf(removedTabId);
  if (idx !== -1) {
    tabHistory[idx] = addedTabId;
  }
});

// ── Keyboard command handler ───────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "switch-to-previous-tab") {
    await switchToPreviousTab();
  } else if (command === "switch-to-next-recent-tab") {
    await switchToNextRecentTab();
  }
});

async function switchToPreviousTab() {
  // We need at least 2 tabs in history to switch
  if (tabHistory.length < 2) return;

  const previousTabId = tabHistory[1]; // index 0 is current, index 1 is previous

  try {
    // Verify the tab still exists
    const tab = await chrome.tabs.get(previousTabId);

    isSwitching = true;

    // Activate the tab
    await chrome.tabs.update(previousTabId, { active: true });

    // Also switch to the correct window if needed
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }

    // Update history: move the previous tab to position 0
    // and current tab to position 1 (so next Alt+Q goes back)
    const currentTabId = tabHistory[0];
    tabHistory = tabHistory.filter(id => id !== previousTabId);
    tabHistory.unshift(previousTabId);
    // Ensure current tab is at position 1
    tabHistory = tabHistory.filter(id => id !== currentTabId || id === previousTabId ? id !== currentTabId : true);
    // Rebuild cleanly
    const rest = tabHistory.filter(id => id !== previousTabId && id !== currentTabId);
    tabHistory = [previousTabId, currentTabId, ...rest];

    isSwitching = false;
  } catch (e) {
    // Tab no longer exists, remove it and try again
    removeFromHistory(previousTabId);
    isSwitching = false;
    await switchToPreviousTab();
  }
}

async function switchToNextRecentTab() {
  // Goes forward in the MRU list (position 2, 3, etc.)
  // This is useful when you overshoot with Alt+Q
  if (tabHistory.length < 3) return;

  // Rotate: move current (0) to the end, making (1) the new current
  const current = tabHistory.shift();
  tabHistory.push(current);

  const targetTabId = tabHistory[0];

  try {
    const tab = await chrome.tabs.get(targetTabId);

    isSwitching = true;
    await chrome.tabs.update(targetTabId, { active: true });
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    isSwitching = false;
  } catch (e) {
    removeFromHistory(targetTabId);
    isSwitching = false;
  }
}

// ── Initialize history with existing tabs ──────────────────────────────

async function initializeHistory() {
  try {
    const tabs = await chrome.tabs.query({});
    // Sort by lastAccessed (most recent first) if available
    tabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

    for (const tab of tabs) {
      if (!tabHistory.includes(tab.id)) {
        tabHistory.push(tab.id);
      }
    }

    // Make sure the currently active tab is at position 0
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      pushToHistory(activeTab.id);
    }
  } catch (e) {
    console.error("Firefox Tab Switch: Error initializing history", e);
  }
}

// Run on service worker startup
initializeHistory();

// ── Extension icon click (badge info) ──────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getHistory") {
    // Return info about the tab history for the popup
    Promise.all(
      tabHistory.slice(0, 10).map(async (tabId, index) => {
        try {
          const tab = await chrome.tabs.get(tabId);
          return {
            id: tab.id,
            title: tab.title || "Untitled",
            url: tab.url || "",
            favIconUrl: tab.favIconUrl || "",
            position: index,
            isCurrent: index === 0
          };
        } catch {
          return null;
        }
      })
    ).then(results => {
      sendResponse(results.filter(Boolean));
    });
    return true; // Keep message channel open for async response
  }
});
