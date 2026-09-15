import test,{before,after} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-gridguard',firestore:{rules:readFileSync('firestore.rules','utf8')}});await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();for(const [path,data]of Object.entries({'assets/A':{region:'Ahmedabad East'},'users/alice':{name:'Alice',email:'alice@example.com',role:'operator',defaultRegion:'Ahmedabad East'},'users/admin1':{name:'Admin User',email:'admin@example.com',role:'admin',defaultRegion:'Ahmedabad East'},'users/viewer1':{name:'Viewer User',email:'viewer@example.com',role:'reliability',defaultRegion:'Ahmedabad East'},'users/fs1':{name:'Field Supervisor',email:'fs@example.com',role:'field_supervisor',defaultRegion:'Ahmedabad East'},'users/maint1':{name:'Maintenance',email:'maint@example.com',role:'maintenance',defaultRegion:'Ahmedabad East'},'maintenanceOrders/WO-A':{orderId:'WO-A',assetId:'A',region:'Ahmedabad East',status:'Pending',assignedCrewId:null},'maintenanceOrders/WO-B':{orderId:'WO-B',assetId:'A',region:'Ahmedabad East',status:'Pending',assignedCrewId:null},'crews/C':{crewId:'C',region:'Ahmedabad East',status:'Ready',assignedOrderId:null,availability:true}}))await setDoc(doc(db,path),data);});});
after(async()=>env?.cleanup());
test('anonymous access and cross-profile edits denied',async()=>{await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'assets/A')));await assertFails(updateDoc(doc(env.authenticatedContext('bob').firestore(),'users/alice'),{name:'Bob',updatedAt:serverTimestamp()}));});
test('profile cannot elevate privileges',async()=>{const db=env.authenticatedContext('alice').firestore();await assertFails(updateDoc(doc(db,'users/alice'),{role:'admin',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(doc(db,'users/alice'),{name:'Alice Updated',updatedAt:serverTimestamp()}));});
test('operational read allowed; score tampering denied',async()=>{const db=env.authenticatedContext('alice').firestore();await assertSucceeds(getDoc(doc(db,'assets/A')));await assertFails(updateDoc(doc(db,'assets/A'),{riskScore:0}));});
test('assignment requires atomic reciprocal links; duplicate assignment denied',async()=>{const db=env.authenticatedContext('fs1').firestore();await assertFails(updateDoc(doc(db,'maintenanceOrders/WO-A'),{status:'Assigned',assignedCrewId:'C',updatedAt:serverTimestamp()}));let b=writeBatch(db);b.update(doc(db,'maintenanceOrders/WO-A'),{status:'Assigned',assignedCrewId:'C',updatedAt:serverTimestamp()});b.update(doc(db,'crews/C'),{status:'Assigned',assignedOrderId:'WO-A',availability:false,lastUpdated:serverTimestamp()});await assertSucceeds(b.commit());b=writeBatch(db);b.update(doc(db,'maintenanceOrders/WO-B'),{status:'Assigned',assignedCrewId:'C',updatedAt:serverTimestamp()});b.update(doc(db,'crews/C'),{status:'Assigned',assignedOrderId:'WO-B',availability:false,lastUpdated:serverTimestamp()});await assertFails(b.commit());});
test('malformed incident writes rejected',async()=>{const db=env.authenticatedContext('alice').firestore();await assertFails(setDoc(doc(db,'incidents/invalid'),{status:'Resolved',assetId:'A',region:'Ahmedabad East'}));});
test('admin can create assets; operator cannot create assets',async()=>{const adminDb=env.authenticatedContext('admin1').firestore();const opDb=env.authenticatedContext('alice').firestore();await assertSucceeds(setDoc(doc(adminDb,'assets/NEW_ASSET'),{assetId:'NEW_ASSET',region:'Ahmedabad East',dataSource:'simulated'}));await assertFails(setDoc(doc(opDb,'assets/FAIL_ASSET'),{assetId:'FAIL_ASSET',region:'Ahmedabad East',dataSource:'simulated'}));});
test('viewer has read-only access and cannot write operational data',async()=>{const viewerDb=env.authenticatedContext('viewer1').firestore();await assertSucceeds(getDoc(doc(viewerDb,'assets/A')));await assertFails(setDoc(doc(viewerDb,'assets/V_ASSET'),{assetId:'V_ASSET',region:'Ahmedabad East',dataSource:'simulated'}));await assertFails(setDoc(doc(viewerDb,'incidents/V_INC'),{incidentId:'V_INC',assetId:'A',region:'Ahmedabad East',severity:'Stable',status:'Open',title:'Test',description:'Test',type:'Report',affectedLoadMW:0,customersAffected:0,weatherRelated:false,dataSource:'simulated',startedAt:serverTimestamp(),createdAt:serverTimestamp()}));});
test('operator cannot assign crews',async()=>{const db=env.authenticatedContext('alice').firestore();let b=writeBatch(db);b.update(doc(db,'maintenanceOrders/WO-A'),{status:'Assigned',assignedCrewId:'C',updatedAt:serverTimestamp()});b.update(doc(db,'crews/C'),{status:'Assigned',assignedOrderId:'WO-A',availability:false,lastUpdated:serverTimestamp()});await assertFails(b.commit());});
test('maintenance cannot assign crews but can start work',async()=>{const db=env.authenticatedContext('maint1').firestore();let b=writeBatch(db);b.update(doc(db,'maintenanceOrders/WO-A'),{status:'Assigned',assignedCrewId:'C',updatedAt:serverTimestamp()});b.update(doc(db,'crews/C'),{status:'Assigned',assignedOrderId:'WO-A',availability:false,lastUpdated:serverTimestamp()});await assertFails(b.commit());});


test('maintenance starts and completes with reciprocal crew state',async()=>{
 const db=env.authenticatedContext('maint1').firestore();
 let b=writeBatch(db);
 b.update(doc(db,'maintenanceOrders/WO-A'),{status:'In Progress',assignedCrewId:'C',updatedAt:serverTimestamp()});
 b.update(doc(db,'crews/C'),{status:'Deployed',assignedOrderId:'WO-A',availability:false,lastUpdated:serverTimestamp()});
 await assertSucceeds(b.commit());
 b=writeBatch(db);
 b.update(doc(db,'maintenanceOrders/WO-A'),{status:'Completed',assignedCrewId:null,updatedAt:serverTimestamp()});
 b.update(doc(db,'crews/C'),{status:'Ready',assignedOrderId:null,availability:true,lastUpdated:serverTimestamp()});
 await assertSucceeds(b.commit());
 const snap=await getDoc(doc(db,'crews/C'));
 if(snap.data().status!=='Ready'||!snap.data().availability)throw new Error('Crew not released');
});
test('valid work-order schema and full incident lifecycle are authorized',async()=>{
 const db=env.authenticatedContext('alice').firestore();
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'assets/FINAL'),{region:'Ahmedabad East'}));
 await assertSucceeds(setDoc(doc(db,'maintenanceOrders/WO-FINAL'),{orderId:'WO-FINAL',assetId:'FINAL',region:'Ahmedabad East',priority:'Critical',status:'Pending',summary:'Automated test',assignedCrewId:null,dueAt:new Date(),failureRisk:85,gridImpact:'High',checklist:[],aiReason:'Test',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),dataSource:'simulated'}));
 await assertSucceeds(setDoc(doc(db,'incidents/FINAL'),{incidentId:'FINAL',assetId:'FINAL',region:'Ahmedabad East',severity:'Elevated',type:'Operator Report',title:'Automated test',description:'Test',status:'Open',startedAt:serverTimestamp(),resolvedAt:null,affectedLoadMW:0,customersAffected:0,weatherRelated:false,createdAt:serverTimestamp(),dataSource:'simulated'}));
 await assertSucceeds(updateDoc(doc(db,'incidents/FINAL'),{status:'Monitoring',resolvedAt:null}));
 await assertSucceeds(updateDoc(doc(db,'incidents/FINAL'),{status:'Resolved',resolvedAt:serverTimestamp()}));
});
