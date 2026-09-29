import { useCallback, useReducer } from 'react';
import {
  submitQuery,
  approveQuery,
  rejectQuery,
  editQuery,
  clarifyQuery,
} from '../lib/api';

/**
 * @typedef {Object} WorkflowState
 * @property {'idle'|'loading'|'success'|'error'} status
 * @property {string} loadingMessage
 * @property {import('../lib/api').QueryResponse|null} queryResult
 * @property {import('../lib/api').ApproveResponse|null} approvalResult
 * @property {string|null} error
 * @property {boolean} isEditing
 * @property {string} editedSql
 * @property {string|null} editError
 */

/** @type {WorkflowState} */
const initialState = {
  status: 'idle',
  loadingMessage: '',
  queryResult: null,
  approvalResult: null,
  error: null,
  isEditing: false,
  editedSql: '',
  editError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', loadingMessage: action.message, error: null, editError: null };

    case 'QUERY_SUCCESS':
      return {
        ...state,
        status: 'success',
        queryResult: action.data,
        approvalResult: null,
        isEditing: false,
        editedSql: action.data.generated_sql || '',
        error: null,
      };

    case 'APPROVAL_SUCCESS':
      return {
        ...state,
        status: 'success',
        approvalResult: action.data,
        queryResult: { ...state.queryResult, human_decision: 'approved', workflow_status: 'completed' },
        error: null,
      };

    case 'REJECT_SUCCESS':
      return {
        ...state,
        status: 'success',
        queryResult: { ...state.queryResult, human_decision: 'rejected', workflow_status: 'rejected' },
        error: null,
      };

    case 'ERROR':
      return { ...state, status: 'error', error: action.message, loadingMessage: '' };

    case 'EDIT_ERROR':
      return { ...state, status: 'success', editError: action.message };

    case 'SET_EDITING':
      return {
        ...state,
        isEditing: action.value,
        editedSql: action.value ? (state.queryResult?.generated_sql || '') : state.editedSql,
        editError: null,
      };

    case 'SET_EDITED_SQL':
      return { ...state, editedSql: action.sql };

    case 'RESTORE_STATE':
      return {
        ...state,
        status: 'success',
        queryResult: action.data,
        approvalResult: action.data.human_decision === 'approved' ? { execution_result: action.data.execution_result } : null,
        isEditing: false,
        editedSql: action.data.generated_sql || '',
        error: null,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * useQueryWorkflow manages the full NL→SQL approval workflow state.
 */
export function useQueryWorkflow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /** Submit a natural-language query */
  const submit = useCallback(async (request) => {
    dispatch({ type: 'LOADING', message: 'Processing your request…' });
    try {
      const data = await submitQuery(request);
      dispatch({ type: 'QUERY_SUCCESS', data });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message || 'Failed to submit query.' });
    }
  }, []);

  /** Approve the generated SQL and execute */
  const approve = useCallback(async () => {
    if (!state.queryResult?.thread_id) return;
    dispatch({ type: 'LOADING', message: 'Executing approved SQL…' });
    try {
      const data = await approveQuery(state.queryResult.thread_id);
      dispatch({ type: 'APPROVAL_SUCCESS', data });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message || 'Approval failed.' });
    }
  }, [state.queryResult]);

  /** Reject the pending query */
  const reject = useCallback(async () => {
    if (!state.queryResult?.thread_id) return;
    dispatch({ type: 'LOADING', message: 'Rejecting query…' });
    try {
      await rejectQuery(state.queryResult.thread_id);
      dispatch({ type: 'REJECT_SUCCESS' });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message || 'Rejection failed.' });
    }
  }, [state.queryResult]);

  /** Submit edited SQL for re-validation */
  const submitEdit = useCallback(async () => {
    if (!state.queryResult?.thread_id) return;
    dispatch({ type: 'LOADING', message: 'Validating edited SQL…' });
    try {
      const data = await editQuery(state.queryResult.thread_id, state.editedSql);
      dispatch({ type: 'QUERY_SUCCESS', data });
    } catch (err) {
      dispatch({ type: 'EDIT_ERROR', message: err.message || 'Edit validation failed.' });
    }
  }, [state.queryResult, state.editedSql]);

  /** Provide clarification answer */
  const clarify = useCallback(async (answer) => {
    if (!state.queryResult?.thread_id) return;
    dispatch({ type: 'LOADING', message: 'Processing clarification…' });
    try {
      const data = await clarifyQuery(state.queryResult.thread_id, answer);
      dispatch({ type: 'QUERY_SUCCESS', data });
    } catch (err) {
      dispatch({ type: 'ERROR', message: err.message || 'Clarification failed.' });
    }
  }, [state.queryResult]);

  const startEditing = useCallback(() => dispatch({ type: 'SET_EDITING', value: true }), []);
  const cancelEditing = useCallback(() => dispatch({ type: 'SET_EDITING', value: false }), []);
  const setEditedSql = useCallback((sql) => dispatch({ type: 'SET_EDITED_SQL', sql }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const restoreState = useCallback((queryResult) => dispatch({ type: 'RESTORE_STATE', data: queryResult }), []);

  return {
    ...state,
    submit,
    approve,
    reject,
    submitEdit,
    clarify,
    startEditing,
    cancelEditing,
    setEditedSql,
    reset,
    restoreState,
  };
}
