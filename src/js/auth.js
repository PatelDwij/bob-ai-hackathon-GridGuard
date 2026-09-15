import { forceDemo, isFallback, fallbackEligible, activateFallback, showFallback, sessionProfile, saveProfile, startDemo } from './demo-session.js';
import { browserLocalPersistence, setPersistence, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, configured } from './firebase-config.js';
import { REGIONS, errorText, message } from './utils.js';

export function normalizeRole(role) {
  if (!role) return 'operator';
  const r = String(role).toLowerCase();
  if (r.includes('admin') || r.includes('utility')) return 'admin';
  if (r.includes('maint')) return 'maintenance';
  if (r.includes('field') || r.includes('supervisor')) return 'field_supervisor';
  if (r.includes('analyst') || r.includes('reliab') || r.includes('view')) return 'reliability';
  return 'operator';
}

export function formatRoleName(role) {
  switch (role) {
    case 'admin': return 'Utility Administrator';
    case 'maintenance': return 'Maintenance Engineer';
    case 'field_supervisor': return 'Field Supervisor';
    case 'reliability': return 'Reliability Engineer';
    case 'operator':
    default: return 'Grid Operator';
  }
}

export async function requireUser(publicAuth = false) {
  if (isFallback()) {
    showFallback();
    const profile = sessionProfile() || (forceDemo && !publicAuth ? startDemo() : null);
    if (!profile && !publicAuth) location.replace('login.html');
    if (profile && publicAuth) { location.replace('dashboard.html'); return null; }
    return profile;
  }
  if (!configured) throw new Error('Firebase is not configured. Follow FIREBASE_SETUP.md, then restart the frontend.');
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn('Persistence setup warning:', e);
  }

  // Bounded auth state resolution (max 8s to prevent infinite spinner)
  const user = await new Promise((resolve, reject) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        stop();
        resolve(auth?.currentUser || null);
      }
    }, 8000);
    const stop = onAuthStateChanged(auth, u => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        stop();
        resolve(u);
      }
    }, err => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        stop();
        reject(err);
      }
    });
  });

  if (!user) {
    if (!publicAuth) location.replace('login.html');
    return null;
  }
  if (publicAuth) {
    location.replace('dashboard.html');
    return null;
  }

  // Fetch or create profile
  let profile = {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'Operator'),
    role: 'operator',
    defaultRegion: REGIONS[0]
  };

  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await Promise.race([
      getDoc(ref),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Profile fetch timeout')), 5000))
    ]);

    if (!snap.exists()) {
      await setDoc(ref, {
        name: profile.name,
        email: user.email || '',
        role: profile.role,
        defaultRegion: REGIONS[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const data = snap.data();
      profile = {
        ...data,
        uid: user.uid,
        role: normalizeRole(data.role),
        name: data.name || profile.name,
        email: data.email || user.email || ''
      };
    }
  } catch (e) {
    if (!fallbackEligible(e)) throw e;
    const cached = sessionProfile();
    if (cached?.uid === user.uid) profile = cached;
    activateFallback();
  }

  onAuthStateChanged(auth, u => {
    if (!u) location.replace('login.html');
  });

  saveProfile(profile);
  return profile;
}

export function renderProfile(user) {
  const name = user.name || (user.email ? user.email.split('@')[0] : 'Operator');
  const role = normalizeRole(user.role);
  const formattedRole = formatRoleName(role);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'OP';

  for (const id of ['profileName', 'operatorName']) {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
  }
  for (const id of ['profileRole', 'operatorRoleText']) {
    const el = document.getElementById(id);
    if (el) el.textContent = formattedRole;
  }
  for (const id of ['avatar', 'profileAvatar']) {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  }
  for (const [id, value] of Object.entries({ displayName: name, operatorRole: formattedRole, operatorEmail: user.email || '' })) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
}

export function bindLogout() {
  document.addEventListener('click', async e => {
    if (!e.target.closest('#logoutBtn')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try {
      if (auth) await signOut(auth);
      sessionStorage.removeItem('gridguard-demo-profile');
      sessionStorage.removeItem('gridguard-fallback');
      sessionStorage.removeItem('gridguard-user');
      sessionStorage.removeItem('gridguard-registered-user');
      location.replace('login.html');
    } catch (err) {
      message(errorText(err), true);
    }
  }, true);
}

export async function mountAuth() {
  const form = document.querySelector('form');
  const error = document.getElementById('error');
  const card = document.querySelector('.card');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showFeedback = (text, isErr = true) => {
    if (!error) return;
    error.textContent = text;
    error.style.display = 'block';
    error.style.color = isErr ? 'var(--danger, #ef4444)' : 'var(--accent, #10b981)';
    error.style.borderColor = isErr ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';
  };

  // Restore card entrance slide animation respecting reduced motion
  if (!prefersReducedMotion && card) {
    const isRegister = form && form.id === 'registerForm';
    card.style.opacity = '0';
    card.style.transform = isRegister ? 'translateX(24px)' : 'translateX(-24px)';
    card.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';
    requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateX(0)';
    });
  }

  // Restore smooth navigation between Login and Register
  const registerLink = document.getElementById('registerLink') || document.querySelector('a[href*="register.html"]');
  if (registerLink) {
    registerLink.addEventListener('click', e => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      if (!prefersReducedMotion && card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-24px)';
        setTimeout(() => location.assign('register.html'), 280);
      } else {
        location.assign('register.html');
      }
    });
  }

  const loginLink = document.getElementById('loginLink') || document.querySelector('a[href*="login.html"]');
  if (loginLink) {
    loginLink.addEventListener('click', e => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      if (!prefersReducedMotion && card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(24px)';
        setTimeout(() => location.assign('login.html'), 280);
      } else {
        location.assign('login.html');
      }
    });
  }

  // Password visibility toggle
  document.getElementById('togglePassword')?.addEventListener('click', () => {
    const p = document.getElementById('password');
    if (p) p.type = p.type === 'password' ? 'text' : 'password';
  });

  // Forgot password
  const forgot = [...document.querySelectorAll('a')].find(a => /forgot/i.test(a.textContent));
  forgot?.addEventListener('click', async e => {
    e.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    if (!email) {
      showFeedback('Please enter your email address in the field above first.', true);
      document.getElementById('email')?.focus();
      return;
    }
    try {
      if (!configured) throw new Error('Configure Firebase first.');
      await sendPasswordResetEmail(auth, email);
      showFeedback('If an account exists for this email, a password reset link has been sent.', false);
    } catch (err) {
      showFeedback(errorText(err), true);
    }
  });

  // Check if already authenticated
  try {
    await requireUser(true);
  } catch (e) {
    showFeedback(errorText(e), true);
  }

  if (!form) return;
  let busy = false;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      if (!configured) throw new Error('Configure Firebase using FIREBASE_SETUP.md.');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const register = form.id === 'registerForm';

      const privacyBox = document.getElementById(register ? 'privacyRegister' : 'privacyLogin');
      if (privacyBox && !privacyBox.checked) {
        throw new Error('Please accept the privacy policy to continue.');
      }

      if (register) {
        if (password !== document.getElementById('confirmPassword').value) {
          throw new Error('Passwords do not match.');
        }
        const name = document.getElementById('name').value.trim();
        if (!name) throw new Error('Enter your name.');
        const rawRole = document.getElementById('role')?.value || 'operator';
        const role = normalizeRole(rawRole);

        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role,
          defaultRegion: REGIONS[0],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Activate Slow Power Transition animation
      const transitionScreen = document.getElementById('transitionScreen');
      const subtitle = document.getElementById('transitionSubtitle');
      const status = document.getElementById('transitionStatus');
      if (transitionScreen) {
        if (subtitle) subtitle.textContent = register ? 'Provisioning operator profile...' : 'Authenticating operator session...';
        if (status) status.textContent = 'Secure connection established';
        transitionScreen.classList.add('active');
        await new Promise(r => setTimeout(r, prefersReducedMotion ? 100 : 750));
      }

      location.assign('dashboard.html');
    } catch (err) {
      if (fallbackEligible(err)) { startDemo(); location.assign('dashboard.html'); }
      else showFeedback(errorText(err), true);
    } finally {
      busy = false;
      if (btn) btn.disabled = false;
    }
  });
}
