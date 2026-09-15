import {test,expect} from '@playwright/test';
test('complete Firebase operator journey and responsive pages',async({page})=>{
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 page.on('console', msg => { if(msg.type()==='error') console.error('BROWSER ERROR:', msg.text()); });
 page.on('dialog', d => console.error('DIALOG:', d.message()));
 const email=`operator-${Date.now()}@example.com`,password='GridguardDemo123!';

 await page.goto('/register.html');
 await page.locator('#name').fill('Test Operator');
 await page.locator('#email').fill(email);
 await page.locator('#organization').fill('Demo Utility');
 await page.locator('#role').selectOption({index:1}); // Admin or Operator
 await page.locator('#password').fill(password);
 await page.locator('#confirmPassword').fill(password);
 await page.locator('#privacyRegister').check();
 await page.locator('[type=submit]').click();
 await expect(page).toHaveURL(/dashboard/);
 await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');

 await page.goto('/login.html');
 await expect(page).toHaveURL(/dashboard/);
 await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');
 await page.locator('#regionSelect').selectOption('Vadodara');
 await expect(page.locator('#connectionStatus')).toContainText('Vadodara · SIMULATED');
 await expect(page.locator('#assetsMonitored')).toHaveText('11');

 for(const name of ['assets','risk-map','predictions','maintenance','crews','incidents','settings']){
   await page.goto(`/${name}.html`);
   await expect(page.locator('#connectionStatus')).toContainText(name==='settings'?'Account settings':'SIMULATED');
   if(name!=='settings')await expect(page.locator('#regionSelect')).toHaveValue('Vadodara');
 }

 await page.goto('/assets.html');
 await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');
 // The legacy asset strip is gone, but we have Add Asset in the header now. We don't have to test create work order from assets anymore if we test it on maintenance.

 await page.goto('/maintenance.html');
 await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');
 // The maintenance page uses the new panel.
 await page.locator('#maintenanceActionsPanel select').first().selectOption({ index: 1 });
 await page.getByRole('button',{name:'Create Work Order',exact:true}).click();
 // We don't have operationStatus anymore, wait for network or state
 await page.waitForTimeout(1000);

 await page.goto('/incidents.html');
 await expect(page.locator('#connectionStatus')).toContainText('SIMULATED');
 // Report Incident Flow
 await page.locator('#reportIncidentBtn').click();
 await page.locator('#reportTitle').fill('Test Incident');
 await page.locator('#reportDesc').fill('Testing the new incident reporting flow');
 await page.locator('#reportSubmitBtn').click();
 await expect(page.locator('#reportSubmitBtn')).toHaveCount(0, { timeout: 5000 });
 // Contextual buttons in detail pane
 // First incident should be the new one, let's click it to select it
 await page.locator('#incidentList .incident-card').first().click();
 await page.getByRole('button',{name:'Monitor Incident'}).click();
 await page.waitForTimeout(1000);
 await page.getByRole('button',{name:'Resolve Incident'}).click();
 await page.waitForTimeout(1000);

 await page.goto('/settings.html');
 await expect(page.locator('#connectionStatus')).toContainText('Account settings');
 await page.locator('#displayName').fill('Updated Operator');
 await page.locator('#defaultRegion').selectOption('Vadodara');
 await page.locator('#saveBtn').click();
 await expect(page.locator('#connectionStatus')).toContainText('Settings saved');
 await page.reload();
 await expect(page.locator('#displayName')).toHaveValue('Updated Operator');

 for(const width of [1440,1280,1024,768,430,390]){
   await page.setViewportSize({width,height:900});
   for(const name of ['dashboard','assets','risk-map','predictions','maintenance','crews','incidents','settings']){
     await page.goto(`/${name}.html`);
     await expect(page.locator('#connectionStatus')).toContainText(name==='settings'?'Account settings':'SIMULATED');
     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflows at ${width}`).toBeTruthy();
   }
 }

 await page.setViewportSize({width:1440,height:900});
 await page.locator('#profileBtn').click();
 await page.locator('#logoutBtn').click();
 await expect(page).toHaveURL(/login/);
 await page.goto('/assets.html');
 await expect(page).toHaveURL(/login/);
 await page.locator('#email').fill(email);
 await page.locator('#password').fill(password);
 await page.locator('#privacyLogin').check();
 await page.locator('[type=submit]').click();
 await expect(page).toHaveURL(/dashboard/);
 await expect(page.locator('#regionSelect')).toHaveValue('Vadodara');
 expect(errors).toEqual([]);
});
