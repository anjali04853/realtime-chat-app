import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

// Same rules as the backend, checked locally for instant feedback.
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{2,20}$/;

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!USERNAME_PATTERN.test(trimmed)) {
      setError('Use 2-20 characters: letters, numbers, "_", "." or "-"');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(trimmed);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.logo}>💬</Text>
          <Text style={styles.title}>Welcome to Chat</Text>
          <Text style={styles.subtitle}>Pick a username to join the conversation</Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              if (error) setError(null);
            }}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            maxLength={20}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            editable={!submitting}
            accessibilityLabel="Username"
          />
          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.buttonText}>Join chat</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logo: { fontSize: 44, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  input: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
});
