import { Preferences } from '@capacitor/preferences';
import {
  pushTransaction, pushDeleteTransaction,
  pushSettings, pushCategoryBudgets,
  fetchAllTransactions, fetchSettings, fetchCategoryBudgets,
  subscribeTransactions,
} from './firebase';
import { isConfigured } from './firebaseConfig';

// ── Local helpers ─────────────────────────────────────────────────────────────

async function load(key) {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : null;
}

async function save(key, data) {
  await Preferences.set({ key, value: JSON.stringify(data) });
}

// ── Sync code ─────────────────────────────────────────────────────────────────

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getSyncCode() {
  return (await load('syncCode')) || null;
}

export async function initSyncCode() {
  let code = await load('syncCode');
  if (!code) {
    code = randomCode();
    await save('syncCode', code);
  }
  return code;
}

export async function setSyncCode(code) {
  await save('syncCode', code.toUpperCase().trim());
}

// ── Initial load (citește LOCAL, rapid) ───────────────────────────────────────
// Nu face fetch Firebase — e apelat o singură dată la pornire din DataContext

export async function loadInitialData() {
  const [txs, settings, catBudgets] = await Promise.all([
    load('transactions'),
    load('settings'),
    load('categoryBudgets'),
  ]);
  return {
    transactions:  txs        || [],
    settings:      settings   || {},
    catBudgets:    catBudgets || {},
  };
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function getAllTransactions() {
  return (await load('transactions')) || [];
}

export async function addTransaction(tx) {
  const all = (await load('transactions')) || [];
  const newTx = { ...tx, id: Date.now() };
  await save('transactions', [...all, newTx]);
  if (isConfigured) {
    const code = await getSyncCode();
    if (code) pushTransaction(code, newTx).catch(() => {});
  }
  return newTx;
}

export async function updateTransaction(tx) {
  const all = (await load('transactions')) || [];
  await save('transactions', all.map((t) => (t.id === tx.id ? tx : t)));
  if (isConfigured) {
    const code = await getSyncCode();
    if (code) pushTransaction(code, tx).catch(() => {});
  }
}

export async function deleteTransaction(id) {
  const all = (await load('transactions')) || [];
  await save('transactions', all.filter((t) => t.id !== id));
  if (isConfigured) {
    const code = await getSyncCode();
    if (code) pushDeleteTransaction(code, id).catch(() => {});
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSetting(key) {
  const settings = (await load('settings')) || {};
  return settings[key] ?? null;
}

export async function setSetting(key, value) {
  const settings = (await load('settings')) || {};
  const updated = { ...settings, [key]: value };
  await save('settings', updated);
  if (isConfigured) {
    const code = await getSyncCode();
    if (code) pushSettings(code, updated).catch(() => {});
  }
}

// ── Category budgets ──────────────────────────────────────────────────────────

export async function getCategoryBudgets() {
  const obj = (await load('categoryBudgets')) || {};
  return Object.entries(obj).map(([categoryId, limit]) => ({ categoryId, limit }));
}

export async function setCategoryBudget(categoryId, limit) {
  const obj = (await load('categoryBudgets')) || {};
  const updated = { ...obj, [categoryId]: limit };
  await save('categoryBudgets', updated);
  if (isConfigured) {
    const code = await getSyncCode();
    if (code) pushCategoryBudgets(code, updated).catch(() => {});
  }
}

// ── Real-time Firebase subscription ──────────────────────────────────────────
// Returnează o funcție de unsubscribe

export async function subscribeToChanges(onTransactions) {
  if (!isConfigured) return () => {};
  const code = await getSyncCode();
  if (!code) return () => {};
  return subscribeTransactions(code, async (remoteTxs) => {
    await save('transactions', remoteTxs);
    onTransactions(remoteTxs);
  });
}

// ── Pull manual din Firebase ──────────────────────────────────────────────────

export async function pullFromCloud() {
  if (!isConfigured) return false;
  const code = await getSyncCode();
  if (!code) return false;
  try {
    const [remoteTxs, remoteSettings, remoteCatBudgets] = await Promise.all([
      fetchAllTransactions(code),
      fetchSettings(code),
      fetchCategoryBudgets(code),
    ]);
    if (remoteTxs)        await save('transactions',    remoteTxs);
    if (remoteSettings)   await save('settings',        remoteSettings);
    if (remoteCatBudgets) await save('categoryBudgets', remoteCatBudgets);
    return true;
  } catch {
    return false;
  }
}
