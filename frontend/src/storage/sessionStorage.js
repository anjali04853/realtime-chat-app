import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_KEY = 'chat:username';

// Storage failures are non-fatal: the user simply has to log in again.
export const sessionStorage = {
  async getUsername() {
    try {
      return await AsyncStorage.getItem(USERNAME_KEY);
    } catch {
      return null;
    }
  },
  async setUsername(username) {
    try {
      await AsyncStorage.setItem(USERNAME_KEY, username);
    } catch {
      // ignore
    }
  },
  async clear() {
    try {
      await AsyncStorage.removeItem(USERNAME_KEY);
    } catch {
      // ignore
    }
  },
};
