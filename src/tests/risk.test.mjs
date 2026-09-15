import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemo} from '../scripts/demo-data.mjs';
import {scoreRisk} from '../js/risk-engine.js';
import {buildView,preposition} from '../js/view-model.js';
import {fetchWeather} from '../js/weather.js';
const data=generateDemo();
function regionState(region='Ahmedabad East'){return {...Object.fromEntries(Object.entries(data).filter(([k])=>k!=='regions').map(([k,v])=>[k,v.filter(r=>r.region===region)])),region:data.regions.find(r=>r.name===region)};}
test('48 assets with correlated 72-hour history and three risk levels',()=>{assert.equal(data.assets.length,48);assert.equal(data.sensorReadings.length,1200);assert.deepEqual(new Set(data.assets.map(a=>a.riskLevel)),new Set(['Critical','Elevated','Stable']));for(const a of data.assets){const rows=data.sensorReadings.filter(r=>r.assetId===a.assetId);assert.equal(rows.length,25);assert(rows.at(-1).temperature>=rows[0].temperature);assert.equal(a.riskScore,data.predictions.find(p=>p.assetId===a.assetId).riskScore);}});
test('all page projections preserve canonical asset risk',()=>{const s=regionState();for(const page of ['dashboard','assets','risk-map','predictions','maintenance','crews','incidents']){const v=buildView(s,page);for(const a of v.assets){const p=s.predictions.find(p=>p.assetId===a.id);assert.equal(a.score,p.riskScore);assert.equal(a.probability,p.failureProbability);}assert.equal(v.total,12);}});
test('every page supports entirely empty data',()=>{const s={...Object.fromEntries(Object.keys(data).filter(k=>k!=='regions').map(k=>[k,[]])),region:{name:'Vadodara'}};for(const p of ['dashboard','assets','risk-map','predictions','maintenance','crews','incidents'])assert.equal(buildView(s,p).total,0);});
test('risk engine deterministic, bounded, excludes inapplicable oil features',()=>{const r=data.sensorReadings[24];assert.deepEqual(scoreRisk(r,3,70),scoreRisk(r,3,70));const p=scoreRisk({...r,temperature:500,oilTemperature:999,vibration:300},100,500);assert(p.riskScore<=100);assert(!scoreRisk(r,3,70,'Circuit Breaker').evidence.some(e=>e.feature==='oilTemperature'));});
test('weather failure falls back without throwing',async()=>{const fallback=data.weatherSnapshots[0];const result=await fetchWeather(data.regions[0],fallback,{provider:'open-meteo',fetcher:async()=>{throw Error('offline');}});assert.equal(result.source,'simulated');assert.equal(result.temperature,fallback.temperature);});
test('preposition excludes busy and unavailable crews',()=>{const s=regionState();s.crews=s.crews.map(c=>({...c,status:'Assigned',availability:false,assignedOrderId:'busy'}));assert(preposition(s).every(r=>!r.crewId));});
