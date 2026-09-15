// Exact manifests only. No collection scans, email patterns, or seed-data guessing.
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
const manifestPath = process.argv.find(arg => arg.startsWith('--manifest='))?.slice(11);
if (!manifestPath) {
  console.log('CLEANUP SKIPPED: no explicit automated-test manifest supplied; no records or users deleted.');
  process.exit(0);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.projectId !== 'gridguard-ai-32b1b' || manifest.purpose !== 'automated-test') throw new Error('Expected an explicit gridguard-ai-32b1b automated-test manifest.');
const documents = manifest.documents || [], users = manifest.users || [];
if (documents.some(path => !/^(assets|sensorReadings|predictions|maintenanceOrders|crews|incidents|users)\/[^/]+$/.test(path))) throw new Error('Invalid document path.');
if (users.some(user => !user.uid || !user.email?.endsWith('@gridguard.test'))) throw new Error('Exact test uid and email required.');
console.log(JSON.stringify({projectId:manifest.projectId,documents,users},null,2));
if (!process.argv.includes('--apply')) { console.log('DRY RUN: no records or users deleted.'); process.exit(0); }
initializeApp({credential:applicationDefault(),projectId:manifest.projectId});
const db=getFirestore(), auth=getAuth();
for (const user of users) {
  const actual = await auth.getUser(user.uid);
  if (actual.email !== user.email) throw new Error('Test user identity mismatch; stopped.');
}
for (const path of documents) { await db.doc(path).delete(); console.log(`Deleted ${path}`); }
for (const user of users) { await db.doc(`users/${user.uid}`).delete(); await auth.deleteUser(user.uid); console.log(`Deleted test user ${user.email}`); }
console.log('Exact manifest cleanup complete.');
