import { isFallback, saveProfile } from './demo-session.js';
import { formatRoleName } from './auth.js';
import { doc, updateDoc, serverTimestamp } from './data-client.js';
import { db } from './firebase-config.js';
import { renderProfile } from './auth.js';
import { message, errorText, REGIONS } from './utils.js';
export async function mountSettings(user){
 const {mount}=await import('./pages/settings.js');
 localStorage.removeItem('gridguard-settings'); // Account preferences always come from the authenticated profile.
 const view=mount({},user);let saved={...view.getSettings(),...(user.preferences||{}),displayName:user.name,defaultRegion:user.defaultRegion,operatorRole:user.role};view.applySettings(saved);
 const roleSelect = document.getElementById('operatorRole');
 roleSelect.replaceChildren(...(isFallback() ? ['operator','admin','field_supervisor','maintenance','reliability'] : [user.role]).map(role => new Option(formatRoleName(role),role))); roleSelect.value=user.role; roleSelect.disabled=!isFallback();
 for(const id of ['apiBaseUrl','dataMode'])document.getElementById(id).disabled=true;
 document.getElementById('apiBaseUrl').value=isFallback() ? 'Local simulation' : 'Cloud Firestore';
 document.querySelector('.settings-note').textContent=isFallback() ? 'Local simulation. Choose a demo role here; changes apply only to this browser session.' : 'Account preferences sync through Firestore. Sidebar preferences stay on this device.';
 const note=document.createElement('p');note.className='page-subtitle';note.textContent='Thresholds and horizon are personal alert preferences. Shared predictions use the documented model; preferences do not retrain or alter asset scores.';document.getElementById('predictions').append(note);
 document.addEventListener('click',async e=>{const target=e.target.closest('#saveBtn,#discardBtn,#resetSettings');if(!target)return;e.preventDefault();e.stopImmediatePropagation();try{
 if(target.id==='discardBtn'){view.applySettings(saved);message('Unsaved changes discarded.');return;}
 if(target.id==='resetSettings'){view.applySettings({...saved,criticalThreshold:75,elevatedThreshold:45,predictionHorizon:72,weatherLayer:true,mapZoom:12,refreshInterval:30});message('Defaults restored in form. Save to persist.');return;}
 const p=view.getSettings();if(!p.displayName||p.displayName.length>120)throw new Error('Enter a name of 1–120 characters.');if(Number(p.elevatedThreshold)>=Number(p.criticalThreshold))throw new Error('Elevated threshold must be below critical threshold.');if(!REGIONS.includes(p.defaultRegion))throw new Error('Choose a configured region.');
 const {operatorRole,apiBaseUrl,dataMode,rememberSidebar,interfaceDensity,...preferences}=p;
 target.disabled=true;await updateDoc(doc(db,'users',user.uid),{name:p.displayName,defaultRegion:p.defaultRegion,preferences,updatedAt:serverTimestamp()});if(isFallback()){user.role=operatorRole;saveProfile({...user,name:p.displayName,defaultRegion:p.defaultRegion,preferences});}saved=p;user.name=p.displayName;renderProfile(user);localStorage.setItem('gridguard-sidebar-collapsed',rememberSidebar&&document.getElementById('sidebar').classList.contains('collapsed')?'1':'0');localStorage.setItem('gridguard-region',p.defaultRegion);message(isFallback() ? 'Settings saved · Demo Fallback · Simulated Data' : 'Settings saved to your Firebase profile.');
 }catch(err){message(errorText(err),true);}finally{target.disabled=false;}},true);
}
