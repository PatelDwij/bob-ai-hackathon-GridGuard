// No account registration, screenshots, traces, or credential logging.
import {chromium,webkit,expect} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
import {loadTestCredentials} from './live-credentials.mjs';
const base=process.env.GRIDGUARD_LIVE_URL || 'http://127.0.0.1:5173';
let credentials;
try { credentials=loadTestCredentials(); } catch(error) { console.log(`LIVE BLOCKED: ${error.code}`); process.exit(2); }
const manifest={projectId:'gridguard-ai-32b1b',purpose:'automated-test',documents:[],users:[]};
mkdirSync('test-results',{recursive:true});
function track(...paths) { manifest.documents.push(...paths); writeFileSync('test-results/live-cleanup-manifest.json',JSON.stringify(manifest,null,2)); }
let storage;
const first=await chromium.launch({headless:true});
try {
 const page=await first.newPage();
 await page.goto(`${base}/index.html`);
 const result=await page.evaluate(async credentials=>{
   const config=await import('/js/firebase-config.js');
   const {isFallback}=await import('/js/demo-session.js');
   if(isFallback()||config.emulator||config.app.options.projectId!=='gridguard-ai-32b1b')return {code:'test/not-live-project'};
   const auth=await import('/tests/live-client.js');
   const fs=await import('/tests/live-client.js');
   try {
     await auth.setPersistence(config.auth,auth.browserLocalPersistence);
     const {user}=await auth.signInWithEmailAndPassword(config.auth,credentials.email,credentials.password);
     const ref=fs.doc(config.db,'users',user.uid);
     const profile=await fs.getDocFromServer(ref);
     if(!profile.exists())return {code:'test/profile-missing'};
     const role=profile.data().role;
     if(role!=='admin')return {code:'test/admin-role-required',role};
     await fs.updateDoc(ref,{name:profile.data().name,updatedAt:fs.serverTimestamp()});
     return {code:'ok',role};
   } catch(error) {return {code:error.code||'test/unknown-firebase-error'};}
 },credentials);
 credentials=null;
 if(result.code!=='ok') { console.log(`LIVE STOPPED: ${result.code}${result.role ? ` (role=${result.role})` : ''}`); process.exitCode=2; }
 else { console.log('LIVE PROBE PASS: existing admin authenticated; profile read and same-value name write acknowledged.'); storage=await page.context().storageState({indexedDB:true}); }
} catch { console.log('LIVE STOPPED: test/browser-or-network-error');process.exitCode=2; }
finally { await first.close(); }
if(!storage) process.exit(process.exitCode||2);
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]) {
 const browser=await engine.launch({headless:true});
 try {
  const context=await browser.newContext({storageState:storage});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.name));
  const id=`TR-TEST-FINAL-${name}-${Date.now()}`,crew=`CR-TEST-FINAL-${name}-${Date.now()}`,order=`WO-${id}`;
  async function ready(path) {
    await page.goto(`${base}/${path}.html`);
    await expect(page.locator('main')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');
    await expect(page.locator('#demoFallbackBadge')).toHaveCount(0);
  }
  async function read(collection,id) {
    return page.evaluate(async({collection,id})=>{const {db}=await import('/js/firebase-config.js');const fs=await import('/tests/live-client.js');const snap=await fs.getDocFromServer(fs.doc(db,collection,id));return snap.data();},{collection,id});
  }
  await ready('assets');
  track(`assets/${id}`,`predictions/${id}`,`sensorReadings/${id}-init`);
  await page.locator('#addAssetBtn').click();await page.locator('[name=assetId]').fill(id);await page.locator('[name=area]').fill('Explicit automated test');await page.locator('#ggModalSubmit').click();
  await expect(page.locator('#ggModal')).toHaveCount(0);await page.reload();await expect(page.locator('#assetTableBody')).toContainText(id);
  await ready('crews');
  track(`crews/${crew}`);
  await page.locator('#addCrewBtn').click();await page.locator('[name=crewId]').fill(crew);await page.locator('[name=name]').fill('Automated final crew');await page.locator('#ggModalSubmit').click();await expect(page.locator('#ggModal')).toHaveCount(0);
  await ready('maintenance');
  track(`maintenanceOrders/${order}`);
  await page.locator('#maintenanceActionsPanel select').first().selectOption(id);await page.getByRole('button',{name:'Create Work Order',exact:true}).click();
  await expect.poll(async()=> (await read('maintenanceOrders',order))?.status).toBe('Pending');
  await ready('crews');await page.locator('#fieldOperationsPanel select').nth(0).selectOption(order);await page.locator('#fieldOperationsPanel select').nth(1).selectOption(crew);await page.getByRole('button',{name:'Assign Crew',exact:true}).click();
  await expect.poll(async()=> (await read('maintenanceOrders',order))?.status).toBe('Assigned');expect((await read('crews',crew)).status).toBe('Assigned');await page.reload();
  await ready('maintenance');await page.locator('#maintenanceActionsPanel select').nth(2).selectOption(order);await page.getByRole('button',{name:'Start Work',exact:true}).click();await expect.poll(async()=> (await read('maintenanceOrders',order))?.status).toBe('In Progress');await page.reload();
  await page.locator('#maintenanceActionsPanel select').nth(2).selectOption(order);await page.getByRole('button',{name:'Complete Work',exact:true}).click();await expect.poll(async()=> (await read('maintenanceOrders',order))?.status).toBe('Completed');await page.reload();expect((await read('crews',crew)).status).toBe('Ready');
  await ready('incidents');await page.locator('#reportIncidentBtn').click();await page.locator('#reportAsset').selectOption(id);await page.locator('#reportTitle').fill(id);await page.locator('#reportSubmitBtn').click();await expect(page.locator('#reportSubmitBtn')).toHaveCount(0);
  const incidentId=await page.evaluate(async assetId=>{const {db}=await import('/js/firebase-config.js');const fs=await import('/tests/live-client.js');const snap=await fs.getDocsFromServer(fs.query(fs.collection(db,'incidents'),fs.where('assetId','==',assetId)));return snap.docs[0].id;},id);track(`incidents/${incidentId}`);
  expect((await read('incidents',incidentId)).status).toBe('Open');await page.locator('#incidentList .incident-card').filter({hasText:id}).click();await page.getByRole('button',{name:'Monitor Incident'}).click();await expect.poll(async()=> (await read('incidents',incidentId))?.status).toBe('Monitoring');await page.reload();await page.locator('#incidentList .incident-card').filter({hasText:id}).click();await page.getByRole('button',{name:'Resolve Incident'}).click();await expect.poll(async()=> (await read('incidents',incidentId))?.status).toBe('Resolved');await page.reload();
  await expect(page.locator('#demoFallbackBadge')).toHaveCount(0);expect(errors).toEqual([]);
  console.log(`${name} LIVE PASS: admin asset, assignment, start, completion, crew release, incidents and refresh persistence.`);
 } catch(error) { console.log(`${name} LIVE FAIL: ${error.code||error.name||'test/assertion-failed'}; see exact test record manifest.`);process.exitCode=1;break; }
 finally {await browser.close();}
}
console.log('LIVE LIMITATION: admin workflow does not prove separate-role sessions. Exact created records are in test-results/live-cleanup-manifest.json; cleanup requires delete authorization.');
