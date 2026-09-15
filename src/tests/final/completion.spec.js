import {test,expect} from '@playwright/test';
const pages=['dashboard','assets','risk-map','predictions','maintenance','crews','incidents','settings'];
async function visit(page,name) {
  await page.goto(`/${name}.html`);
  await expect(page.locator('#demoFallbackBadge')).toHaveText('Demo Fallback · Simulated Data');
  await expect(page.locator('main')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('#connectionStatus')).toContainText(name==='settings'?'Account settings':'Demo Fallback');
}
async function role(page,value) {
  await visit(page,'settings');
  await page.locator('#operatorRole').selectOption(value);
  await page.locator('#saveBtn').click();
  await expect(page.locator('#connectionStatus')).toContainText('Settings saved');
}
async function record(page,collection,id) {
  return page.evaluate(({collection,id})=>JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1'))?.[collection]?.[id],{collection,id});
}
async function status(page,collection,id,value) {
  await expect.poll(async()=> (await record(page,collection,id))?.status).toBe(value);
}
test('complete persisted role workflows',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // All actions run through the application, with no remote account creation.
  await visit(page,'dashboard');
  await role(page,'admin');
  await visit(page,'assets');
  await page.locator('#addAssetBtn').click();
  await page.locator('[name=assetId]').fill('TR-TEST-FINAL');
  await page.locator('[name=area]').fill('Automated validation');
  await page.locator('#ggModalSubmit').click();
  await expect(page.locator('#ggModal')).toHaveCount(0);
  await expect.poll(async()=> !!await record(page,'assets','TR-TEST-FINAL')).toBe(true);
  await page.reload();
  await expect(page.locator('#assetTableBody')).toContainText('TR-TEST-FINAL');

  // Telemetry updates shared risk using the real application service.
  const risk=await page.evaluate(async()=>{
    const api=await import('/js/firestore.js');
    return api.addTelemetry({assetId:'TR-TEST-FINAL',temperature:98,oilTemperature:112,vibration:9,partialDischarge:590,oilQuality:22,loadPercentage:118});
  });
  expect(risk.risk.riskScore).toBeGreaterThan(70);
  await role(page,'operator');
  await visit(page,'maintenance');
  await page.locator('#maintenanceActionsPanel select').first().selectOption('TR-TEST-FINAL');
  await page.getByRole('button',{name:'Create Work Order',exact:true}).click();
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','Pending');

  await role(page,'field_supervisor');
  await visit(page,'crews');
  await expect(page.locator('#fieldOperationsPanel')).toBeVisible();
  await expect(page.locator('.crew-card')).toHaveCount(4);
  await expect(page.locator('.crew-card').first().locator('.crew-avatar')).toBeVisible();
  const panel=page.locator('#fieldOperationsPanel');
  await panel.locator('select').nth(0).selectOption('WO-TR-TEST-FINAL');
  await panel.locator('select').nth(1).selectOption('CREW-0-0');
  await page.screenshot({path:`test-results/${info.project.name}-crews.png`,fullPage:true});
  await panel.getByRole('button',{name:'Assign Crew',exact:true}).click();
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','Assigned');
  await status(page,'crews','CREW-0-0','Assigned');
  expect((await record(page,'crews','CREW-0-0')).availability).toBe(false);
  await page.reload();
  await expect(page.locator('.crew-card').first()).toContainText(/Busy|Assigned/);
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','Assigned');
  await expect(panel.locator('select').first().locator('option[value="WO-TR-TEST-FINAL"]')).toHaveCount(0);

  await role(page,'maintenance');
  await visit(page,'maintenance');
  await page.locator('#maintenanceActionsPanel select').selectOption('WO-TR-TEST-FINAL');
  await expect(page.getByRole('button',{name:'Create Work Order',exact:true})).toHaveCount(0);
  await page.screenshot({path:`test-results/${info.project.name}-maintenance.png`,fullPage:true});
  await page.getByRole('button',{name:'Start Work',exact:true}).click();
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','In Progress');
  await page.reload();
  await expect(page.getByRole('button',{name:'Complete Work',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Complete Work',exact:true}).click();
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','Completed');
  await status(page,'crews','CREW-0-0','Ready');
  await page.reload();
  await status(page,'maintenanceOrders','WO-TR-TEST-FINAL','Completed');
  expect((await record(page,'crews','CREW-0-0')).assignedOrderId).toBe(null);
  expect((await record(page,'crews','CREW-0-0')).availability).toBe(true);

  await role(page,'operator');
  await visit(page,'incidents');
  await page.locator('#reportIncidentBtn').click();
  await page.locator('#reportAsset').selectOption('TR-TEST-FINAL');
  await page.locator('#reportTitle').fill('Automated final incident');
  await page.locator('#reportDesc').fill('Explicit local automated test');
  await page.locator('#reportSubmitBtn').click();
  await expect(page.locator('#reportSubmitBtn')).toHaveCount(0);
  const id=await page.evaluate(()=>Object.values(JSON.parse(sessionStorage.getItem('gridguard-demo-state-v1')).incidents).find(i=>i.title==='Automated final incident').incidentId);
  await status(page,'incidents',id,'Open');
  await page.locator('#incidentList .incident-card').filter({hasText:'Automated final incident'}).click();
  await page.getByRole('button',{name:'Monitor Incident',exact:true}).click();
  await status(page,'incidents',id,'Monitoring');
  await page.reload();
  await page.locator('#incidentList .incident-card').filter({hasText:'Automated final incident'}).click();
  await page.getByRole('button',{name:'Resolve Incident',exact:true}).click();
  await status(page,'incidents',id,'Resolved');
  await page.reload();
  await status(page,'incidents',id,'Resolved');

  expect(errors).toEqual([]);
});

test('readonly panels',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await visit(page,'dashboard');
  await role(page,'field_supervisor');
  await visit(page,'crews');
  await page.screenshot({path:`validation-results/${info.project.name}-crews-final.png`,fullPage:true});
  await page.evaluate(async()=>{const api=await import('/js/firestore.js');await api.assignCrew('WO-SS-201','CREW-0-0');});
  await role(page,'maintenance');
  await visit(page,'maintenance');
  await expect(page.getByRole('button',{name:'Start Work',exact:true})).toBeEnabled();
  await page.screenshot({path:`validation-results/${info.project.name}-maintenance-final.png`,fullPage:true});
  await role(page,'reliability');
  for (const name of pages) {
    await visit(page,name);
    await expect(page.locator('#operationControls, #operationStatus, .operation-strip, #operationsStrip')).toHaveCount(0);
    await expect(page.locator('#addAssetBtn, #ingestTelemetryBtn, #addCrewBtn, #reportIncidentBtn, #fieldOperationsPanel, .injected-action')).toHaveCount(0);
    await expect(page.locator('#maintenanceActionsPanel button')).toHaveCount(0);
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:1000});
      await page.waitForTimeout(350);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflow at ${width}`).toBe(true);
    }
    await page.setViewportSize({width:1440,height:1000});
  }
  const denied=await page.evaluate(async()=>{
    const api=await import('/js/firestore.js');
    const results=[];
    for (const action of [()=>api.addAsset({assetId:'TR-DENIED',region:'Ahmedabad East'}),()=>api.createIncident('TR-104','Denied'),()=>api.assignCrew('WO-TR-104','CREW-0-1'),()=>api.addTelemetry({assetId:'TR-104'})]) {
      try {await action();results.push('ALLOWED');} catch(e) {results.push(e.code);}
    }
    return results;
  });
  expect(denied).toEqual(Array(4).fill('permission-denied'));

  expect(errors).toEqual([]);
});

test('map controls and region panning',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const name of ['dashboard','risk-map']) {
    await visit(page,name);
    const map=page.locator(name==='dashboard'?'#dashboardMap':'#map');
    await map.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    const zoom=await page.evaluate(()=>window.gridMap.getZoom());
    await map.focus();
    const wheelBox=await map.boundingBox();
    await page.mouse.move(wheelBox.x+wheelBox.width/2,wheelBox.y+wheelBox.height/2);
    await page.mouse.wheel(0,500);
    await page.waitForTimeout(350);
    expect(await page.evaluate(()=>window.gridMap.getZoom())).toBe(zoom);
    expect(await page.evaluate(()=>window.gridMap.scrollWheelZoom.enabled())).toBe(false);
    await map.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    await page.waitForTimeout(350);
    expect((await map.boundingBox()).height).toBeGreaterThan(300);
    await map.locator('.leaflet-control-zoom-in').click({timeout:6000});
    await expect.poll(()=>page.evaluate(()=>window.gridMap.getZoom())).toBe(zoom+1);
    await expect.poll(()=>page.evaluate(()=>!!window.gridMap._animatingZoom)).toBe(false);
    await map.locator('.leaflet-control-zoom-out').click();
    await expect.poll(()=>page.evaluate(()=>window.gridMap.getZoom())).toBe(zoom);
    await expect.poll(()=>page.evaluate(()=>!!window.gridMap._animatingZoom)).toBe(false);
    for (const region of ['Vadodara','Ahmedabad East']) {
      await page.locator('#regionSelect').selectOption(region);
      await expect(page.locator('#connectionStatus')).toContainText(region);
      await map.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1100);
      expect(await page.evaluate(()=>window.gridMap.dragging.enabled())).toBe(true);
      const before=await page.evaluate(()=>window.gridMap.getCenter().lng);
      const box=await map.boundingBox();
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
      await page.mouse.down();await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2+30,{steps:12});await page.mouse.up();
      await expect.poll(()=>page.evaluate(()=>window.gridMap.getCenter().lng)).not.toBe(before);
    }
  }
  expect(errors).toEqual([]);
});

test('automatic quota/network fallback and atomic assignment contention',async({page})=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync('js/demo-session.js','utf8').replace("import.meta.env?.VITE_FORCE_DEMO_DATA === 'true'",'false');
  await page.route('**/js/demo-session.js*',route=>route.fulfill({contentType:'application/javascript',body:source}));
  let attempted=0;
  await page.route('**/firestore.googleapis.com/**',route=>{attempted++;return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{code:429,status:'RESOURCE_EXHAUSTED',message:'Automated quota simulation'}})});});
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{
    const session=await import('/js/demo-session.js');
    session.saveProfile({uid:'local-test',name:'Test Supervisor',role:'field_supervisor',defaultRegion:'Ahmedabad East'});
    const client=await import('/js/data-client.js');
    const wasFallback=session.isFallback();
    const snap=await client.getDoc(client.doc(null,'assets','TR-104'));
    const api=await import('/js/firestore.js');
    const assigned=await Promise.allSettled([api.assignCrew('WO-TR-104','CREW-0-0'),api.assignCrew('WO-SS-201','CREW-0-0')]);
    return {wasFallback,nowFallback:session.isFallback(),exists:snap.exists(),assigned:assigned.map(r=>r.status),eligible:['resource-exhausted','unavailable','auth/network-request-failed','auth/too-many-requests','permission-denied','auth/invalid-credential'].map(code=>session.fallbackEligible({code}))};
  });
  expect(attempted).toBeGreaterThan(0);
  expect(result).toEqual({wasFallback:false,nowFallback:true,exists:true,assigned:['fulfilled','rejected'],eligible:[true,true,true,true,false,false]});
  await expect(page.locator('#demoFallbackBadge')).toHaveText('Demo Fallback · Simulated Data');
  await page.reload();
  await status(page,'crews','CREW-0-0','Assigned');
});
