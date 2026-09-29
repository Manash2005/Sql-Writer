import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sql_agent_history';
const MAX_ITEMS = 100;

/**
 * @typedef {Object} HistoryItem
 * @property {string} id          - thread_id
 * @property {string} request     - user's original natural-language request
 * @property {string|null} intent
 * @property {string|null} workflow_status
 * @property {string} timestamp   - ISO string
 * @property {import('../lib/api').QueryResponse} data - full query result
 */

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * useLocalHistory manages session history stored in localStorage.
 */
export function useLocalHistory() {
  const [history, setHistory] = useState(loadHistory);

  // Keep in sync across tabs
  useEffect(() => {
    const handler = () => setHistory(loadHistory());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  /**
   * Add a query result to history (or update if same thread_id).
   * @param {import('../lib/api').QueryResponse} queryResult
   */
  const addOrUpdate = useCallback((queryResult) => {
    if (!queryResult?.thread_id) return;

    setHistory((prev) => {
      const exists = prev.findIndex((h) => h.id === queryResult.thread_id);
      const item = {
        id: queryResult.thread_id,
        request: queryResult.query || '(unknown)',
        intent: queryResult.intent,
        workflow_status: queryResult.workflow_status,
        timestamp: new Date().toISOString(),
        data: queryResult,
      };
      const next =
        exists >= 0
          ? prev.map((h, i) => (i === exists ? item : h))
          : [item, ...prev];
      saveHistory(next);
      return next.slice(0, MAX_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addOrUpdate, clearHistory };
}
