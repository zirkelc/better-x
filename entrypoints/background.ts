import { getSettings, onSettingsChanged, type Settings } from '../utils/settings';

const MENU_ID = 'better-x-open-post';

export default defineBackground(() => {
  let pendingUrl: string | null = null;
  let contextMenuEnabled = true;

  function applySettings(settings: Settings): void {
    contextMenuEnabled = settings.enabled && settings.contextMenu;
    if (!contextMenuEnabled) {
      pendingUrl = null;
      browser.contextMenus.update(MENU_ID, { visible: false }).catch(() => {});
    }
    /** Mark a disabled install on the toolbar icon, so it is clear at a glance which one runs. */
    browser.action.setBadgeText({ text: settings.enabled ? '' : 'OFF' }).catch(() => {});
    browser.action.setBadgeBackgroundColor({ color: '#536471' }).catch(() => {});
  }

  async function syncContextMenuFromSettings(): Promise<void> {
    applySettings(await getSettings());
  }

  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: MENU_ID,
      title: 'Open Post in New Tab',
      contexts: ['all'],
      documentUrlPatterns: ['*://x.com/*', '*://twitter.com/*'],
      visible: false,
    });
    void syncContextMenuFromSettings();
  });

  /** Service worker may wake up without an onInstalled event; sync on every load. */
  void syncContextMenuFromSettings();

  onSettingsChanged(applySettings);

  browser.runtime.onMessage.addListener((msg) => {
    if (msg && typeof msg === 'object' && msg.type === 'better-x:tweet-url') {
      pendingUrl = typeof msg.url === 'string' ? msg.url : null;
      browser.contextMenus
        .update(MENU_ID, { visible: contextMenuEnabled && !!pendingUrl })
        .catch(() => {});
    }
  });

  browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== MENU_ID) return;
    if (!contextMenuEnabled) return;
    if (!pendingUrl) return;
    const url = pendingUrl;
    pendingUrl = null;
    browser.tabs.create({ url, active: false });
  });
});
