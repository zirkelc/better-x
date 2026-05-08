import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  type FeatureKey,
  getSettings,
  onSettingsChanged,
  patchSettings,
} from '../../utils/settings';

const list = document.getElementById('features') as HTMLUListElement;
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

function applySettingsToInputs(settings: Record<FeatureKey, boolean>): void {
  for (const [key, input] of inputs) {
    input.checked = settings[key];
  }
}

async function init(): Promise<void> {
  buildRows();
  applySettingsToInputs(await getSettings());
  onSettingsChanged(applySettingsToInputs);
}

void init();
