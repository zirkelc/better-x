export type FeatureKey =
  | 'characterCounter'
  | 'wordOverlay'
  | 'codeFormatter'
  | 'openInNewTabButton'
  | 'contextMenu';

export type Settings = Record<FeatureKey, boolean>;

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  characterCounter: 'Character counter',
  wordOverlay: 'Word & selection tooltips',
  codeFormatter: 'Code formatter buttons',
  openInNewTabButton: 'Open-in-new-tab button',
  contextMenu: 'Right-click "Open Post in New Tab"',
};

/** Display order for the popup. `contextMenu` is intentionally omitted —
 * it lives next to the More button in Chrome's right-click menu, not as a
 * toggle in the popup. */
export const FEATURE_KEYS: ReadonlyArray<FeatureKey> = [
  'characterCounter',
  'wordOverlay',
  'codeFormatter',
  'openInNewTabButton',
];

export const DEFAULT_SETTINGS: Settings = {
  characterCounter: true,
  wordOverlay: true,
  codeFormatter: true,
  openInNewTabButton: true,
  contextMenu: true,
};

export const SETTINGS_STORAGE_KEY = 'better-x:settings';

export async function getSettings(): Promise<Settings> {
  const data = await browser.storage.sync.get(SETTINGS_STORAGE_KEY);
  const stored = data[SETTINGS_STORAGE_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function patchSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await browser.storage.sync.set({
    [SETTINGS_STORAGE_KEY]: { ...current, ...patch },
  });
}

/**
 * Subscribe to settings changes (any sync-storage change to the settings key).
 * Returns an unsubscribe function.
 */
export function onSettingsChanged(
  callback: (settings: Settings) => void,
): () => void {
  const listener = async (
    changes: Record<string, unknown>,
    area: string,
  ) => {
    if (area !== 'sync') return;
    if (!changes[SETTINGS_STORAGE_KEY]) return;
    callback(await getSettings());
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
