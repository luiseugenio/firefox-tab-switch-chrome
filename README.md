# Firefox-Style Tab Switching for Chrome

A Chrome extension that replicates Firefox's Ctrl+Tab behavior — switching between your two most recently used tabs instead of cycling through them in order.

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID?label=Chrome%20Web%20Store)
![License](https://img.shields.io/badge/license-MIT-blue)

## Why?

I've been a Firefox user for years. When [Claude Code](https://docs.anthropic.com/en/docs/claude-code) came out — Anthropic's CLI tool for agentic coding — it only supported Chrome. So I made the switch.

Everything was fine, except for one thing: **Ctrl+Tab**.

In Firefox, Ctrl+Tab switches between your two most recently used tabs. You're reading docs, you jump to your code, you press Ctrl+Tab and you're back on the docs. It works like ⌘Tab (Alt+Tab) works for windows — it just makes sense.

In Chrome, Ctrl+Tab cycles through tabs left to right. If you have 20 tabs open and the two you're working with are on opposite ends of the tab bar, it's painful.

I couldn't find an extension that did exactly what I wanted, so I built one.

## How It Works

The extension tracks the order in which you visit tabs (MRU — Most Recently Used). When you press the keyboard shortcut, it switches to the tab you were just on. Press it again and you're back. That's it.

No content scripts. No data collection. No network requests. Everything stays in memory and disappears when you close Chrome.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **⌥ Option+Q** (Mac) / **Alt+Q** (Win/Linux) | Switch to previously active tab |
| **⌥ Option+W** (Mac) / **Alt+W** (Win/Linux) | Navigate further back in tab history |

> **Note:** Chrome doesn't allow extensions to override Ctrl+Tab (it's a reserved browser shortcut). You can customize the shortcuts at `chrome://extensions/shortcuts`.

## Installation

### From Chrome Web Store

👉 [Install Firefox-Style Tab Switching](https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID)

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/luiseugenio/firefox-tab-switch-chrome.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the cloned folder

## Features

- **MRU tab order** — tabs are sorted by when you last used them, not by position
- **Cross-window switching** — works across all Chrome windows
- **Visual tab history** — click the extension icon to see and jump to recent tabs
- **Lightweight** — no content scripts injected, zero performance impact
- **Private** — no data collected, no analytics, no network requests

## Technical Details

Built with Chrome Extension Manifest V3. The architecture is straightforward:

- **`background.js`** — Service worker that listens to `chrome.tabs.onActivated` events, maintains an in-memory MRU list, and handles the `chrome.commands` keyboard shortcuts
- **`popup.html` / `popup.js`** — Simple UI showing the recent tab history when you click the extension icon
- **Permissions** — Only requires `tabs` (the minimum needed to track tab activation and switch tabs)

## Privacy

This extension does not collect, store, or transmit any data. The MRU tab list exists only in volatile memory (RAM) while Chrome is running. See the full [Privacy Policy](https://htmlpreview.github.io/?https://gist.github.com/luiseugenio/e0fe062baa0a27d88d48328fc54027d4/raw/privacy_policy.html).

## Motivation & Background

This is my first Chrome extension. The motivation was simple: I switched from Firefox to Chrome to use Claude Code, and I couldn't stand losing my tab switching workflow. Instead of complaining about it, I built the solution.

If you're also a Firefox refugee who misses MRU tab switching, I hope this helps.

## License

MIT — do whatever you want with it.

## Contributing

Found a bug? Have an idea? Feel free to open an issue or submit a PR.
