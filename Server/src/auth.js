// Server/src/auth.js
import './firebase-init.js';
import admin from 'firebase-admin';

export async function verifyAuth(req, res, next) {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const hasAuth = typeof h === 'string' && h.trim().length > 0;
  const bearer = hasAuth && h.startsWith('Bearer ');

  if (process.env.NODE_ENV !== 'production') {
    console.log({
      tag: 'req',
      method: req.method,
      path: req.originalUrl || req.path,
      ua: req.headers['user-agent'] || '',
      origin: req.headers['origin'] || '',
      referer: req.headers['referer'] || '',
      hasAuthHeader: hasAuth,
      hasBearer: bearer,
    });
  }

  if (!hasAuth) {
    req.user = { uid: 'anon' }; // keep public routes public
    return next();
  }

  const [scheme, token] = h.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    if (process.env.NODE_ENV !== 'production') {
      const adminProject = admin.app().options.projectId;
      console.log({
        tag: 'auth',
        adminProject,
        tokenAud: decoded.aud,
        tokenIss: decoded.iss,
        uid: decoded.uid,
      });
    }

    const displayName =
      decoded.name ||
      decoded.displayName ||
      (decoded.email ? decoded.email.split('@')[0] : undefined) ||
      'User';

    req.user = { uid: decoded.uid, displayName };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
