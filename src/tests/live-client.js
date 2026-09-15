// Vite resolves these to the same SDK modules used by the application.
// This module contains no credentials and is only imported by the live runner.
export {setPersistence,browserLocalPersistence,signInWithEmailAndPassword} from 'firebase/auth';
export {doc,getDocFromServer,updateDoc,serverTimestamp,getDocsFromServer,query,collection,where} from 'firebase/firestore';
