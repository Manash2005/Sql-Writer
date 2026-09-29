import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Centralized Axios client. All API calls go through this instance.
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network / timeout / backend down
      return Promise.reject({
        message: 'Cannot reach the backend. Is the server running?',
        status: null,
        detail: null,
      });
    }
    const { status, data } = error.response;
    // Make the generic 500 "workflow failed" message more actionable
    let message = data?.detail || `Request failed with status ${status}`;
    if (status === 500 && message.toLowerCase().includes('workflow failed')) {
      message = 'The backend workflow failed. This is often caused by the LLM API being unavailable or rate-limited. Check the backend terminal for the exact error.';
    }
    return Promise.reject({
      message,
      status,
      detail: data?.detail || null,
    });
  }
);

// ─── Health ───────────────────────────────────────────────────────────────────

/**
 * GET /
 * Check if the backend is alive.
 * @returns {Promise<{message: string}>}
 */
export const checkHealth = () => apiClient.get('/').then((r) => r.data);

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} QueryResponse
 * @property {string} thread_id
 * @property {string} query                   - The user's original request
 * @property {string|null} intent             - "read" | "write" | etc.
 * @property {string|null} generated_sql
 * @property {string[]} risk_flags
 * @property {number|null} estimated_rows_affected
 * @property {string|null} ask_questions      - Clarifying question from backend
 * @property {string|null} human_decision
 * @property {string|null} workflow_status
 */

/**
 * POST /query
 * Submit a natural-language request.
 * @param {string} request
 * @returns {Promise<QueryResponse>}
 */
export const submitQuery = (request) =>
  apiClient.post('/query', { request }).then((r) => r.data);

// ─── Approve ──────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ApproveResponse
 * @property {string} thread_id
 * @property {string} human_decision
 * @property {string} workflow_status
 * @property {object|null} execution_result
 */

/**
 * POST /approve/{thread_id}
 * Approve and execute SQL for a thread.
 * @param {string} threadId
 * @returns {Promise<ApproveResponse>}
 */
export const approveQuery = (threadId) =>
  apiClient.post(`/approve/${threadId}`).then((r) => r.data);

// ─── Reject ───────────────────────────────────────────────────────────────────

/**
 * POST /reject/{thread_id}
 * Reject a pending query/clarification.
 * @param {string} threadId
 * @returns {Promise<{thread_id: string, human_decision: string, workflow_status: string}>}
 */
export const rejectQuery = (threadId) =>
  apiClient.post(`/reject/${threadId}`).then((r) => r.data);

// ─── Edit ─────────────────────────────────────────────────────────────────────

/**
 * POST /edit/{thread_id}
 * Submit an edited SQL for re-validation.
 * @param {string} threadId
 * @param {string} sql
 * @returns {Promise<QueryResponse>}
 */
export const editQuery = (threadId, sql) =>
  apiClient.post(`/edit/${threadId}`, { sql }).then((r) => r.data);

// ─── Clarify ──────────────────────────────────────────────────────────────────

/**
 * POST /clarify/{thread_id}
 * Provide a clarification answer to an ambiguous query.
 * @param {string} threadId
 * @param {string} answer
 * @returns {Promise<QueryResponse>}
 */
export const clarifyQuery = (threadId, answer) =>
  apiClient.post(`/clarify/${threadId}`, { answer }).then((r) => r.data);

// ─── Audit ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AuditLog
 * @property {number} id
 * @property {string} thread_id
 * @property {string} user_request
 * @property {string} intent
 * @property {string|null} generated_sql
 * @property {string} risk_flags          - JSON-encoded string array
 * @property {number|null} estimated_rows_affected
 * @property {string|null} human_decision
 * @property {string|null} execution_result - JSON-encoded object
 * @property {string} created_at
 */

/**
 * GET /audit
 * Fetch all audit log entries across all threads.
 * @returns {Promise<{logs: AuditLog[]}>}
 */
export const getAllAuditLogs = () =>
  apiClient.get('/audit').then((r) => r.data);

export const getAuditLogs = getAllAuditLogs;

/**
 * DELETE /audit
 * Clear all audit log records from the database.
 * @returns {Promise<{message: string}>}
 */
export const clearAuditLogs = () =>
  apiClient.delete('/audit').then((r) => r.data);

/**
 * GET /audit/{thread_id}
 * Fetch audit log entries for a given thread.
 * @param {string} threadId
 * @returns {Promise<{thread_id: string, logs: AuditLog[]}>}
 */
export const getAuditLog = (threadId) =>
  apiClient.get(`/audit/${threadId}`).then((r) => r.data);

// ─── Schema ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SchemaTable
 * @property {string} name
 * @property {Array<{name: string, type: string}>} columns
 */

/**
 * GET /schema
 * Fetch database table/column schema for the explorer.
 * @returns {Promise<{tables: SchemaTable[]}>}
 */
export const getSchema = () =>
  apiClient.get('/schema').then((r) => r.data);

export default apiClient;
