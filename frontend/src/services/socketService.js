import { io } from 'socket.io-client';
import { API_URL } from '../config';

/** Creates a socket authenticated with the given username (dummy auth). */
export function createChatSocket(username) {
  return io(API_URL, {
    auth: { username },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}
