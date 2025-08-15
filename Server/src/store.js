import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, '..', 'db.json');

const DEFAULT = { requests: [], messages: {}, memberships: {} };

function load() {
  if (!existsSync(DB_FILE)) return JSON.parse(JSON.stringify(DEFAULT));
  try {
    const raw = readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return { ...DEFAULT, ...data };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function save() {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch {}
}

export let db = load();

export function createRequest({ item, platform, latitude, longitude, expiresInMinutes }, user) {
  const nowSec = Math.floor(Date.now() / 1000);
  const deleteAtSec = nowSec + Math.max(1, Number(expiresInMinutes || 60)) * 60;

  const req = {
    id: nanoid(10),
    item: String(item || 'Item'),
    platform: String(platform || 'Swiggy'),
    lat: Number(latitude || 0),
    lng: Number(longitude || 0),
    deleteAt: { _seconds: deleteAtSec, _nanoseconds: 0 },
    uid: user?.uid || 'anon',
    displayName: user?.displayName || 'User'
  };
  db.requests.push(req);
  save();
  return req;
}

export function closeRequest(id) {
  const r = db.requests.find(r => r.id === id);
  if (!r) return null;
  r.deleteAt = { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 };
  save();
  return r;
}

export function listMine(uid) {
  return db.requests.filter(r => r.uid === uid);
}

export function ensureMembership(requestId, uid) {
  db.memberships[requestId] = db.memberships[requestId] || {};
  db.memberships[requestId][uid] = true;
  save();
  return true;
}

export function removeMembership(requestId, uid) {
  if (db.memberships[requestId]) {
    delete db.memberships[requestId][uid];
    save();
  }
  return true;
}

export function hasMembership(requestId, uid) {
  return !!(db.memberships[requestId] && db.memberships[requestId][uid]);
}

export function listMessages(requestId) {
  db.messages[requestId] = db.messages[requestId] || [];
  return db.messages[requestId];
}

export function addMessage(requestId, { uid, displayName, text }) {
  db.messages[requestId] = db.messages[requestId] || [];
  const m = {
    id: nanoid(12),
    uid: uid || 'anon',
    displayName: displayName || 'User',
    text: String(text || '').slice(0, 400)
  };
  db.messages[requestId].push(m);
  save();
  return m;
}
