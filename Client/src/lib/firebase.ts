// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth, type Auth, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, type User
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent re-init during HMR
export const app: FirebaseApp =
  getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Optional analytics (browser-only + supported)
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((ok) => { if (ok) analytics = getAnalytics(app); }).catch(() => {});
}

// ─── Google-only helpers ──────────────────────────────────────────────────────
const provider = new GoogleAuthProvider();
// Nice UX: always show account chooser
provider.setCustomParameters({ prompt: "select_account" });

export const listenUser = (setter: (u: User | null) => void) =>
  onAuthStateChanged(auth, setter);

export async function signInWithGoogle() {
  try {
    // Popups are great on desktop; redirect fallback covers popup blockers/mobile
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export const signOutUser = () => signOut(auth);

export const idToken = async () =>
  auth.currentUser ? auth.currentUser.getIdToken() : null;
export const login = signInWithGoogle;