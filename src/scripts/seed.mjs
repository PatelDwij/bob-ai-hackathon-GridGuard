import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {generateDemo} from './demo-data.mjs';
const emulator=process.argv.includes('--emulator');
if(emulator){process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';initializeApp({projectId:'demo-gridguard'});}else{if(!process.env.GOOGLE_CLOUD_PROJECT)throw new Error('Set GOOGLE_CLOUD_PROJECT and Application Default Credentials. Use --emulator for local demo.');initializeApp({credential:applicationDefault(),projectId:process.env.GOOGLE_CLOUD_PROJECT});}
const db=getFirestore(),data=generateDemo(new Date());let count=0;
// Create only: reruns never overwrite operator actions or existing asset histories.
for(const [collection,rows] of Object.entries(data))for(const {id,...record} of rows){try{await db.collection(collection).doc(id).create(record);count++;}catch(e){if(e.code!==6)throw e;}}
console.log(`Created ${count} simulated records. Existing documents were preserved.`);
