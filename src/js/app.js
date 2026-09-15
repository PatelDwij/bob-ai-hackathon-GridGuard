import { isFallback, showFallback } from './demo-session.js';
import { requireUser, bindLogout } from './auth.js';
import { subscribeRegion } from './firestore.js';
import { buildView } from './view-model.js';
import { REGIONS, safeView, message, errorText, millis } from './utils.js';
import { mountOperations } from './operations.js';
import { mountSettings } from './settings.js';
import { bindSensorTrend } from './sensors.js';
import { fetchWeather } from './weather.js';

const page = location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
let renderer, state, stop, epoch = 0, updateControls, views = {}, user, pageModule;
const selector = document.getElementById('regionSelect');
const main = document.querySelector('main');
let connectionTimeout = null;

function loading(on) {
  document.querySelectorAll('#fieldOperationControls button, #fieldOperationControls select').forEach(el => el.disabled = on);
  if (on && !renderer) {
    for (const id of ['topWeather', 'weatherChip', 'streamingCount', 'streamCount', 'activeOrdersTop', 'crewCountTop', 'activeTop']) {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    }
  }
  if (main) {
    main.setAttribute('aria-busy', String(on));
  }
}

function selectRegion(region) {
  if (!REGIONS.includes(region)) region = REGIONS[0];
  if (selector) selector.value = region;
  localStorage.setItem('gridguard-region', region);
  stop?.();
  if (connectionTimeout) clearTimeout(connectionTimeout);

  const ticket = ++epoch;
  loading(true);
  message(`Connecting to Firestore · Loading ${region}…`);
  document.getElementById('assetDrawer')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('open');
  document.body.style.overflow = '';

  // Bounded loading timeout guard (10 seconds)
  connectionTimeout = setTimeout(() => {
    if (ticket === epoch && !state) {
      loading(false);
      message(`Connection to ${region} taking longer than usual. Please check your network connection.`, true);
      const connEl = document.getElementById('connectionStatus');
      if (connEl && !document.getElementById('retryConnectionBtn')) {
        const retryBtn = document.createElement('button');
        retryBtn.id = 'retryConnectionBtn';
        retryBtn.type = 'button';
        retryBtn.className = 'secondary-btn';
        retryBtn.style.cssText = 'margin-left:8px;padding:2px 8px;font-size:12px;display:inline-block;';
        retryBtn.textContent = 'Retry';
        retryBtn.onclick = () => selectRegion(region);
        connEl.append(retryBtn);
      }
    }
  }, 10000);

  let weatherRequested = false, liveWeather = null;

  stop = subscribeRegion(region, async s => {
    if (ticket !== epoch) return;
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    state = s;

    try {
      const projected = buildView(liveWeather ? { ...s, weatherSnapshots: [liveWeather] } : s, page);
      projected.zoom = Number(user?.preferences?.mapZoom) || 12;
      if (projected.map) projected.map.zoom = projected.zoom;
      const v = safeView(projected);
      views[region] = v;

      if (!renderer) {
        renderer = pageModule.mount(views, user);
        updateControls = mountOperations(page, () => state, user);
        if (page === 'assets') bindSensorTrend(() => state);
      } else {
        renderer.refresh(region, v);
      }

      updateControls?.();
      loading(false);

      if (user?.preferences?.rememberSidebar && localStorage.getItem('gridguard-sidebar-collapsed') === '1') {
        document.getElementById('sidebar')?.classList.add('collapsed');
      }

      showFallback();
      message(`${isFallback() ? 'Demo Fallback · Simulated Data · ' : ''}${region} · SIMULATED utility telemetry · Weighted heuristic, not a trained ML model${s.assets.length ? '' : ' · No assets found; run the seed script.'}`);

      const evidence = document.getElementById('evidenceList');
      if (evidence) evidence.hidden = user?.preferences?.showEvidence === false;

      const alerts = s.predictions.filter(p => p.riskScore >= Number(user?.preferences?.criticalThreshold || 75));
      if (alerts.length && user?.preferences?.alertCritical !== false) {
        const connEl = document.getElementById('connectionStatus');
        if (connEl) connEl.textContent += ` · ${alerts.length} assets exceed your critical alert threshold`;
      }

      document.querySelectorAll('.menu-item').forEach(link => {
        if (link.getAttribute('href') === 'incidents.html') {
          const badge = link.querySelector('.badge');
          if (badge) badge.textContent = s.incidents.filter(i => i.status !== 'Resolved').length;
        }
      });

      if (!weatherRequested && !isFallback()) {
        weatherRequested = true;
        const fallback = s.weatherSnapshots.slice().sort((a, b) => millis(b.timestamp) - millis(a.timestamp))[0];
        fetchWeather(s.region || { name: region }, fallback || { condition: 'Unavailable' }, { provider: import.meta.env.VITE_WEATHER_PROVIDER }).then(w => {
          if (ticket !== epoch || w.source !== 'open-meteo') return;
          liveWeather = w;
          const view = safeView(buildView({ ...state, weatherSnapshots: [w] }, page));
          renderer.refresh(region, view);
        });
      }
    } catch (e) {
      loading(false);
      message(errorText(e), true);
      console.error(e);
    }
  }, e => {
    if (ticket === epoch) {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      loading(false);
      message(`${errorText(e)} Change region or reload to retry.`, true);
    }
  });
}

loading(true);
message('Connecting to Firebase…');
bindLogout();

try {
  user = await requireUser();
  if (user) {
    if (page === 'settings') {
      loading(false);
      await mountSettings(user);
      showFallback();
      message(isFallback() ? 'Account settings · Demo Fallback · Simulated Data' : 'Account settings · Firebase');
    } else {
      if (['dashboard', 'risk-map'].includes(page)) await import('./maps.js');
      pageModule = await import(`./pages/${page}.js`);
      if (selector) {
        selector.addEventListener('change', e => {
          e.stopImmediatePropagation();
          selectRegion(e.target.value);
        }, true);
      }
      window.addEventListener('storage', e => {
        if (e.key === 'gridguard-region' && selector && e.newValue !== selector.value) {
          selectRegion(e.newValue);
        }
      });
      selectRegion(localStorage.getItem('gridguard-region') || user.defaultRegion);
    }
  }
} catch (e) {
  loading(false);
  message(errorText(e), true);
}

window.addEventListener('pagehide', () => {
  stop?.();
  if (connectionTimeout) clearTimeout(connectionTimeout);
});
window.addEventListener('beforeunload', () => {
  stop?.();
  if (connectionTimeout) clearTimeout(connectionTimeout);
});
