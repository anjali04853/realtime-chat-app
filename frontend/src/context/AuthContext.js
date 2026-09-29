import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { chatApi } from '../api/chatApi';
import { sessionStorage } from '../storage/sessionStorage';

const AuthContext = createContext(null);

/** Dummy username-based auth. The username is persisted so a refresh keeps you logged in. */
export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    sessionStorage.getUsername().then((saved) => {
      if (saved) setUsername(saved);
      setRestoring(false);
    });
  }, []);

  const login = useCallback(async (rawUsername) => {
    const { user } = await chatApi.login(rawUsername.trim());
    await sessionStorage.setUsername(user.username);
    setUsername(user.username);
  }, []);

  const logout = useCallback(async () => {
    await sessionStorage.clear();
    setUsername(null);
  }, []);

  const value = useMemo(() => ({ username, restoring, login, logout }), [username, restoring, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
