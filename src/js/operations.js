import {
  createOrder,
  assignCrew,
  changeOrderStatus,
  createIncident,
  changeIncidentStatus,
  addAsset,
  updateAsset,
  addTelemetry,
  addCrew,
  updateCrewStatus
} from './firestore.js';
import { normalizeRole, formatRoleName } from './auth.js';
import { message, errorText, escapeHTML, REGIONS } from './utils.js';

// Modal helper styled according to GridGuard dark glassmorphism aesthetic
function createModal({ title, subtitle, contentHtml, submitText = 'Save', onSubmit }) {
  // Remove existing modal if any
  document.getElementById('ggModalOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ggModalOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 16px; opacity: 0; transition: opacity 0.25s ease;
  `;

  const modal = document.createElement('div');
  modal.id = 'ggModal';
  modal.style.cssText = `
    background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto;
    color: #f8fafc; padding: 24px; display: flex; flex-direction: column; gap: 16px;
    transform: translateY(16px); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #f8fafc;">${title}</h3>
        ${subtitle ? `<p style="margin: 4px 0 0; font-size: 0.85rem; color: #94a3b8;">${subtitle}</p>` : ''}
      </div>
      <button type="button" id="ggModalClose" style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0 4px; line-height: 1;">×</button>
    </div>
    <form id="ggModalForm" style="display: flex; flex-direction: column; gap: 14px;">
      ${contentHtml}
      <div id="ggModalError" style="display: none; color: #ef4444; font-size: 0.85rem; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.2);"></div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
        <button type="button" id="ggModalCancel" class="secondary-btn" style="padding: 8px 16px;">Cancel</button>
        <button type="submit" id="ggModalSubmit" class="primary-btn" style="padding: 8px 18px;">${submitText}</button>
      </div>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modal.style.transform = 'translateY(0)';
  });

  const close = () => {
    overlay.style.opacity = '0';
    modal.style.transform = 'translateY(16px)';
    setTimeout(() => overlay.remove(), 250);
  };

  overlay.querySelector('#ggModalClose').onclick = close;
  overlay.querySelector('#ggModalCancel').onclick = close;
  overlay.onclick = e => { if (e.target === overlay) close(); };

  const form = overlay.querySelector('#ggModalForm');
  const errBox = overlay.querySelector('#ggModalError');
  const submitBtn = overlay.querySelector('#ggModalSubmit');

  form.onsubmit = async e => {
    e.preventDefault();
    errBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      await onSubmit(new FormData(form));
      close();
    } catch (err) {
      errBox.textContent = errorText(err);
      errBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
    }
  };
}

