import { openDB } from 'idb';

const DB_NAME = 'buget-app';
const DB_VERSION = 1;

let dbPromise;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const txStore = db.createObjectStore('transactions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        txStore.createIndex('date', 'date');
        txStore.createIndex('category', 'category');
        txStore.createIndex('type', 'type');

        db.createObjectStore('settings', { keyPath: 'key' });
        db.createObjectStore('categoryBudgets', { keyPath: 'categoryId' });
      },
    });
  }
  return dbPromise;
}

// Transactions
export async function addTransaction(tx) {
  const db = await getDB();
  return db.add('transactions', { ...tx, createdAt: Date.now() });
}

export async function updateTransaction(tx) {
  const db = await getDB();
  return db.put('transactions', tx);
}

export async function deleteTransaction(id) {
  const db = await getDB();
  return db.delete('transactions', id);
}

export async function getTransactionsByMonth(year, month) {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export async function getAllTransactions() {
  const db = await getDB();
  return db.getAll('transactions');
}

// Settings
export async function getSetting(key) {
  const db = await getDB();
  const rec = await db.get('settings', key);
  return rec ? rec.value : null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  return db.put('settings', { key, value });
}

// Category budgets
export async function getCategoryBudgets() {
  const db = await getDB();
  return db.getAll('categoryBudgets');
}

export async function setCategoryBudget(categoryId, limit) {
  const db = await getDB();
  return db.put('categoryBudgets', { categoryId, limit });
}
