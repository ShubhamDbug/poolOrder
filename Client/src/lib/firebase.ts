import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config from Vite env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Firestore (new export used by Chat for live updates)
const db = getFirestore(app);

// ---- Auth helpers (kept the same API as before) ----
export const listenUser = (setter: (u: User | null) => void) =>
  onAuthStateChanged(auth, setter);

export async function idToken(forceRefresh = false): Promise<string | null> {
  if (auth.currentUser) {
    return auth.currentUser.getIdToken(forceRefresh);
  }
  const user = await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
  return user ? user.getIdToken(forceRefresh) : null;
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    // Fallback for popup blockers and non-popup envs (mobile PWA, etc.)
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export async function signOutNow() {
  await firebaseSignOut(auth);
}

export { app, auth, db };
