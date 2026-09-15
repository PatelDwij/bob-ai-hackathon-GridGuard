import * as firebase from 'firebase/firestore';
import { db } from './firebase-config.js';
import { generateDemo } from '../scripts/demo-data.mjs';
import { isFallback, activateFallback, fallbackEligible, sessionProfile, saveProfile } from './demo-session.js';

const key = 'gridguard-demo-state-v1';
let store;
function data() {
  if (!store) {
    const saved = sessionStorage.getItem(key);
    store = saved ? JSON.parse(saved) : Object.fromEntries(Object.entries(generateDemo(new Date())).map(([name, rows]) => [name, Object.fromEntries(rows.map(row => [row.id, row]))]));
  }
  return store;
}
const watchers = new Set();
function persist() { sessionStorage.setItem(key, JSON.stringify(data())); }
function publish() { for (const watch of watchers) watch(); }
export const collection = (_, name) => ({name});
export const doc = (parent, name, id) => id !== undefined ? {name, id, path:`${name}/${id}`} : {name:parent.name, id:name || crypto.randomUUID(), get path() { return `${this.name}/${this.id}`; }};
export const where = (field, operator, value) => ({field, operator, value});
export const query = (ref, filter) => ({...ref, filter});
export const serverTimestamp = () => isFallback() ? new Date().toISOString() : firebase.serverTimestamp();
const nativeRef = ref => firebase.doc(db, ref.name, ref.id);
const snapshot = (ref, source = data()) => ({id:ref.id, exists:() => !!source[ref.name]?.[ref.id], data:() => structuredClone(source[ref.name]?.[ref.id])});
function cache(ref, snap) {
  if (!data()[ref.name]) data()[ref.name] = {};
  if (snap.exists()) data()[ref.name][ref.id] = snap.data();
  persist();
}
window.addEventListener('gridguard-fallback', () => {
  if (db) firebase.disableNetwork(db).catch(() => {});
  publish();
});
async function primary(live, local) {
  if (isFallback()) return local();
  let timer;
  try {
    return await Promise.race([live(), new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Firebase unavailable: timeout'), {code:'unavailable'})), 8000); })]);
  } catch (error) {
    // Authentication and permission errors must never turn into simulated success.
    if (!fallbackEligible(error)) throw error;
    activateFallback();
    return local();
  } finally { clearTimeout(timer); }
}
function allowed(ref, patch, source) {
  const user = sessionProfile(), role = user?.role, old = source[ref.name]?.[ref.id];
  let ok = false;
  if (ref.name === 'users') ok = user?.uid === ref.id && !('role' in patch);
  else if (role === 'admin') ok = true;
  else if (role === 'operator') ok = ['predictions','sensorReadings','incidents'].includes(ref.name) || ref.name === 'assets' && !!old || ref.name === 'maintenanceOrders' && !old;
  else if (role === 'field_supervisor') ok = ['maintenanceOrders','crews'].includes(ref.name) && patch.status === 'Assigned';
  else if (role === 'maintenance') ok = ref.name === 'maintenanceOrders' && ['In Progress','Completed'].includes(patch.status) || ref.name === 'crews' && ['Ready','Deployed','Unavailable'].includes(patch.status);
  if (!ok) throw Object.assign(new Error('This role cannot perform this operation.'), {code:'permission-denied'});
}
function normalize(value) {
  return JSON.parse(JSON.stringify(value, (_, v) => v?._methodName === 'serverTimestamp' ? new Date().toISOString() : v));
}
function localWrite(ref, patch, merge, target = data()) {
  allowed(ref, patch, target);
  target[ref.name] ||= {};
  if (merge && !target[ref.name][ref.id] && ref.name !== 'users') throw new Error('Record not found.');
  target[ref.name][ref.id] = {...(merge ? target[ref.name][ref.id] : {}), ...normalize(patch)};
  if (ref.name === 'users') saveProfile({...sessionProfile(), ...patch});
}
export const getDoc = ref => primary(async () => { const snap = await firebase.getDocFromServer(nativeRef(ref)); cache(ref, snap); return snap; }, () => snapshot(ref));
export const setDoc = (ref, value) => primary(() => firebase.setDoc(nativeRef(ref), value), () => { localWrite(ref, value, false); persist(); publish(); });
export const updateDoc = (ref, value) => primary(() => firebase.updateDoc(nativeRef(ref), value), () => { localWrite(ref, value, true); persist(); publish(); });
let transactionQueue = Promise.resolve();
export function runTransaction(_, callback) {
  return primary(() => firebase.runTransaction(db, tx => callback({get:ref => tx.get(nativeRef(ref)), set:(ref,v) => tx.set(nativeRef(ref),v), update:(ref,v) => tx.update(nativeRef(ref),v)}), {maxAttempts:1}), () => {
    const task = transactionQueue.then(async () => {
      const draft = structuredClone(data());
      const result = await callback({get:async ref => snapshot(ref,draft),set:(ref,v) => localWrite(ref,v,false,draft),update:(ref,v) => localWrite(ref,v,true,draft)});
      store = draft; persist(); publish(); return result;
    });
    transactionQueue = task.catch(() => {});
    return task;
  });
}
export function onSnapshot(ref, next, error) {
  let stop, timer, closed = false;
  const emit = () => {
    if (closed || !isFallback()) return;
    clearTimeout(timer); stop?.(); stop = null;
    if (ref.id) next(snapshot(ref));
    else next({docs:Object.entries(data()[ref.name] || {}).filter(([,row]) => !ref.filter || row[ref.filter.field] === ref.filter.value).map(([id]) => snapshot({name:ref.name,id}))});
  };
  watchers.add(emit);
  if (isFallback()) queueMicrotask(emit);
  else {
    timer = setTimeout(() => activateFallback(), 8000);
    const live = ref.id ? nativeRef(ref) : firebase.query(firebase.collection(db,ref.name), firebase.where(ref.filter.field,ref.filter.operator,ref.filter.value));
    stop = firebase.onSnapshot(live, snap => {
      if (closed || isFallback()) return;
      if (snap.metadata.fromCache) return;
      clearTimeout(timer);
      if (ref.id) cache(ref,snap);
      else {
        data()[ref.name] ||= {};
        for (const [id,row] of Object.entries(data()[ref.name])) if (row[ref.filter.field] === ref.filter.value) delete data()[ref.name][id];
        for (const d of snap.docs) data()[ref.name][d.id] = d.data();
        persist();
      }
      next(snap);
    }, err => { clearTimeout(timer); if (fallbackEligible(err)) activateFallback(); else error?.(err); });
  }
  return () => {closed = true; clearTimeout(timer); stop?.(); watchers.delete(emit);};
}
