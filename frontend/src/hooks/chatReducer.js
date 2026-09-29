import { mergeMessages } from '../utils/messages';

export const initialChatState = {
  messages: [], // chronological (oldest first)
  hasMore: false,
  historyStatus: 'loading', // 'loading' | 'ready' | 'error'
  historyError: null,
  loadingOlder: false,
  olderError: null,
  connection: 'connecting', // 'connecting' | 'connected' | 'reconnecting' | 'failed'
  connectionError: null,
  users: [],
  typingUsers: [],
};

const updateByClientId = (messages, clientId, patch) =>
  messages.map((m) => (m.localStatus && m.clientId === clientId ? { ...m, ...patch } : m));

export function chatReducer(state, action) {
  switch (action.type) {
    case 'HISTORY_REQUEST':
      return {
        ...state,
        historyStatus: state.messages.length ? state.historyStatus : 'loading',
        historyError: null,
      };
    case 'HISTORY_SUCCESS':
      return {
        ...state,
        historyStatus: 'ready',
        messages: mergeMessages(state.messages, action.messages),
        // A resync after reconnecting only fetches the latest page; keep pagination state.
        hasMore: action.initial ? action.hasMore : state.hasMore,
      };
    case 'HISTORY_FAILURE':
      return {
        ...state,
        historyStatus: state.messages.length ? 'ready' : 'error',
        historyError: action.error,
      };

    case 'OLDER_REQUEST':
      return { ...state, loadingOlder: true, olderError: null };
    case 'OLDER_SUCCESS':
      return {
        ...state,
        loadingOlder: false,
        hasMore: action.hasMore,
        messages: mergeMessages(state.messages, action.messages),
      };
    case 'OLDER_FAILURE':
      return { ...state, loadingOlder: false, olderError: action.error };

    case 'MESSAGE_PENDING':
      return { ...state, messages: [...state.messages, action.message] };
    case 'MESSAGE_UPSERT':
      return { ...state, messages: mergeMessages(state.messages, [action.message]) };
    case 'MESSAGE_FAILED':
      return {
        ...state,
        messages: updateByClientId(state.messages, action.clientId, { localStatus: 'failed', error: action.error }),
      };
    case 'MESSAGE_RETRY':
      return {
        ...state,
        messages: updateByClientId(state.messages, action.clientId, { localStatus: 'sending', error: null }),
      };
    case 'MESSAGE_STATUS': {
      const updates = new Map(action.updates.map((u) => [u.id, u]));
      return {
        ...state,
        messages: state.messages.map((m) => {
          const update = updates.get(m.id);
          return update ? { ...m, deliveredTo: update.deliveredTo, readBy: update.readBy } : m;
        }),
      };
    }

    case 'CONNECTION':
      return { ...state, connection: action.status, connectionError: action.error || null };
    case 'PRESENCE':
      return { ...state, users: action.users };
    case 'TYPING':
      return { ...state, typingUsers: action.usernames };

    default:
      return state;
  }
}
