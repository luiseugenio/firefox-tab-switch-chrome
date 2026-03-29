document.addEventListener("DOMContentLoaded", () => {
  const tabList = document.getElementById("tabList");
  const openShortcuts = document.getElementById("openShortcuts");

  // Open shortcuts page
  openShortcuts.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    window.close();
  });

  // Request tab history from background
  chrome.runtime.sendMessage({ type: "getHistory" }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      tabList.innerHTML = '<div class="empty-state">No tab history yet. Start browsing!</div>';
      return;
    }

    tabList.innerHTML = "";

    tabs.forEach((tab, index) => {
      const item = document.createElement("div");
      item.className = "tab-item" + (tab.isCurrent ? " current" : "");

      const position = document.createElement("span");
      position.className = "tab-position";
      position.textContent = index === 0 ? "▸" : index;

      let faviconEl;
      if (tab.favIconUrl) {
        faviconEl = document.createElement("img");
        faviconEl.className = "tab-favicon";
        faviconEl.src = tab.favIconUrl;
        faviconEl.onerror = () => {
          faviconEl.replaceWith(createPlaceholder());
        };
      } else {
        faviconEl = createPlaceholder();
      }

      const info = document.createElement("div");
      info.className = "tab-info";

      const title = document.createElement("div");
      title.className = "tab-title";
      title.textContent = tab.title;

      const url = document.createElement("div");
      url.className = "tab-url";
      try {
        url.textContent = new URL(tab.url).hostname;
      } catch {
        url.textContent = tab.url;
      }

      info.appendChild(title);
      info.appendChild(url);

      item.appendChild(position);
      item.appendChild(faviconEl);
      item.appendChild(info);

      // Click to switch to this tab
      if (!tab.isCurrent) {
        item.addEventListener("click", () => {
          chrome.tabs.update(tab.id, { active: true });
          window.close();
        });
      }

      tabList.appendChild(item);
    });
  });
});

function createPlaceholder() {
  const el = document.createElement("div");
  el.className = "tab-favicon-placeholder";
  return el;
}
