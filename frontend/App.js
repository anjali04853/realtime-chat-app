import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CenteredState } from './src/components/CenteredState';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { LoginScreen } from './src/screens/LoginScreen';

function Root() {
  const { username, restoring } = useAuth();
  if (restoring) return <CenteredState loading />;
  // Keyed by username so logging in as someone else starts a fresh chat session.
  return username ? <ChatScreen key={username} /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