export function mountOperations(page, getState, user) {
  if (!['assets', 'predictions', 'maintenance', 'crews', 'incidents', 'dashboard'].includes(page)) return;

  const role = normalizeRole(user?.role);
  const formattedRole = formatRoleName(role);
  const isReliability = role === 'reliability';
  const isAdmin = role === 'admin';
  const isOperator = role === 'admin' || role === 'operator';
  const isMaintenance = role === 'admin' || role === 'maintenance';
  const isFieldSupervisor = role === 'admin' || role === 'field_supervisor';

  // Ensure legacy operation controls are globally removed
  const oldStrip = document.getElementById('operationControls');
  if (oldStrip) oldStrip.remove();

  let assetSelect = null, orderSelect = null, crewSelect = null, incidentSelect = null;

  let banner;
    const createInput = (placeholder = '') => {
      const el = document.createElement('input');
      el.placeholder = placeholder;
      el.style.cssText = 'width:100%; padding:10px 12px; background:#e9f0ed; border:1px solid #ccd9d4; border-radius:9px; color:#0d2229; font-size:13px; outline:none; height:40px; box-sizing:border-box;';
      return el;
    };

    const createSelect = () => {
      const el = document.createElement('select');
      el.style.cssText = 'width:100%; padding:10px 12px; background:#e9f0ed; border:1px solid #ccd9d4; border-radius:9px; color:#0d2229; font-size:13px; outline:none; height:40px; box-sizing:border-box;';
      return el;
    };

    const wrap = (label, el) => {
      const w = document.createElement('div');
      w.style.cssText = 'display:flex; flex-direction:column; gap:6px;';
      const l = document.createElement('label');
      l.textContent = label;
      l.style.cssText = 'font-size:11px; font-weight:700; color:#29444b;';
      w.append(l, el);
      return w;
    };

    const btn = (label) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'padding:0 20px; background:#00765d; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; height:40px; box-shadow:0 4px 10px rgba(0,118,93,0.15); transition:0.2s; white-space:nowrap; box-sizing:border-box;';
      return b;
    };

    const runAction = async (fn, actionBtn) => {
      actionBtn.disabled = true;
      actionBtn.style.opacity = '0.7';
      banner.style.display = 'none';
      try {
        await fn();
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
        orderSelect?.dispatchEvent(new Event('change'));
        if (page === 'crews' || role === 'field_supervisor') actionBtn.disabled = !orderSelect?.value || !crewSelect?.value;
        return true;
      } catch (err) {
        console.error(err);
        banner.style.display = 'flex';
        banner.innerHTML = `<div><b>Service temporarily unavailable</b><br/>GridGuard could not save this operation. Please try again shortly.</div>`;
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
        return false;
      }
    };


  if (page === 'maintenance') {
    const panel = document.createElement('div');
    panel.id = 'maintenanceActionsPanel';
    panel.style.cssText = `
      background: #f7faf8; border: 1px solid rgba(191,212,204,0.9);
      border-radius: 19px; padding: 24px; margin-top: 24px; margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(18,61,48,0.05); font-family: "DM Sans", sans-serif;
    `;

    banner = document.createElement('div');
    banner.style.cssText = 'display:none; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:9px; color:#991b1b; margin-bottom:16px; font-size:13px; align-items:center; justify-content:space-between;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;';

    const title = document.createElement('div');
    title.innerHTML = `
      <h3 style="margin:0; font-family:'Manrope', sans-serif; font-size:18px; color:#10262c;">Work Order Actions</h3>
      <p style="margin:4px 0 0; font-size:13px; color:#5b7175;">Create and manage maintenance actions for the selected asset.</p>
    `;

    const rolePill = document.createElement('div');
    rolePill.style.cssText = 'font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; background:#e9f0ed; color:#29444b; border:1px solid #ccd9d4;';
    rolePill.textContent = isReliability ? 'Read-only access' : formattedRole;

    header.append(title, rolePill);
    panel.append(banner, header);

    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'display:grid; gap:16px; align-items:end;';
    panel.append(controlsContainer);

    if (isAdmin) {
      assetSelect = createSelect();
      orderSelect = createSelect();
      crewSelect = createSelect();
      const prioritySelect = createSelect();
      prioritySelect.innerHTML = `<option value="">Auto (AI Recommended)</option><option value="Critical">Critical</option><option value="Elevated">Elevated</option><option value="Stable">Stable</option>`;
      const reasonInput = createInput('Optional note...');

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid rgba(191,212,204,0.5);';
      const createBtn = btn('Create Work Order');
      createBtn.onclick = async () => {
        if (await runAction(() => createOrder(assetSelect.value, prioritySelect.value || null, reasonInput.value || null), createBtn)) {
          reasonInput.value = ''; prioritySelect.value = '';
        }
      };
      topRow.append(wrap('Asset', assetSelect), wrap('Priority', prioritySelect), wrap('Reason', reasonInput), wrap('Action', createBtn));

      const bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; align-items:end;';
      const manageBtn = btn('Assign Crew');
      bottomRow.append(wrap('Work Order', orderSelect), wrap('Available Crew', crewSelect), wrap('Action', manageBtn));

      orderSelect.addEventListener('change', () => {
        const state = typeof getState === 'function' ? getState() : {maintenanceOrders: []};
        const order = state.maintenanceOrders?.find(o => o.orderId === orderSelect.value);
        if (!order) { manageBtn.disabled = true; manageBtn.onclick = null; return; }
        manageBtn.disabled = false; manageBtn.style.opacity = '1';
        if (order.status === 'Pending') {
          manageBtn.textContent = 'Assign Crew';
          manageBtn.onclick = () => runAction(() => assignCrew(orderSelect.value, crewSelect.value), manageBtn);
        } else if (order.status === 'Assigned') {
          manageBtn.textContent = 'Start Work';
          manageBtn.onclick = () => runAction(() => changeOrderStatus(orderSelect.value, 'In Progress'), manageBtn);
        } else if (order.status === 'In Progress') {
          manageBtn.textContent = 'Complete Work';
          manageBtn.onclick = () => runAction(() => changeOrderStatus(orderSelect.value, 'Completed'), manageBtn);
        } else {
          manageBtn.textContent = 'Completed';
          manageBtn.disabled = true; manageBtn.style.opacity = '0.5';
        }
      });
      controlsContainer.append(topRow, bottomRow);

    } else if (isOperator) {
      assetSelect = createSelect();
      const prioritySelect = createSelect();
      prioritySelect.innerHTML = `<option value="">Auto (AI Recommended)</option><option value="Critical">Critical</option><option value="Elevated">Elevated</option><option value="Stable">Stable</option>`;
      const reasonInput = createInput('Optional note...');
      const actionBtn = btn('Create Work Order');

      controlsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      actionBtn.onclick = async () => {
        if (await runAction(() => createOrder(assetSelect.value, prioritySelect.value || null, reasonInput.value || null), actionBtn)) {
          reasonInput.value = ''; prioritySelect.value = '';
        }
      };
      controlsContainer.append(wrap('Asset', assetSelect), wrap('Priority', prioritySelect), wrap('Reason / Maintenance Note', reasonInput), wrap('Action', actionBtn));

    } else if (isFieldSupervisor) {
      orderSelect = createSelect();
      crewSelect = createSelect();
      const actionBtn = btn('Assign Crew');

      controlsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
      actionBtn.onclick = () => runAction(() => assignCrew(orderSelect.value, crewSelect.value), actionBtn);
      controlsContainer.append(wrap('Pending Work Order', orderSelect), wrap('Available Crew', crewSelect), wrap('Action', actionBtn));

    } else if (isMaintenance) {
      orderSelect = createSelect();
      const actionBtn = btn('Start Work');

      controlsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
      controlsContainer.append(wrap('Assigned Work Order', orderSelect), wrap('Action', actionBtn));

      orderSelect.addEventListener('change', () => {
        const state = typeof getState === 'function' ? getState() : {maintenanceOrders: []};
        const order = state.maintenanceOrders?.find(o => o.orderId === orderSelect.value);
        if (!order) { actionBtn.disabled = true; actionBtn.onclick = null; return; }
        if (order.status === 'Assigned') {
          actionBtn.textContent = 'Start Work';
          actionBtn.disabled = false; actionBtn.style.opacity = '1';
          actionBtn.onclick = () => runAction(() => changeOrderStatus(orderSelect.value, 'In Progress'), actionBtn);
        } else if (order.status === 'In Progress') {
          actionBtn.textContent = 'Complete Work';
          actionBtn.disabled = false; actionBtn.style.opacity = '1';
          actionBtn.onclick = () => runAction(() => changeOrderStatus(orderSelect.value, 'Completed'), actionBtn);
        } else {
          actionBtn.textContent = 'No Action Available';
          actionBtn.disabled = true; actionBtn.style.opacity = '0.5';
        }
      });
    } else {
      controlsContainer.innerHTML = '<div style="color:#5b7175; font-size:13px;">No operational actions available for your role.</div>';
    }

    const anchor = document.querySelector('.page-header, .page-head') || document.querySelector('main');
    if (anchor?.matches('.page-header, .page-head')) anchor.after(panel);
    else anchor?.prepend(panel);

    setTimeout(() => { if (orderSelect && orderSelect.dispatchEvent) orderSelect.dispatchEvent(new Event('change')); }, 100);
  }

  // =========================================================
  // DEDICATED IN-PAGE DATA MANAGEMENT WORKFLOWS
  // =========================================================

  // 1. ASSETS PAGE DATA MANAGEMENT WORKFLOWS
  if (page === 'assets') {
    // Inject "+ Add Asset" button into toolbar
    const toolbarRight = document.querySelector('.toolbar-right');
    if (toolbarRight && isAdmin && !document.getElementById('addAssetBtn')) {
      const addAssetBtn = document.createElement('button');
      addAssetBtn.id = 'addAssetBtn';
      addAssetBtn.type = 'button';
      addAssetBtn.className = 'primary-btn';
      addAssetBtn.style.cssText = 'padding: 6px 14px; font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;';
      addAssetBtn.textContent = '+ Add Asset';

      if (!isAdmin) {
        addAssetBtn.disabled = true;
        addAssetBtn.title = 'Only Utility Administrators can add assets';
        addAssetBtn.style.opacity = '0.5';
      } else {
        addAssetBtn.onclick = () => {
          const state = getState();
          const region = state.region?.name || localStorage.getItem('gridguard-region') || REGIONS[0];
          createModal({
            title: 'Add New Monitored Asset',
            subtitle: `Register an electrical asset in ${region} · SIMULATED utility data`,
            submitText: 'Create Asset',
            contentHtml: `
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Asset ID *</label>
                  <input name="assetId" required placeholder="e.g. TR-220" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Asset Type *</label>
                  <select name="type" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;">
                    <option value="Transformer">Transformer</option>
                    <option value="Substation">Substation</option>
                    <option value="Circuit Breaker">Circuit Breaker</option>
                  </select>
                </div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Region *</label>
                  <input name="region" readonly value="${region}" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; border-radius:6px; color:#94a3b8;" />
                </div>
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Sub-Area / Neighborhood *</label>
                  <input name="area" required placeholder="e.g. Naroda" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Latitude</label>
                  <input name="latitude" type="number" step="0.0001" value="23.0300" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Longitude</label>
                  <input name="longitude" type="number" step="0.0001" value="72.6500" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Manufacturer</label>
                  <select name="manufacturer" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;">
                    <option value="ABB">ABB</option>
                    <option value="BHEL">BHEL</option>
                    <option value="Siemens">Siemens</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Installation Year</label>
                  <input name="installationYear" type="number" value="2018" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
              </div>
            `,
            onSubmit: async formData => {
              const data = Object.fromEntries(formData.entries());
              await addAsset(data);
              message(`Asset ${data.assetId} created successfully`);
            }
          });
        };
      }
      toolbarRight.prepend(addAssetBtn);
    }

    // Ingest Telemetry button in Drawer
    const drawerActions = document.querySelector('.drawer-actions');
    if (drawerActions && isOperator && !document.getElementById('ingestTelemetryBtn')) {
      const ingestBtn = document.createElement('button');
      ingestBtn.id = 'ingestTelemetryBtn';
      ingestBtn.type = 'button';
      ingestBtn.className = 'primary-action';
      ingestBtn.style.cssText = 'background: #2563eb; color: #fff; cursor: pointer; text-align: center;';
      ingestBtn.textContent = '⚡ Ingest Telemetry';

      if (!isOperator) {
        ingestBtn.disabled = true;
        ingestBtn.style.opacity = '0.5';
      } else {
        ingestBtn.onclick = () => {
          const assetId = document.getElementById('drawerAssetId')?.textContent?.trim();
          if (!assetId) return;

          const state = typeof getState === 'function' ? getState() : {assets: []};
          const asset = state.assets?.find(a => a.assetId === assetId) || {};
          const assetType = asset.type || 'Transformer';
          const assetRegion = asset.region || 'Unknown Region';

          document.getElementById('ggModalOverlay')?.remove();

          const overlay = document.createElement('div');
          overlay.id = 'ggModalOverlay';
          overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; padding: 16px; opacity: 0; transition: opacity 0.25s ease;
          `;

          const modal = document.createElement('div');
          modal.id = 'ggModal';
          modal.style.cssText = `
            background: rgba(247, 250, 248, 0.98);
            border: 1px solid rgba(191, 212, 204, 0.9);
            border-radius: 19px;
            box-shadow: 0 22px 55px rgba(18, 61, 48, 0.15);
            max-width: 520px; width: 100%; max-height: 90vh; overflow-y: auto;
            color: #10262c; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px;
            transform: translateY(16px); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: "DM Sans", sans-serif;
          `;

          modal.innerHTML = `
            <style>
              .telemetry-grid {
                display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
              }
              @media (max-width: 480px) {
                .telemetry-grid { grid-template-columns: 1fr; }
              }
              .tel-input-group {
                display: flex; flex-direction: column; gap: 5px;
              }
              .tel-label {
                font-size: 11px; font-weight: 700; color: #29444b;
              }
              .tel-input {
                width: 100%; height: 39px; background: #e9f0ed; border: 1px solid #ccd9d4;
                border-radius: 9px; padding: 0 12px; color: #0d2229; font-size: 12.5px;
                outline: none; transition: 0.2s ease; font-family: "DM Sans", sans-serif;
              }
              .tel-input:hover { border-color: #a9c5bb; }
              .tel-input:focus {
                border-color: #74aa9a; box-shadow: 0 0 0 3px rgba(0, 118, 93, 0.065); transform: translateY(-1px);
              }
              .tel-chip {
                background: #e9f0ed; border: 1px solid #ccd9d4; color: #29444b;
                border-radius: 20px; padding: 6px 14px; font-size: 11px; font-weight: 600;
                cursor: pointer; transition: 0.2s ease;
              }
              .tel-chip:hover {
                background: #dceee8; border-color: #a9c5bb; transform: translateY(-1px);
              }
              .tel-chip.active {
                background: #00765d; color: #fff; border-color: #005c49;
              }
              .tel-btn-cancel {
                padding: 10px 18px; border-radius: 9px; background: transparent;
                border: 1px solid transparent; color: #5b7175; font-size: 12px; font-weight: 700;
                cursor: pointer; transition: 0.2s ease;
              }
              .tel-btn-cancel:hover { background: #e9f0ed; color: #10262c; }
              .tel-btn-submit {
                padding: 10px 22px; border-radius: 9px; background: #00765d;
                border: none; color: #fff; font-size: 12px; font-weight: 700;
                cursor: pointer; transition: 0.2s ease; box-shadow: 0 6px 12px rgba(0, 118, 93, 0.15);
              }
              .tel-btn-submit:hover { background: #005c49; transform: translateY(-1px); }
            </style>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="margin: 0; font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 700; color: #10262c; letter-spacing: -0.5px;">Ingest Telemetry</h3>
                <span style="background: #e9f0ed; border: 1px solid #ccd9d4; color: #5b7175; font-size: 9px; font-weight: 800; padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px;">SIMULATED DATA</span>
              </div>
              <div style="font-size: 11px; font-weight: 600; color: #5b7175; margin-top: 6px;">${assetId} · ${assetType} · ${assetRegion}</div>
              <p style="margin: 12px 0 0; font-size: 12px; color: #5b7175; line-height: 1.5;">Add a simulated sensor reading to evaluate the asset's current condition and risk.</p>
            </div>

            <form id="ggModalForm" style="display: flex; flex-direction: column; gap: 16px;">
              <input type="hidden" name="assetId" value="${assetId}" />

              <div class="telemetry-grid">
                <div class="tel-input-group">
                  <label class="tel-label">Temperature (°C)</label>
                  <input class="tel-input" id="inTemp" name="temperature" type="number" step="0.1" value="62.5" />
                </div>
                <div class="tel-input-group">
                  <label class="tel-label">Oil Temperature (°C)</label>
                  <input class="tel-input" id="inOilTemp" name="oilTemperature" type="number" step="0.1" value="68.0" />
                </div>
                <div class="tel-input-group">
                  <label class="tel-label">Vibration (mm/s)</label>
                  <input class="tel-input" id="inVib" name="vibration" type="number" step="0.1" value="2.2" />
                </div>
                <div class="tel-input-group">
                  <label class="tel-label">Partial Discharge (pC)</label>
                  <input class="tel-input" id="inPD" name="partialDischarge" type="number" value="65" />
                </div>
                <div class="tel-input-group">
                  <label class="tel-label">Oil Quality (%)</label>
                  <input class="tel-input" id="inOilQ" name="oilQuality" type="number" value="82" />
                </div>
                <div class="tel-input-group">
                  <label class="tel-label">Load (%)</label>
                  <input class="tel-input" id="inLoad" name="loadPercentage" type="number" step="0.1" value="74.5" />
                </div>
              </div>

              <div style="margin-top: 4px;">
                <div style="font-size: 10px; font-weight: 700; color: #718289; margin-bottom: 8px;">QUICK SIMULATION PRESETS</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="presetContainer">
                  <button type="button" class="tel-chip" id="btnSpikeThermal">Thermal Stress</button>
                  <button type="button" class="tel-chip" id="btnSpikeInsulation">Insulation Spike</button>
                  <button type="button" class="tel-chip" id="btnSpikeHealthy">Healthy Baseline</button>
                </div>
              </div>

              <div id="ggModalError" style="display: none; color: #982e38; font-size: 11px; padding: 10px; background: #f4dfe1; border-radius: 9px; font-weight: 500;"></div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 16px; border-top: 1px solid #d4e1dc;">
                <button type="button" id="ggModalCancel" class="tel-btn-cancel">Cancel</button>
                <button type="submit" id="ggModalSubmit" class="tel-btn-submit">Ingest Reading</button>
              </div>
            </form>
          `;

          overlay.appendChild(modal);
          document.body.appendChild(overlay);

          requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'translateY(0)';
          });

          const close = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'translateY(16px)';
            setTimeout(() => overlay.remove(), 250);
          };

          overlay.querySelector('#ggModalCancel').onclick = close;
          overlay.onclick = e => { if (e.target === overlay) close(); };

          const form = overlay.querySelector('#ggModalForm');
          const errBox = overlay.querySelector('#ggModalError');
          const submitBtn = overlay.querySelector('#ggModalSubmit');

          form.onsubmit = async e => {
            e.preventDefault();
            errBox.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Ingesting...';
            try {
              const data = Object.fromEntries(new FormData(form).entries());
              await addTelemetry(data);
              message(`Telemetry ingested for ${assetId} · Risk recalculated`);
              close();
            } catch (err) {
              errBox.textContent = errorText(err);
              errBox.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Ingest Reading';
            }
          };

          // Presets logic
          const chips = overlay.querySelectorAll('.tel-chip');
          const clearChips = () => chips.forEach(c => c.classList.remove('active'));

          overlay.querySelector('#btnSpikeThermal').onclick = function() {
            clearChips(); this.classList.add('active');
            overlay.querySelector('#inTemp').value = '94.2';
            overlay.querySelector('#inOilTemp').value = '104.8';
            overlay.querySelector('#inLoad').value = '98.5';
          };
          overlay.querySelector('#btnSpikeInsulation').onclick = function() {
            clearChips(); this.classList.add('active');
            overlay.querySelector('#inPD').value = '480';
            overlay.querySelector('#inOilQ').value = '25';
            overlay.querySelector('#inVib').value = '5.8';
          };
          overlay.querySelector('#btnSpikeHealthy').onclick = function() {
            clearChips(); this.classList.add('active');
            overlay.querySelector('#inTemp').value = '48.0';
            overlay.querySelector('#inOilTemp').value = '52.0';
            overlay.querySelector('#inLoad').value = '62.0';
            overlay.querySelector('#inPD').value = '18';
            overlay.querySelector('#inOilQ').value = '92';
            overlay.querySelector('#inVib').value = '1.2';
          };
        };
      }
      drawerActions.prepend(ingestBtn);
    }

    // Edit Asset button in Drawer (Utility Administrators only)
    if (drawerActions && isAdmin && !document.getElementById('editAssetBtn')) {
      const editBtn = document.createElement('button');
      editBtn.id = 'editAssetBtn';
      editBtn.type = 'button';
      editBtn.className = 'primary-action';
      editBtn.style.cssText = 'background: #00765d; color: #fff; cursor: pointer; text-align: center;';
      editBtn.textContent = '✎ Edit Asset';

      editBtn.onclick = () => {
        const assetId = document.getElementById('drawerAssetId')?.textContent?.trim();
        if (!assetId) return;
        const state = getState();
        const asset = state.assets?.find(a => a.assetId === assetId);
        if (!asset) return;
        const num = v => Number(v ?? 0);
        createModal({
          title: 'Edit Monitored Asset',
          subtitle: `Update administrative details for ${escapeHTML(assetId)} · SIMULATED utility data`,
          submitText: 'Save Changes',
          contentHtml: `
            <div>
              <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Asset Name</label>
              <input name="name" required value="${escapeHTML(asset.name || '')}" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Asset Type</label>
                <select name="type" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;">
                  ${['Transformer','Substation','Circuit Breaker'].map(t => `<option value="${t}" ${asset.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Sub-Area / Neighborhood</label>
                <input name="area" required value="${escapeHTML(asset.area || '')}" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Latitude</label>
                <input name="latitude" type="number" step="0.0001" value="${num(asset.latitude)}" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Longitude</label>
                <input name="longitude" type="number" step="0.0001" value="${num(asset.longitude)}" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Operating Status</label>
                <select name="status" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;">
                  ${['Operational','Maintenance','Outage'].map(s => `<option value="${s}" ${asset.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Installation Year</label>
                <input name="installationYear" type="number" value="${num(asset.installationYear)}" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
            </div>
            <div>
              <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Manufacturer</label>
              <select name="manufacturer" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;">
                ${['ABB','BHEL','Siemens'].map(m => `<option value="${m}" ${asset.manufacturer === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <input type="hidden" name="assetId" value="${escapeHTML(assetId)}" />
            <input type="hidden" name="region" value="${escapeHTML(asset.region || REGIONS[0])}" />
            <input type="hidden" name="dataSource" value="simulated" />
          `,
          onSubmit: async formData => {
            const data = Object.fromEntries(formData.entries());
            await updateAsset(assetId, {
              name: data.name,
              type: data.type,
              area: data.area,
              status: data.status,
              installationYear: Number(data.installationYear),
              manufacturer: data.manufacturer,
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              region: data.region,
              dataSource: data.dataSource
            });
            message(`Asset ${escapeHTML(assetId)} updated`);
          }
        });
      };
      drawerActions.prepend(editBtn);
    }
  }

  // 3. CREWS PAGE DATA MANAGEMENT
  if (page === 'crews') {
    const head = document.querySelector('.page-header');
    if (head && isAdmin && !document.getElementById('addCrewBtn')) {
      const addCrewBtn = document.createElement('button');
      addCrewBtn.id = 'addCrewBtn';
      addCrewBtn.type = 'button';
      addCrewBtn.className = 'primary-btn';
      addCrewBtn.style.cssText = 'padding: 6px 14px; font-size: 13px; font-weight: 500; margin-left: auto;';
      addCrewBtn.textContent = '+ Add Crew';

      if (!isAdmin) {
        addCrewBtn.disabled = true;
        addCrewBtn.title = 'Only Utility Administrators can add crews';
        addCrewBtn.style.opacity = '0.5';
      } else {
        addCrewBtn.onclick = () => {
          const state = getState();
          const region = state.region?.name || localStorage.getItem('gridguard-region') || REGIONS[0];
          createModal({
            title: 'Register Response Crew',
            subtitle: `Add field response personnel in ${region}`,
            submitText: 'Create Crew',
            contentHtml: `
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Crew ID *</label>
                <input name="crewId" required placeholder="e.g. CREW-${region.slice(0,3)}-5" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Crew Name *</label>
                <input name="name" required placeholder="e.g. Crew Echo" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Region *</label>
                  <input name="region" readonly value="${region}" style="width:100%; padding:8px; background:#0f172a; border:1px solid #334155; border-radius:6px; color:#94a3b8;" />
                </div>
                <div>
                  <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Assigned Area</label>
                  <input name="currentArea" placeholder="e.g. Industrial Zone" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
                </div>
              </div>
              <div>
                <label style="display:block; font-size:12px; margin-bottom:4px; color:#94a3b8;">Team Lead Name</label>
                <input name="leadName" placeholder="e.g. Rajesh Sharma" style="width:100%; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff;" />
              </div>
            `,
            onSubmit: async formData => {
              const data = Object.fromEntries(formData.entries());
              await addCrew(data);
              message(`Crew ${data.name} registered`);
            }
          });
        };
      }
      head.append(addCrewBtn);
    }
  }

  // 2. INCIDENTS PAGE DATA MANAGEMENT
  if (page === 'incidents') {
    // We inject the button into the panel-head of Incident Queue
    const panelHead = document.querySelector('.incident-layout .panel-head');
    if (panelHead && !document.getElementById('reportIncidentBtn') && isOperator) {
      const reportBtn = document.createElement('button');
      reportBtn.id = 'reportIncidentBtn';
      reportBtn.className = 'primary-btn';
      reportBtn.style.cssText = 'padding: 8px 16px; background: #00765d; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(0,118,93,0.15); display: flex; align-items: center; gap: 6px; margin-left: 10px;';
      reportBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Report Incident
      `;
      reportBtn.onclick = () => {
        const state = getState();
        if (!state || !state.assets) return;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(16,38,44,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:"DM Sans",sans-serif;padding:20px;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#f7faf8;border:1px solid rgba(191,212,204,0.9);border-radius:19px;padding:32px;width:100%;max-width:500px;box-shadow:0 12px 32px rgba(18,61,48,0.15);';

        const head = document.createElement('div');
        head.innerHTML = `
          <h3 style="margin:0 0 4px;font-family:'Manrope',sans-serif;font-size:20px;color:#10262c;">Report Incident</h3>
          <p style="margin:0 0 24px;font-size:13px;color:#5b7175;">Log a new operational incident to the grid management system.</p>
        `;

        const form = document.createElement('div');
        form.style.cssText = 'display:grid;gap:16px;';

        const inputStyle = 'width:100%;padding:10px 12px;background:#e9f0ed;border:1px solid #ccd9d4;border-radius:9px;color:#0d2229;font-size:13px;outline:none;box-sizing:border-box;font-family:inherit;';
        const labelStyle = 'display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:#29444b;';

        const assetGroup = document.createElement('div');
        const assetSelectElem = document.createElement('select');
        assetSelectElem.id = 'reportAsset';
        assetSelectElem.style.cssText = inputStyle;
        state.assets.forEach(a => {
          const opt = document.createElement('option');
          opt.value = a.assetId;
          opt.textContent = `${a.assetId} · ${a.area || a.name}`;
          assetSelectElem.append(opt);
        });
        assetGroup.innerHTML = `<label style="${labelStyle}">Asset</label>`;
        assetGroup.append(assetSelectElem);

        const titleGroup = document.createElement('div');
        titleGroup.innerHTML = `<label style="${labelStyle}">Title / Summary</label><input id="reportTitle" type="text" placeholder="e.g. Transformer Overheating" style="${inputStyle}">`;

        const severityGroup = document.createElement('div');
        severityGroup.innerHTML = `<label style="${labelStyle}">Severity</label><select id="reportSeverity" style="${inputStyle}"><option value="Stable">Stable</option><option value="Elevated">Elevated</option><option value="Critical">Critical</option></select>`;

        const loadGroup = document.createElement('div');
        loadGroup.innerHTML = `<label style="${labelStyle}">Affected Load (MW)</label><input id="reportLoad" type="number" step="0.1" value="0.0" style="${inputStyle}">`;

        const descGroup = document.createElement('div');
        descGroup.innerHTML = `<label style="${labelStyle}">Detailed Description</label><textarea id="reportDesc" rows="3" placeholder="Additional context..." style="${inputStyle}resize:vertical;"></textarea>`;

        const errBanner = document.createElement('div');
        errBanner.style.cssText = 'display:none;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:9px;color:#991b1b;font-size:13px;align-items:center;';

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;justify-content:flex-end;gap:12px;margin-top:8px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding:10px 20px;background:transparent;color:#5b7175;border:1px solid #ccd9d4;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;';
        cancelBtn.onclick = () => overlay.remove();

        const submitBtn = document.createElement('button');
        submitBtn.id = 'reportSubmitBtn';
        submitBtn.textContent = 'Report Incident';
        submitBtn.style.cssText = 'padding:10px 20px;background:#00765d;color:#fff;border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 10px rgba(0,118,93,0.15);';

        submitBtn.onclick = async () => {
          const title = document.getElementById('reportTitle').value.trim();
          const desc = document.getElementById('reportDesc').value.trim();
          const load = parseFloat(document.getElementById('reportLoad').value) || 0;

          if (!title) {
            errBanner.textContent = 'Please provide a title.';
            errBanner.style.display = 'block';
            return;
          }

          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.7';
          errBanner.style.display = 'none';

          try {
            await createIncident(
              assetSelectElem.value,
              title,
              {
                severity: document.getElementById('reportSeverity').value,
                description: desc,
                affectedLoadMW: load
              }
            );
            overlay.remove();
          } catch (e) {
            console.error(e);
            errBanner.innerHTML = `<b>Service temporarily unavailable</b><br/>Could not report incident.`;
            errBanner.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
          }
        };

        actions.append(cancelBtn, submitBtn);
        form.append(assetGroup, titleGroup, severityGroup, loadGroup, descGroup, errBanner, actions);
        modal.append(head, form);
        overlay.append(modal);
        document.body.append(overlay);
      };
      panelHead.append(reportBtn);
    }
  }

  // 3. CREWS PAGE DATA MANAGEMENT WORKFLOWS
  if (page === 'crews') {
    if (isFieldSupervisor) {
      const panel = document.createElement('div');
      panel.id = 'fieldOperationsPanel';
      panel.style.cssText = `
        background: #f7faf8; border: 1px solid rgba(191,212,204,0.9);
        border-radius: 19px; padding: 24px; margin-top: 24px; margin-bottom: 24px;
        box-shadow: 0 4px 12px rgba(18,61,48,0.05); font-family: "DM Sans", sans-serif;
      `;

      banner = document.createElement('div');
      banner.style.cssText = 'display:none; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:9px; color:#991b1b; margin-bottom:16px; font-size:13px; align-items:center; justify-content:space-between;';

      const header = document.createElement('div');
      header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;';

      const title = document.createElement('div');
      title.innerHTML = `
        <h3 style="margin:0; font-size:16px; font-weight:700; color:#10262c; letter-spacing:-0.2px;">Field Operations</h3>
        <p style="margin:4px 0 0 0; font-size:13px; color:#5b7175;">Assign available crews to pending maintenance work orders.</p>
      `;

      const roleBadge = document.createElement('div');
      roleBadge.style.cssText = 'padding:4px 10px; background:#e9f0ed; border:1px solid #ccd9d4; border-radius:20px; font-size:11px; font-weight:700; color:#29444b; text-transform:uppercase; letter-spacing:0.5px;';
      roleBadge.textContent = formattedRole;

      header.append(title, roleBadge);

      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'fieldOperationControls';

      orderSelect = createSelect();
      crewSelect = createSelect();

      const bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; align-items:end;';
      const manageBtn = btn('Assign Crew');
      bottomRow.append(wrap('Pending Work Order', orderSelect), wrap('Available Crew', crewSelect), wrap('Action', manageBtn));

      manageBtn.onclick = async () => {
        if (!orderSelect.value || !crewSelect.value) return;
        const oVal = orderSelect.value, cVal = crewSelect.value;
        const { assignCrew } = await import('./firestore.js');
        if (await runAction(() => assignCrew(oVal, cVal), manageBtn)) {
          orderSelect.dispatchEvent(new Event('change'));
        }
      };

      controlsContainer.append(bottomRow);
      panel.append(header, banner, controlsContainer);

      const main = document.querySelector('main');
      const bottomGrid = document.querySelector('.bottom-grid');
      if (main && bottomGrid) {
        main.insertBefore(panel, bottomGrid);
      } else if (main) {
        main.append(panel);
      }
    }
  }

  // Refresh dropdown options for tests and controls
  function updateOptions(el, rows, placeholder) {
    if (!el) return;
    const old = el.value;
    el.replaceChildren();
    for (const [value, label] of rows) {
      const opt = new Option(label, value);
      el.add(opt);
    }
    if (!rows.length) el.add(new Option(placeholder, ''));
    if ([...el.options].some(o => o.value === old)) el.value = old;
  }

  return () => {
    const s = getState();
    if (!s) return;
    updateOptions(assetSelect, (s.assets || []).map(a => [a.assetId, `${a.assetId} · ${a.area || a.name}`]), 'No assets');
    updateOptions(orderSelect, (s.maintenanceOrders || []).filter(o => page === 'crews' || role === 'field_supervisor' ? o.status === 'Pending' : role === 'maintenance' ? ['Assigned', 'In Progress'].includes(o.status) : o.status !== 'Completed').map(o => [o.orderId, `${o.orderId} · ${o.status}`]), 'No active orders');
    updateOptions(crewSelect, (s.crews || []).filter(c => c.status === 'Ready' && c.availability && !c.assignedOrderId).map(c => [c.crewId, c.name]), 'No available crews');
    orderSelect?.dispatchEvent(new Event('change'));
    if (page === 'crews' || role === 'field_supervisor') {
      const assign = document.querySelector('#fieldOperationsPanel button, #maintenanceActionsPanel button');
      if (assign) assign.disabled = !orderSelect?.value || !crewSelect?.value;
    }
    updateOptions(incidentSelect, (s.incidents || []).filter(i => i.status !== 'Resolved').map(i => [i.incidentId, `${i.incidentId} · ${i.status}`]), 'No open incidents');
  };
}
