import Constants from 'expo-constants';

/**
 * Resolves the backend URL:
 * 1. EXPO_PUBLIC_API_URL from .env (required for production/APK builds)
 * 2. In development, the IP of the machine running the Expo dev server, so a
 *    physical device on the same Wi-Fi can reach the local backend
 * 3. localhost as a last resort (web / iOS simulator)
 */
const DEV_BACKEND_PORT = 4000;

function devServerHost() {
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  return hostUri ? hostUri.split(':')[0] : null;
}

const envUrl = process.env.EXPO_PUBLIC_API_URL;
const host = devServerHost();

export const API_URL = (envUrl || `http://${host || 'localhost'}:${DEV_BACKEND_PORT}`).replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = 10000;
export const SOCKET_ACK_TIMEOUT_MS = 8000;
export const TYPING_IDLE_MS = 2000;
export const HISTORY_PAGE_SIZE = 30;
export const MAX_MESSAGE_LENGTH = 1000;
