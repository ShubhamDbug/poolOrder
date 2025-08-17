// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,            // <-- no newline
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const listenUser = (setter: (u: User | null) => void) =>
  onAuthStateChanged(auth, setter);

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export const signOutNow = () => firebaseSignOut(auth);

export async function idToken(): Promise<string | null> {
  const u = auth.currentUser;              // currentUser is synchronous
  if (!u) return null;
  return await u.getIdToken();
}

// Back-compat names
export const login = signInWithGoogle;
export const logout = signOutNow;
export const getIdToken = idToken;
export const onAuth = listenUser;

export { auth };
export type { User };

export default {
  auth,
  listenUser,
  idToken,
  signInWithGoogle,
  signOutNow,
  login,
  logout,
  getIdToken,
  onAuth,
};
