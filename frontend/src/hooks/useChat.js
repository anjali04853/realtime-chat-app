import { useCallback, useEffect, useReducer, useRef } from 'react';
import { chatApi } from '../api/chatApi';
import { HISTORY_PAGE_SIZE, SOCKET_ACK_TIMEOUT_MS, TYPING_IDLE_MS } from '../config';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { createChatSocket } from '../services/socketService';
import { createClientId, createPendingMessage } from '../utils/messages';
import { chatReducer, initialChatState } from './chatReducer';
import { useAppActive } from './useAppActive';

// Re-announce typing periodically so the server's auto-expiry doesn't clear it mid-sentence.
const TYPING_REFRESH_MS = 3000;

const friendlySendError = (err) =>
  err?.message === 'operation has timed out' ? 'Server did not respond' : err?.message || 'Failed to send';

/**
 * All chat state and behaviour: history (REST), real-time updates (Socket.io),
 * optimistic sending with REST fallback, typing, presence and read receipts.
 */
export function useChat(username) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const socketRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const receiptsSentRef = useRef({ delivered: new Set(), read: new Set() });
  const typingRef = useRef({ active: false, lastEmit: 0, timer: null });
  const appActive = useAppActive();

  // ---- History -------------------------------------------------------------

  const loadLatest = useCallback(async ({ initial = false } = {}) => {
    dispatch({ type: 'HISTORY_REQUEST' });
    try {
      const data = await chatApi.fetchMessages({ limit: HISTORY_PAGE_SIZE });
      dispatch({ type: 'HISTORY_SUCCESS', messages: data.messages, hasMore: data.hasMore, initial });
    } catch (err) {
      dispatch({ type: 'HISTORY_FAILURE', error: err.message });
    }
  }, []);

  const oldestServerMessage = state.messages.find((m) => !m.localStatus);

  const loadOlder = useCallback(async () => {
    if (!state.hasMore || loadingOlderRef.current || !oldestServerMessage) return;
    loadingOlderRef.current = true;
    dispatch({ type: 'OLDER_REQUEST' });
    try {
      const data = await chatApi.fetchMessages({
        limit: HISTORY_PAGE_SIZE,
        before: oldestServerMessage.createdAt,
      });
      dispatch({ type: 'OLDER_SUCCESS', messages: data.messages, hasMore: data.hasMore });
    } catch (err) {
      dispatch({ type: 'OLDER_FAILURE', error: err.message });
    } finally {
      loadingOlderRef.current = false;
    }
  }, [state.hasMore, oldestServerMessage]);

  useEffect(() => {
    loadLatest({ initial: true });
  }, [loadLatest]);

  // ---- Socket lifecycle ----------------------------------------------------

  useEffect(() => {
    const socket = createChatSocket(username);
    socketRef.current = socket;
    let connectedBefore = false;

    socket.on('connect', () => {
      dispatch({ type: 'CONNECTION', status: 'connected' });
      // After a reconnect, fetch anything we missed while offline.
      if (connectedBefore) loadLatest();
      connectedBefore = true;
    });

    socket.on('disconnect', (reason) => {
      dispatch({ type: 'CONNECTION', status: 'reconnecting' });
      // The client only auto-reconnects for network issues, not server-initiated disconnects.
      if (reason === 'io server disconnect') socket.connect();
    });

    socket.on('connect_error', (err) => {
      // socket.active is false when the server rejected the connection (e.g. invalid username).
      dispatch({
        type: 'CONNECTION',
        status: socket.active ? 'reconnecting' : 'failed',
        error: err.message,
      });
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (message) => dispatch({ type: 'MESSAGE_UPSERT', message }));
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS, (updates) => dispatch({ type: 'MESSAGE_STATUS', updates }));
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (users) => dispatch({ type: 'PRESENCE', users }));
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, (usernames) =>
      dispatch({ type: 'TYPING', usernames: usernames.filter((name) => name !== username) }),
    );

    const typing = typingRef.current;
    return () => {
      clearTimeout(typing.timer);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [username, loadLatest]);

  // ---- Delivered / read receipts ------------------------------------------

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || state.connection !== 'connected') return;

    const sent = receiptsSentRef.current;
    const incoming = state.messages.filter((m) => m.username !== username && !m.localStatus);

    // Visible chat => read; app in background => only delivered.
    const [field, sentSet, event] = appActive
      ? ['readBy', sent.read, SOCKET_EVENTS.MESSAGE_READ]
      : ['deliveredTo', sent.delivered, SOCKET_EVENTS.MESSAGE_DELIVERED];

    const ids = incoming.filter((m) => !m[field].includes(username) && !sentSet.has(m.id)).map((m) => m.id);
    if (!ids.length) return;
    ids.forEach((id) => sentSet.add(id));
    socket.emit(event, { ids });
  }, [state.messages, state.connection, appActive, username]);

  // ---- Sending -------------------------------------------------------------

  const deliver = useCallback(
    async (text, clientId) => {
      const socket = socketRef.current;
      try {
        let message;
        if (socket?.connected) {
          const res = await socket.timeout(SOCKET_ACK_TIMEOUT_MS).emitWithAck(SOCKET_EVENTS.MESSAGE_SEND, {
            text,
            clientId,
          });
          if (!res.ok) throw new Error(res.error);
          message = res.message;
        } else {
          // Socket is down: fall back to the REST API. The server still broadcasts it.
          ({ message } = await chatApi.sendMessage({ username, text, clientId }));
        }
        dispatch({ type: 'MESSAGE_UPSERT', message });
      } catch (err) {
        dispatch({ type: 'MESSAGE_FAILED', clientId, error: friendlySendError(err) });
      }
    },
    [username],
  );

  const stopTyping = useCallback(() => {
    const typing = typingRef.current;
    clearTimeout(typing.timer);
    if (typing.active) socketRef.current?.emit(SOCKET_EVENTS.TYPING_STOP);
    typing.active = false;
  }, []);

  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    const typing = typingRef.current;
    const now = Date.now();
    if (!typing.active || now - typing.lastEmit > TYPING_REFRESH_MS) {
      socket.emit(SOCKET_EVENTS.TYPING_START);
      typing.lastEmit = now;
    }
    typing.active = true;
    clearTimeout(typing.timer);
    typing.timer = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [stopTyping]);

  const sendMessage = useCallback(
    (rawText) => {
      const text = rawText.trim();
      if (!text) return;
      // The server clears typing on send; just reset local state.
      clearTimeout(typingRef.current.timer);
      typingRef.current.active = false;

      const clientId = createClientId();
      dispatch({ type: 'MESSAGE_PENDING', message: createPendingMessage({ username, text, clientId }) });
      deliver(text, clientId);
    },
    [deliver, username],
  );

  // Retries reuse the clientId, so the server never stores a duplicate.
  const retryMessage = useCallback(
    (message) => {
      dispatch({ type: 'MESSAGE_RETRY', clientId: message.clientId });
      deliver(message.text, message.clientId);
    },
    [deliver],
  );

  return {
    ...state,
    sendMessage,
    retryMessage,
    loadOlder,
    reloadHistory: loadLatest,
    notifyTyping,
    stopTyping,
  };
}
