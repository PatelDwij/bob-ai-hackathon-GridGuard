import {test,expect} from '@playwright/test';
test('retained renderers: all regions, empty data, filters and viewport sizes',async({page})=>{
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 await page.route('**/js/app.js*',route=>route.fulfill({contentType:'application/javascript',body:`
 import {mountOperations} from '/js/operations.js';import {generateDemo} from '/scripts/demo-data.mjs';import {buildView} from '/js/view-model.js';
 const page=location.pathname.split('/').pop().replace('.html','');
 if(['dashboard','risk-map'].includes(page))await import('/js/maps.js');
 const data=generateDemo();const views={},states={};for(const region of data.regions){const state={region,...Object.fromEntries(Object.entries(data).filter(([k])=>k!=='regions').map(([k,v])=>[k,v.filter(r=>r.region===region.name)]))};if(location.search.includes('empty'))for(const k of Object.keys(state))if(Array.isArray(state[k]))state[k]=[];states[region.name]=state;views[region.name]=buildView(state,page);}
 const {mount}=await import('/js/pages/'+page+'.js');const user={name:'Test Operator',role:'operator',email:'test@example.com'};const view=mount(views,user);window.view=view;const controls=mountOperations(page,()=>states[document.getElementById('regionSelect').value]);controls?.();document.getElementById('regionSelect').addEventListener('change',e=>view.refresh?.(e.target.value,views[e.target.value]),true);document.body.dataset.ready='true';
 `}));
 for(const name of ['dashboard','assets','risk-map','predictions','maintenance','crews','incidents','settings']){
 await page.goto(`/${name}.html`);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 for(const region of ['Vadodara','Gandhinagar','Ahmedabad West','Ahmedabad East'])await page.locator('#regionSelect').selectOption(region);
 for(const width of [1440,1280,1024,768,430,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflows ${width}`).toBeTruthy();}
 await page.goto(`/${name}.html?empty`);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 }
 expect(errors).toEqual([]);
});
