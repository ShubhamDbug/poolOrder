// store-firestore.js
import { db } from './firebase-init.js';
import { Timestamp } from 'firebase-admin/firestore';import { nanoid } from 'nanoid';

// ---- helpers ----
const tsObj = (ts) =>
  ts && typeof ts.seconds === 'number'
    ? { _seconds: ts.seconds, _nanoseconds: ts.nanoseconds ?? 0 }
    : null;

const serializeRequestDoc = (doc) => {
  const d = doc.data();
  return {
    id: doc.id,
    item: d.item,
    platform: d.platform,
    lat: d.lat,
    lng: d.lng,
    deleteAt: tsObj(d.deleteAt),
    uid: d.uid,
    displayName: d.displayName,
    membersCount: Number(d.membersCount || 0), // ← include count for UI if needed
  };
};

const serializeMessageDoc = (doc) => {
  const d = doc.data();
  return {
    id: doc.id,
    uid: d.uid,
    displayName: d.displayName,
    text: d.text,
  };
};

// ---- Requests ----
export async function createRequest(
  { item, platform, latitude, longitude, expiresInMinutes },
  user
) {
  const nowMs = Date.now();
  const ttlMs = Math.max(1, Number(expiresInMinutes || 60)) * 60 * 1000;
  const deleteAt = Timestamp.fromMillis(nowMs + ttlMs);

  const data = {
    item: String(item || 'Item'),
    platform: String(platform || 'Swiggy'),
    lat: Number(latitude || 0),
    lng: Number(longitude || 0),
    deleteAt,
    uid: user?.uid || 'anon',
    displayName: user?.displayName || 'User',
    createdAt: Timestamp.fromMillis(nowMs),
    membersCount: 1, // ← owner is auto-joined below
  };

  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const ref = await db.collection('requests').add(data);

  // ✅ Auto-join the owner so they can chat immediately
  const ownerUid = user?.uid || 'anon';
  await ref.collection('members').doc(ownerUid).set(
    {
      joined: true,
      joinedAt: Timestamp.fromMillis(nowMs),
    },
    { merge: true }
  );

  const snap = await ref.get();
  return serializeRequestDoc(snap);
}

export async function closeRequest(id) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const ref = db.collection('requests').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ deleteAt: Timestamp.fromMillis(Date.now()) });
  const updated = await ref.get();
  return serializeRequestDoc(updated);
}

export async function listMine(uid) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const q = db.collection('requests').where('uid', '==', uid);
  const snap = await q.get();
  const items = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      item: d.item,
      platform: d.platform,
      lat: d.lat,
      lng: d.lng,
      deleteAt: d.deleteAt
        ? { _seconds: d.deleteAt.seconds, _nanoseconds: d.deleteAt.nanoseconds ?? 0 }
        : null,
      uid: d.uid,
      displayName: d.displayName,
      createdAtSec: d.createdAt ? d.createdAt.seconds : 0,
    };
  });
  items.sort((a, b) => (b.createdAtSec || 0) - (a.createdAtSec || 0));
  return items;
}

export async function deleteRequest(id, uid) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const reqRef = db.collection('requests').doc(id);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return { found: false };

  const ownerUid = reqSnap.data().uid;
  if (uid && ownerUid && uid !== ownerUid) {
    return { found: true, permitted: false };
  }

  const msgs = await reqRef.collection('messages').listDocuments();
  await Promise.all(msgs.map((d) => d.delete()));

  const mems = await reqRef.collection('members').listDocuments();
  await Promise.all(mems.map((d) => d.delete()));

  await reqRef.delete();
  return { found: true, permitted: true };
}

// ---- Memberships ----
// Idempotent join; validates request exists and is active; updates membersCount once
export async function ensureMembership(requestId, uid) {
  if (!requestId) throw new Error('Missing requestId');
  if (!uid) throw new Error('Missing uid');

  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const reqRef = db.collection('requests').doc(requestId);
  const now = Timestamp.fromMillis(Date.now());

  await db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new Error('Request not found');

    const r = reqSnap.data();
    const active = r?.deleteAt?.toMillis?.() > Date.now();
    if (!active) throw new Error('Request expired');

    const memRef = reqRef.collection('members').doc(uid);
    const memSnap = await tx.get(memRef);

    if (!memSnap.exists) {
      tx.set(memRef, { joined: true, joinedAt: now }, { merge: true });

      const current = Number(r?.membersCount || 0);
      tx.set(reqRef, { membersCount: current + 1 }, { merge: true });
    }
    // if already a member → no-op
  });

  return true;
}

