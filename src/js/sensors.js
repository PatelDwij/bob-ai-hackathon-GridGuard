import { millis } from './utils.js';
export function sensorHistory(state,assetId){return state.sensorReadings.filter(r=>r.assetId===assetId).sort((a,b)=>millis(a.timestamp)-millis(b.timestamp));}
export function bindSensorTrend(getState){
 document.getElementById('assetTableBody')?.addEventListener('click',()=>requestAnimationFrame(()=>{
 const id=document.getElementById('drawerAssetId').textContent.trim(),rows=sensorHistory(getState(),id);let host=document.getElementById('sensorHistory');if(!host){host=document.createElement('div');host.id='sensorHistory';host.className='sensor-row';document.getElementById('sensorList').after(host);}host.replaceChildren();const label=document.createElement('p');label.textContent=rows.length?`Simulated temperature history · ${rows.length} readings · ${rows[0].temperature} → ${rows.at(-1).temperature}°C`:'No sensor history available';host.append(label);if(rows.length<2)return;
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=70;canvas.style.cssText='max-width:100%;height:70px';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label.textContent);host.append(canvas);const c=canvas.getContext('2d');c.strokeStyle='#5c8873';c.lineWidth=2;c.beginPath();const low=Math.min(...rows.map(r=>r.temperature))-2,high=Math.max(...rows.map(r=>r.temperature))+2;rows.forEach((r,i)=>{const x=5+i/(rows.length-1)*310,y=65-(r.temperature-low)/(high-low)*60;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();
 }));
}
