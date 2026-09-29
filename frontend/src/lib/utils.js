/**
 * Format an ISO timestamp to a readable time/date.
 * @param {string} iso
 * @param {'time'|'datetime'|'date'} format
 * @returns {string}
 */
export function formatTime(iso, format = 'time') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;

  if (format === 'time') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'date') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate a string to maxLen characters with ellipsis.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 80) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Safely parse a JSON string. Returns the parsed value or the fallback.
 * @param {string|null|undefined} str
 * @param {*} fallback
 * @returns {*}
 */
export function safeJsonParse(str, fallback = null) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str; // already parsed
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Copy text to clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

/**
 * Abbreviate a UUID for display.
 * @param {string} uuid
 * @returns {string}
 */
export function shortId(uuid) {
  if (!uuid) return '—';
  return uuid.slice(0, 8) + '…';
}

/**
 * Determine if the workflow allows approval based on backend state.
 * Maps to the server's /approve eligibility check.
 * @param {import('./api').QueryResponse} state
 * @returns {boolean}
 */
export function canApprove(state) {
  if (!state) return false;
  return (
    state.workflow_status === 'awaiting_approval' &&
    Boolean(state.generated_sql) &&
    (!state.risk_flags || state.risk_flags.length === 0) &&
    !['approved', 'rejected'].includes(state.human_decision)
  );
}

/**
 * Determine if a workflow is awaiting clarification.
 * @param {import('./api').QueryResponse} state
 * @returns {boolean}
 */
export function needsClarification(state) {
  return state?.workflow_status === 'awaiting_clarification';
}

/**
 * Return a human-readable label for an intent value.
 * @param {string|null} intent
 * @returns {string}
 */
export function intentLabel(intent) {
  if (!intent) return 'UNKNOWN';
  return intent.toUpperCase();
}

/**
 * Classify the overall risk level of a query response.
 * @param {import('./api').QueryResponse} state
 * @returns {'safe'|'warning'|'blocked'|'unknown'}
 */
export function riskLevel(state) {
  if (!state) return 'unknown';
  if (state.workflow_status === 'blocked') return 'blocked';
  if (state.risk_flags && state.risk_flags.length > 0) return 'warning';
  if (state.workflow_status === 'awaiting_approval' && state.generated_sql) return 'safe';
  return 'unknown';
}