// Idempotent leave; decrements membersCount but never below zero
export async function removeMembership(requestId, uid) {
  if (!requestId) throw new Error('Missing requestId');
  if (!uid) throw new Error('Missing uid');

  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const reqRef = db.collection('requests').doc(requestId);

  await db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) return;

    const memRef = reqRef.collection('members').doc(uid);
    const memSnap = await tx.get(memRef);

    if (memSnap.exists) {
      tx.delete(memRef);
      const current = Number(reqSnap.data()?.membersCount || 0);
      const next = Math.max(0, current - 1);
      tx.set(reqRef, { membersCount: next }, { merge: true });
    }
    // if not a member → no-op
  });

  return true;
}

export async function hasMembership(requestId, uid) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const mref = db.collection('requests').doc(requestId).collection('members').doc(uid);
  const ms = await mref.get();
  return ms.exists;
}

// ✅ helper to allow owner to read chat even if membership doc missing
export async function isOwner(requestId, uid) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const snap = await db.collection('requests').doc(requestId).get();
  return snap.exists && snap.data().uid === uid;
}

// ---- Nearby & Messages ----
export async function listNearby(lat, lng, radiusKm, currentUid, distanceFn) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const nowTs = Timestamp.fromMillis(Date.now());
  const q = db.collection('requests').where('deleteAt', '>', nowTs).orderBy('deleteAt', 'asc');
  const snap = await q.get();

  const inRange = [];
  for (const doc of snap.docs) {
    const r = serializeRequestDoc(doc);
    if (currentUid && r.uid === currentUid) continue;
    const d = distanceFn(lat, lng, r.lat, r.lng);
    if (d <= radiusKm * 1000) inRange.push({ ...r, distanceInM: Math.round(d) });
  }
  inRange.sort((a, b) => (a.distanceInM || 0) - (b.distanceInM || 0));
  return inRange;
}

export async function listMessages(requestId) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const q = db
    .collection('requests')
    .doc(requestId)
    .collection('messages')
    .orderBy('createdAt', 'asc');
  const snap = await q.get();
  return snap.docs.map(serializeMessageDoc);
}

export async function addMessage(requestId, { uid, displayName, text }) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const mref = db
    .collection('requests')
    .doc(requestId)
    .collection('messages')
    .doc(nanoid(12));
  const msg = {
    uid: uid || 'anon',
    displayName: displayName || 'User',
    text: String(text || '').slice(0, 400),
    createdAt: Timestamp.fromMillis(Date.now()),
  };
  await mref.set(msg);
  return { id: mref.id, ...msg };
}

// Check if a request exists and is still active (deleteAt > now)
export async function isRequestActive(requestId) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const ref = db.collection('requests').doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) return { exists: false, active: false, ref };
  const d = snap.data();
  const expiresMs = d?.deleteAt?.toMillis?.() ?? 0;
  const active = expiresMs > Date.now();
  return { exists: true, active, ref };
}

// Hard-delete all expired requests and their subcollections
export async function cleanupExpiredRequests(limit = 50) {
  if (!db) throw new Error('Firestore not initialized (FIREBASE_SERVICE_ACCOUNT_KEY missing?)');
  const nowTs = Timestamp.fromMillis(Date.now());
  const expiredQ = db.collection('requests').where('deleteAt', '<=', nowTs).limit(limit);

  const snap = await expiredQ.get();
  const batchDeletes = [];

  for (const doc of snap.docs) {
    const ref = doc.ref;
    // delete all messages
    const msgs = await ref.collection('messages').listDocuments();
    batchDeletes.push(Promise.all(msgs.map((d) => d.delete())));
    // delete all members
    const mems = await ref.collection('members').listDocuments();
    batchDeletes.push(Promise.all(mems.map((d) => d.delete())));
    // delete the request itself
    batchDeletes.push(ref.delete());
  }

  await Promise.all(batchDeletes);
  return snap.size; // number of requests deleted
}
