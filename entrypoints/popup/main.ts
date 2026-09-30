import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  type FeatureKey,
  getSettings,
  onSettingsChanged,
  patchSettings,
  type Settings,
} from '../../utils/settings';

const list = document.getElementById('features') as HTMLUListElement;
const enabledInput = document.getElementById('toggle-enabled') as HTMLInputElement;
const nameHeading = document.getElementById('name') as HTMLHeadingElement;
const inputs = new Map<FeatureKey, HTMLInputElement>();

function buildRows(): void {
  list.innerHTML = '';
  inputs.clear();

  for (const key of FEATURE_KEYS) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `toggle-${key}`;
    input.addEventListener('change', () => {
      void patchSettings({ [key]: input.checked });
    });
    const text = document.createElement('span');
    text.textContent = FEATURE_LABELS[key];
    label.htmlFor = input.id;
    label.appendChild(input);
    label.appendChild(text);
    li.appendChild(label);
    list.appendChild(li);
    inputs.set(key, input);
  }
}

function applySettingsToInputs(settings: Settings): void {
  enabledInput.checked = settings.enabled;
  list.classList.toggle('disabled', !settings.enabled);
  for (const [key, input] of inputs) {
    input.checked = settings[key];
    input.disabled = !settings.enabled;
  }
}

async function init(): Promise<void> {
  /** The dev build carries a different name, so show the one this install has. */
  nameHeading.textContent = browser.runtime.getManifest().name;
  enabledInput.addEventListener('change', () => {
    void patchSettings({ enabled: enabledInput.checked });
  });
  buildRows();
  applySettingsToInputs(await getSettings());
  onSettingsChanged(applySettingsToInputs);
}

void init();
