export const createClientId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Local placeholder shown immediately while a message is being sent. */
export const createPendingMessage = ({ username, text, clientId }) => ({
  id: `local-${clientId}`,
  clientId,
  username,
  text,
  createdAt: new Date().toISOString(),
  deliveredTo: [],
  readBy: [],
  localStatus: 'sending',
});

const clientKey = (m) => `${m.username}:${m.clientId}`;
const byCreatedAt = (a, b) => a.createdAt.localeCompare(b.createdAt);

/**
 * Merges incoming server messages into the list: replaces optimistic copies
 * (matched by clientId), de-duplicates by id and keeps chronological order.
 */
export function mergeMessages(existing, incoming) {
  if (!incoming.length) return existing;
  const incomingIds = new Set(incoming.map((m) => m.id));
  const incomingClientKeys = new Set(incoming.filter((m) => m.clientId).map(clientKey));

  const kept = existing.filter(
    (m) => !incomingIds.has(m.id) && !(m.localStatus && incomingClientKeys.has(clientKey(m))),
  );
  return [...kept, ...incoming].sort(byCreatedAt);
}

/** Delivery status of one of my own messages. */
export function getOwnMessageStatus(message) {
  if (message.localStatus) return message.localStatus; // 'sending' | 'failed'
  if (message.readBy?.length) return 'read';
  if (message.deliveredTo?.length) return 'delivered';
  return 'sent';
}
