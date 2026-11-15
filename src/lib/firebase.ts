import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inizializzazione Firebase Applet
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inizializzazione Firestore con databaseId dedicato
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validazione connessione iniziale a Firestore (come da specifiche)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore in modalità offline o connessione in corso.");
    }
  }
}
testConnection();
