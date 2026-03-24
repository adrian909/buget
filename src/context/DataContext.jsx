import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadInitialData, getAllTransactions, getSetting, getCategoryBudgets,
  subscribeToChanges, initSyncCode } from '../db/storage';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [catBudgets, setCatBudgets]       = useState({});
  const [loading, setLoading]             = useState(true);
  const unsubRef = useRef(() => {});

  // Refreshuiește datele din local storage (apelat după orice mutație)
  const refresh = useCallback(async () => {
    const [txs, budget, cats] = await Promise.all([
      getAllTransactions(),
      getSetting('monthlyBudget'),
      getCategoryBudgets(),
    ]);
    setTransactions(txs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setMonthlyBudget(Number(budget) || 0);
    const map = {};
    cats.forEach((cb) => { map[cb.categoryId] = Number(cb.limit); });
    setCatBudgets(map);
  }, []);

  useEffect(() => {
    async function init() {
      // Inițializare cod sync
      await initSyncCode();

      // Încarcă din local storage (instant, fără rețea)
      const { transactions: txs, settings, catBudgets: cb } = await loadInitialData();
      setTransactions(txs.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setMonthlyBudget(Number(settings.monthlyBudget) || 0);
      const map = {};
      Object.entries(cb).forEach(([id, limit]) => { map[id] = Number(limit); });
      setCatBudgets(map);
      setLoading(false);

      // Pornește listener Firebase real-time
      // Când se schimbă ceva pe orice dispozitiv → UI se actualizează automat
      unsubRef.current = await subscribeToChanges((remoteTxs) => {
        setTransactions(
          [...remoteTxs].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      });
    }

    init();
    return () => unsubRef.current?.();
  }, []);

  return (
    <DataContext.Provider value={{ transactions, monthlyBudget, catBudgets, loading, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
