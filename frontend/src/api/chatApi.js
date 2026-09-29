import { request } from './httpClient';

export const chatApi = {
  login: (username) => request('/api/auth/login', { method: 'POST', body: { username } }),

  fetchMessages: ({ limit, before } = {}) => {
    const params = [];
    if (limit) params.push(`limit=${limit}`);
    if (before) params.push(`before=${encodeURIComponent(before)}`);
    return request(`/api/messages${params.length ? `?${params.join('&')}` : ''}`);
  },

  sendMessage: ({ username, text, clientId }) =>
    request('/api/messages', { method: 'POST', body: { username, text, clientId } }),

  fetchUsers: () => request('/api/users'),
};
