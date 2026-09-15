import { message, escapeHTML } from './utils.js';

export function mapLocationPicker({ map, canEdit, getAsset, onSave }) {
  if (typeof canEdit !== 'function' ? true : !canEdit()) return null;

  const control = L.control({ position: 'topleft' });
  let picking = false;
  let asset = null;
  let pin = null;
  let active = false;

  const icon = L.divIcon({
    className: 'grid-location-pin-wrap',
    html: `<div class="grid-location-pin">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -26]
  });

  const el = document.createElement('div');
  el.id = 'mapLocationPicker';
  el.style.cssText = `
    display: flex; flex-direction: column; gap: 8px; align-items: stretch;
    font-family: "DM Sans", sans-serif;
  `;

  const toggle = document.createElement('button');
  toggle.id = 'mapPickerToggle';
  toggle.type = 'button';
  toggle.textContent = 'Set location';
  toggle.style.cssText = `
    align-self: flex-end; height: 34px; padding: 0 12px; border-radius: 9px;
    color: #1d4239; background: rgba(247,250,248,0.95);
    border: 1px solid #ccd9d4; box-shadow: 0 7px 22px rgba(22,58,47,0.10);
    font-size: 12px; font-weight: 700; cursor: pointer;
  `;

  const panel = document.createElement('div');
  panel.id = 'mapPickerPanel';
  panel.hidden = true;
  panel.style.cssText = `
    padding: 12px; border-radius: 10px; min-width: 220px; max-width: 260px;
    color: #38554e; background: rgba(247,250,248,0.97);
    border: 1px solid #ccd9d4; box-shadow: 0 7px 22px rgba(22,58,47,0.14);
    backdrop-filter: blur(10px); display: flex; flex-direction: column; gap: 8px;
    font-size: 12px;
  `;

  const helper = document.createElement('div');
  helper.id = 'mapPickerHelper';
  helper.textContent = 'Click the map to set a new location.';

  const coords = document.createElement('div');
  coords.id = 'mapPickerCoords';
  coords.style.cssText = 'font: 600 11px ui-monospace, monospace; color: #1d4239;';

  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; align-items: center;';

  const save = document.createElement('button');
  save.id = 'mapPickerSave';
  save.type = 'button';
  save.textContent = 'Use This Location';
  save.disabled = true;
  save.style.cssText = `
    padding: 7px 12px; border-radius: 8px; background: #00765d; color: #fff;
    border: none; font-size: 11px; font-weight: 700; cursor: pointer;
  `;

  const cancel = document.createElement('button');
  cancel.id = 'mapPickerCancel';
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.style.cssText = `
    padding: 7px 10px; border-radius: 8px; background: transparent; color: #5b7175;
    border: 1px solid #ccd9d4; font-size: 11px; font-weight: 700; cursor: pointer;
  `;

  actions.append(save, cancel);
  panel.append(helper, coords, actions);
  el.append(toggle, panel);

  function setHelper(text, error = false) {
    helper.textContent = text;
    helper.style.color = error ? '#982e38' : '#38554e';
  }

  function setCoords(latlng) {
    coords.textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  }

  function onMapPick(event) {
    if (!picking) return;
    if (!asset) {
      setHelper('Select an asset on the map, then use Set location.', true);
      return;
    }
    if (pin) {
      pin.setLatLng(event.latlng);
    } else {
      pin = L.marker(event.latlng, { icon, interactive: false }).addTo(map);
    }
    setCoords(event.latlng);
    save.disabled = false;
    setHelper(`Set location for ${escapeHTML(asset.assetId)}`);
  }

  function engage() {
    active = true;
    picking = true;
    asset = getAsset() && getAsset().assetId ? { assetId: getAsset().assetId, region: getAsset().region } : null;
    panel.hidden = false;
    toggle.textContent = 'Set location…';
    toggle.style.background = '#dceee8';
    toggle.style.borderColor = '#74aa9a';
    if (!asset) {
      setHelper('Select an asset on the map, then retry.', true);
      pin?.remove();
      pin = null;
      save.disabled = true;
      coords.textContent = '';
      return;
    }
    setHelper(`Click the map to set a new location for ${escapeHTML(asset.assetId)}.`);
    map.on('click', onMapPick);
  }

  function release() {
    picking = false;
    active = false;
    asset = null;
    if (pin) { pin.remove(); pin = null; }
    save.disabled = true;
    coords.textContent = '';
    panel.hidden = true;
    toggle.textContent = 'Set location';
    toggle.style.background = 'rgba(247,250,248,0.95)';
    toggle.style.borderColor = '#ccd9d4';
    map.off('click', onMapPick);
  }

  toggle.addEventListener('click', () => {
    if (picking) { release(); return; }
    engage();
  });

  cancel.addEventListener('click', release);

  save.addEventListener('click', async () => {
    if (!pin || !asset) return;
    save.disabled = true;
    const latlng = pin.getLatLng();
    try {
      await onSave(asset.assetId, { latitude: latlng.lat, longitude: latlng.lng, region: asset.region });
      setHelper(`Location saved for ${escapeHTML(asset.assetId)}.`, false);
      message(`Location updated for ${escapeHTML(asset.assetId)} · ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
      setTimeout(() => {
        pin?.remove();
        pin = null;
        release();
      }, 900);
    } catch (err) {
      setHelper(`Could not save location. ${err?.message || 'Please retry.'}`, true);
      save.disabled = false;
    }
  });

  control.onAdd = () => el;
  control.addTo(map);

  return {
    isActive: () => active,
    cancel: release
  };
}