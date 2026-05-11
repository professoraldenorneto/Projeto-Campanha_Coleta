import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Placeholder config - user needs to finish set_up_firebase successfully
// AI Studio normally provides firebase-applet-config.json
// NOTE: Firebase configuration can be provided via environment variables in the Secrets panel.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "PLACEHOLDER",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "PLACEHOLDER",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "PLACEHOLDER",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "PLACEHOLDER",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER",
  appId: process.env.VITE_FIREBASE_APP_ID || "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// @ts-ignore
export const db = getFirestore(app);

// Test connection as per guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
