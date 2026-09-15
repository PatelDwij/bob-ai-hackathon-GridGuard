// Local simulation is isolated from Firebase and survives same-tab navigation/refresh.
export const forceDemo = import.meta.env?.VITE_FORCE_DEMO_DATA === 'true';
export const isFallback = () => forceDemo || sessionStorage.getItem('gridguard-fallback') === 'true';
export const fallbackEligible = error => /429|too-many-requests|resource-exhausted|network-request-failed|unavailable|deadline-exceeded|network|timeout|failed to fetch/i.test(`${error?.code || ''} ${error?.message || ''}`);
export function activateFallback() {
  sessionStorage.setItem('gridguard-fallback', 'true');
  window.dispatchEvent(new Event('gridguard-fallback'));
  showFallback();
}
export function showFallback() {
  if (!isFallback()) return;
  let badge = document.getElementById('demoFallbackBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'demoFallbackBadge';
    badge.setAttribute('role', 'status');
    badge.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:10000;background:#fff4cc;color:#573f00;border:1px solid #d5b855;border-radius:8px;padding:9px 14px;font:600 13px sans-serif;pointer-events:none';
    document.body.append(badge);
  }
  badge.textContent = 'Demo Fallback · Simulated Data';
}
export function sessionProfile() {
  return JSON.parse(sessionStorage.getItem('gridguard-demo-profile') || 'null');
}
export function saveProfile(profile) {
  sessionStorage.setItem('gridguard-demo-profile', JSON.stringify(profile));
  return profile;
}
export function startDemo(role = 'operator') {
  activateFallback();
  return saveProfile({uid:'local-demo',name:'Demo Operator',email:'local-demo@gridguard.test',role,defaultRegion:'Ahmedabad East'});
}
