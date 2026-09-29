import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** True while the app is in the foreground (or the browser tab is visible on web). */
export function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    return () => subscription.remove();
  }, []);

  return active;
}
