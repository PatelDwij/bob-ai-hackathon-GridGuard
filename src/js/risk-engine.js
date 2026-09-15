import { clamp } from './utils.js';
export const WEIGHTS={temperature:.12,oilTemperature:.18,vibration:.15,partialDischarge:.15,oilQuality:.12,loadPercentage:.12,historicalIncidents:.08,weatherExposure:.08};
export const normalize=(x,low,high)=>clamp((Number(x)-low)/(high-low)*100);
export function scoreRisk(reading={},incidentCount=0,weatherRiskScore=0,type='Transformer'){
 const oil=type==='Transformer';
 const features={temperature:normalize(reading.temperature,45,95),oilTemperature:oil?normalize(reading.oilTemperature,55,110):null,vibration:normalize(reading.vibration,1,8),partialDischarge:normalize(reading.partialDischarge,10,500),oilQuality:oil?normalize(100-reading.oilQuality,10,70):null,loadPercentage:normalize(reading.loadPercentage,60,120),historicalIncidents:normalize(incidentCount,0,4),weatherExposure:clamp(weatherRiskScore)};
 const valid=Object.entries(features).filter(([k,v])=>v!==null&&(k==='historicalIncidents'||k==='weatherExposure'||(reading[k]!==null&&reading[k]!==undefined))&&Number.isFinite(Number(k==='historicalIncidents'?incidentCount:k==='weatherExposure'?weatherRiskScore:reading[k])));
 const weight=valid.reduce((s,[k])=>s+WEIGHTS[k],0);
 const riskScore=weight?Math.round(valid.reduce((s,[k,v])=>s+v*WEIGHTS[k],0)/weight):0;
 const riskLevel=riskScore>=75?'Critical':riskScore>=45?'Elevated':'Stable';
 const predictionWindowHours=riskLevel==='Critical'?12:riskLevel==='Elevated'?24:72;
 const top=[...valid].sort((a,b)=>b[1]*WEIGHTS[b[0]]-a[1]*WEIGHTS[a[0]]);
 const predictedFailureMode=riskLevel==='Stable'?'No immediate failure indicator':top[0]?.[0]==='partialDischarge'?'Insulation degradation':top[0]?.[0]==='vibration'?'Mechanical degradation':'Thermal / loading stress';
 return {riskScore,failureProbability:Math.round(clamp(riskScore*.85)),riskLevel,predictionWindowHours,confidence:Math.round(valid.length/(oil?8:6)*100),predictedFailureMode,gridImpact:riskLevel==='Critical'?'High':riskLevel==='Elevated'?'Medium':'Low',evidence:top.map(([feature,value])=>({feature,normalizedScore:Math.round(value),weight:WEIGHTS[feature],value:feature==='historicalIncidents'?incidentCount:feature==='weatherExposure'?weatherRiskScore:reading[feature]})),recommendedAction:riskLevel==='Stable'?'Continue routine monitoring and scheduled inspection.':`Inspect ${oil?'cooling, oil circulation and insulation':'contacts, insulation and thermal condition'} within ${predictionWindowHours} hours; review load and weather exposure.`,modelVersion:'weighted-demo-v1',probabilityDisclaimer:'Heuristic risk proxy, not a calibrated failure probability',dataSource:'simulated'};
}
