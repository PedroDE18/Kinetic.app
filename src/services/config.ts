// Firebase Configuration loader
// Prioritizes environment variables (VITE_FIREBASE_*).
// No secrets are hardcoded in source; provide values via .env.local or build env.

let fallbackConfig: Record<string, string> = {};
try {
  // @ts-ignore
  fallbackConfig = await import('../../firebase-applet-config.json').then((m) => m.default || m).catch(() => ({}));
} catch {
  fallbackConfig = {};
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fallbackConfig.firestoreDatabaseId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId || '',
};
