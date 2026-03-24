import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection, doc,
  getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch,
} from 'firebase/firestore';
import { firebaseConfig, isConfigured } from './firebaseConfig';

let _db = null;

export function getDB() {
  if (!isConfigured) return null;
  if (!_db) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    _db = getFirestore(app);
  }
  return _db;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function userCol(syncCode, name) {
  return collection(getDB(), 'users', syncCode, name);
}

function userDoc(syncCode, col, id) {
  return doc(getDB(), 'users', syncCode, col, id);
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function pushTransaction(syncCode, tx) {
  if (!isConfigured || !syncCode) return;
  await setDoc(userDoc(syncCode, 'transactions', String(tx.id)), tx);
}

export async function pushDeleteTransaction(syncCode, id) {
  if (!isConfigured || !syncCode) return;
  await deleteDoc(userDoc(syncCode, 'transactions', String(id)));
}

export async function fetchAllTransactions(syncCode) {
  if (!isConfigured || !syncCode) return null;
  const snap = await getDocs(userCol(syncCode, 'transactions'));
  return snap.docs.map((d) => d.data());
}

export function subscribeTransactions(syncCode, onChange) {
  if (!isConfigured || !syncCode) return () => {};
  return onSnapshot(userCol(syncCode, 'transactions'), (snap) => {
    onChange(snap.docs.map((d) => d.data()));
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function pushSettings(syncCode, data) {
  if (!isConfigured || !syncCode) return;
  await setDoc(userDoc(syncCode, 'meta', 'settings'), data);
}

export async function fetchSettings(syncCode) {
  if (!isConfigured || !syncCode) return null;
  const snap = await getDocs(userCol(syncCode, 'meta'));
  const settings = snap.docs.find((d) => d.id === 'settings');
  return settings ? settings.data() : null;
}

// ── Category budgets ──────────────────────────────────────────────────────────

export async function pushCategoryBudgets(syncCode, data) {
  if (!isConfigured || !syncCode) return;
  await setDoc(userDoc(syncCode, 'meta', 'categoryBudgets'), data);
}

export async function fetchCategoryBudgets(syncCode) {
  if (!isConfigured || !syncCode) return null;
  const snap = await getDocs(userCol(syncCode, 'meta'));
  const cb = snap.docs.find((d) => d.id === 'categoryBudgets');
  return cb ? cb.data() : null;
}
