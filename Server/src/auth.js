// Server/src/auth.js
// Verifies Firebase ID tokens and attaches req.user = { uid, displayName }

import './firebase-init.js'; // ensure Firebase Admin is initialized
import admin from 'firebase-admin';

/**
 * verifyAuth
 * - Looks for Authorization: Bearer <idToken>
 * - Verifies with Firebase Admin
 * - Attaches req.user = { uid, displayName }
 * - If token lacks name, fetches user record or uses email prefix
 * - On failure/missing header, treats as anonymous: { uid: 'anon' }
 */
export async function verifyAuth(req, _res, next) {
 
  const authHeader = req.headers.authorization || '';
   console.log(req.headers) ;
   console.log(req.headers.authorization) ;
  if (!authHeader.startsWith('Bearer ')) {
    req.user = { uid: 'anon' };
    return next();
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    let displayName = decoded.name;
    if (!displayName) {
      try {
        const userRecord = await admin.auth().getUser(decoded.uid);
        displayName =
          userRecord.displayName ||
          (userRecord.email ? userRecord.email.split('@')[0] : undefined);
      } catch {
        // ignore; we'll fallback below
      }
    }

    req.user = {
      uid: decoded.uid,
      displayName: displayName || 'User',
    };

    return next();
  } catch {
    // Invalid/expired token → anonymous (or change to 401 if you prefer)
    req.user = { uid: 'anon' };
    return next();
  }
}
