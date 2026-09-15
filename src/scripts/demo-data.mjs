import { scoreRisk } from '../js/risk-engine.js';
import { weatherScore } from '../js/weather.js';
export function generateDemo(now=new Date('2026-09-14T12:00:00Z')){
 const output={regions:[],assets:[],sensorReadings:[],predictions:[],maintenanceOrders:[],crews:[],incidents:[],weatherSnapshots:[]};
 const names=['Ahmedabad East','Ahmedabad West','Gandhinagar','Vadodara'],coords=[[23.03,72.65],[23.04,72.53],[23.22,72.65],[22.3,73.19]],areas=[['Naroda','Odhav','Nikol','Bapunagar'],['Bodakdev','Satellite','Vastrapur','Thaltej'],['Sector 7','Sector 12','Kudasan','Sargasan'],['Alkapuri','Manjalpur','Akota','Karelibaug']];
 const ago=h=>new Date(+now-h*3600000),later=h=>new Date(+now+h*3600000);
 names.forEach((region,r)=>{
  const [latitude,longitude]=coords[r];output.regions.push({id:region,name:region,state:'Gujarat',country:'India',weatherLocation:{latitude,longitude}});
  const weather={id:region,region,timestamp:now,temperature:32+r,humidity:85-r*4,rainfall:16-r*3,windSpeed:36-r*3,condition:r<2?'Rain':'Cloudy',source:'simulated',dataSource:'simulated'};weather.weatherRiskScore=weatherScore(weather);output.weatherSnapshots.push(weather);
  for(let j=0;j<12;j++){
   const type=['Transformer','Substation','Circuit Breaker'][j%3],assetId=r===0&&j===0?'TR-104':`${['TR','SS','CB'][j%3]}-${200+r*100+j}`,stress=j<3?.94:j<7?.60:.12+(j%3)*.04;
   let latest;
   for(let t=0;t<25;t++){
    const s=stress*(.70+.30*t/24),daily=Math.sin(t*Math.PI/12),load=57+58*s+daily*2;
    latest={id:`${assetId}-${t}`,assetId,region,timestamp:ago((24-t)*3),temperature:+(40+58*s+daily).toFixed(1),oilTemperature:type==='Transformer'?+(48+65*s+daily).toFixed(1):null,vibration:+(.9+7.6*s).toFixed(2),partialDischarge:Math.round(8+520*s*s),oilQuality:type==='Transformer'?Math.round(94-67*s):null,loadPercentage:+load.toFixed(1),humidity:weather.humidity,voltage:Math.round((type==='Substation'?66000:11000)*(1-.035*s)),current:Math.round(load*3.4),anomalyScore:Math.round(s*100),dataSource:'simulated'};output.sensorReadings.push(latest);
   }
   const incidents=j<3?3:j<7?1:0;
   const risk=scoreRisk(latest,incidents,weather.weatherRiskScore,type);
   output.assets.push({id:assetId,assetId,name:`${areas[r][j%4]} ${type} ${j+1}`,type,region,area:areas[r][j%4],latitude:latitude+(j%4-1.5)*.013,longitude:longitude+(Math.floor(j/4)-1)*.018,healthScore:Math.round(100-risk.riskScore*.65),riskScore:risk.riskScore,failureProbability:risk.failureProbability,riskLevel:risk.riskLevel,gridImpact:risk.gridImpact,status:'Operational',installationYear:2003+j,manufacturer:['BHEL','ABB','Siemens'][j%3],lastMaintenance:ago(24*(20+j)),nextInspection:later(risk.predictionWindowHours),telemetryOnline:true,createdAt:now,updatedAt:now,dataSource:'simulated'});
   output.predictions.push({id:assetId,assetId,region,...risk,generatedAt:now});
   for(let k=0;k<incidents;k++)output.incidents.push({id:`INC-${assetId}-${k}`,incidentId:`INC-${assetId}-${k}`,assetId,region,severity:risk.riskLevel,type:'Equipment alert',title:`${k===0?'Thermal inspection alert':'Historical equipment alert'}`,description:'SIMULATED: elevated thermal and insulation signals require operator review.',status:k===0?'Open':'Resolved',startedAt:ago(24*(k+1)),resolvedAt:k===0?null:ago(24*k),affectedLoadMW:+(1.5+j*.2).toFixed(1),customersAffected:800+j*100,weatherRelated:r<2,createdAt:ago(24*(k+1)),dataSource:'simulated'});
   if(j<2)output.maintenanceOrders.push({id:`WO-${assetId}`,orderId:`WO-${assetId}`,assetId,region,priority:risk.riskLevel,status:'Pending',summary:risk.recommendedAction,assignedCrewId:null,dueAt:later(risk.predictionWindowHours),failureRisk:risk.failureProbability,gridImpact:risk.gridImpact,checklist:[{title:'Safety isolation',description:'Follow approved utility isolation procedures.'},{title:'Inspection',description:'Review thermal condition, insulation and load.'}],aiReason:risk.predictedFailureMode,createdAt:now,updatedAt:now,dataSource:'simulated'});
  }
  for(let k=0;k<4;k++)output.crews.push({id:`CREW-${r}-${k}`,crewId:`CREW-${r}-${k}`,name:`Crew ${['Alpha','Bravo','Charlie','Delta'][k]} ${r+1}`,region,status:k===3?'Unavailable':'Ready',currentArea:areas[r][k],skills:['Transformer','Substation','Circuit Breaker'],members:[{name:'Demo Lead',role:'Team Lead'},{name:'Demo Technician',role:'Technician'},{name:'Demo Engineer',role:'Engineer'}],assignedOrderId:null,latitude:latitude+k*.006,longitude:longitude+k*.006,availability:k!==3,lastUpdated:now,dataSource:'simulated'});
 });return output;
}
