// src/auth.js
// Non-blocking verifier + blocking guard for protected routes.
// Works with Firebase Admin (initialized in ./firebase-init.js)

import { auth as adminAuth } from './firebase-init.js';

/** Extract Bearer token from Authorization header */
function getBearerToken(req) {
  const header = req.get('authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}

/** Extract a cookie value without extra deps */
function getCookie(req, name) {
  const raw = req.headers?.cookie || '';
  if (!raw) return null;
  const parts = raw.split(';').map(s => s.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * verifyAuth
 * - Non-blocking middleware.
 * - If a valid Firebase ID token (Authorization: Bearer <token>) OR a Firebase session cookie is present,
 *   attaches req.user = { uid, displayName }. Otherwise sets req.user = null.
 * - Always calls next() (never rejects public routes).
 */
export async function verifyAuth(req, _res, next) {
  try {
    let token = getBearerToken(req);

    // Optional: support Firebase session cookies (if you use them)
    if (!token) {
      token = getCookie(req, '__session') || getCookie(req, 'session');
      // Note: verifySessionCookie expects a session cookie, not an ID token.
      if (token) {
        try {
          const decoded = await adminAuth.verifySessionCookie(token, true);
          req.user = {
            uid: decoded.uid,
            displayName:
              decoded.name ||
              decoded.email ||
              (decoded.uid ? `user_${decoded.uid.slice(0, 6)}` : 'user'),
          };
          return next();
        } catch (e) {
          // fall through to ID token path if cookie verification fails
        }
      }
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      displayName:
        decoded.name ||
        decoded.email ||
        (decoded.uid ? `user_${decoded.uid.slice(0, 6)}` : 'user'),
    };
    return next();
  } catch (err) {
    console.error('verifyAuth error:', err?.message || err);
    req.user = null; // remain non-blocking for public routes
    return next();
  }
}

/**
 * requireAuth
 * - Blocking guard for protected routes.
 * - If verifyAuth already populated req.user, it proceeds.
 * - Otherwise tries once to verify an ID token; if invalid/missing -> 401.
 */
export async function requireAuth(req, res, next) {
  try {
    if (req.user?.uid) return next();

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'UNAUTHENTICATED' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      displayName:
        decoded.name ||
        decoded.email ||
        (decoded.uid ? `user_${decoded.uid.slice(0, 6)}` : 'user'),
    };
    return next();
  } catch (err) {
    console.error('requireAuth error:', err?.message || err);
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
}

/** Default export stays as the non-blocking verifier for convenience */
export default verifyAuth;
