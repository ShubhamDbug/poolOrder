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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/** New name (and exported alias below): subscribe to auth changes. */
function listenUser(setter: (u: User | null) => void) {
  return onAuthStateChanged(auth, setter);
}

/** New name (and exported alias below): fetch ID token or null. */
async function idToken(forceRefresh = false): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return u.getIdToken(forceRefresh);
}

/** New name (and exported alias below): Google sign-in with popup + redirect fallback. */
async function signInWithGoogle(): Promise<User> {
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      // After redirect, wait for state
      return new Promise<User>((resolve, reject) => {
        const unsub = onAuthStateChanged(
          auth,
          (u) => {
            if (u) {
              unsub();
              resolve(u);
            }
          },
          reject
        );
        setTimeout(() => reject(new Error('Sign-in redirect timed out')), 60_000);
      });
    }
    throw err;
  }
}

/** New name (and exported alias below). */
async function signOutNow() {
  return firebaseSignOut(auth);
}

/* ---------- Backward-compatible aliases (old names) ---------- */
const login = signInWithGoogle;
const logout = signOutNow;
const getIdToken = idToken;
const onAuth = listenUser;

/* ------------------- Named exports ------------------- */
export {
  auth,
  listenUser,
  idToken,
  signInWithGoogle,
  signOutNow,
  // Old names:
  login,
  logout,
  getIdToken,
  onAuth,
};

export type { User };

/* ------------------- Default export ------------------- */
export default {
  auth,
  listenUser,
  idToken,
  signInWithGoogle,
  signOutNow ,
  // Old names:
  login,
  logout,
  getIdToken,
  onAuth,
};
