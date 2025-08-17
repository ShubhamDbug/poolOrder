import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
  type Unsubscribe,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Singleton app + auth
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google provider with account chooser
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function listenUser(setter: (u: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, setter);
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export async function signOutNow(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Returns a Firebase ID token string; waits for initial auth state if needed. */
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

export { auth, app };
