import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/** Explains the connection state whenever the socket isn't connected. */
export function ConnectionBanner({ connection, error }) {
  if (connection === 'connected') return null;

  let message = 'Connecting to chat…';
  if (connection === 'reconnecting') {
    message = 'Connection lost. Reconnecting… Messages you send will still be delivered.';
  } else if (connection === 'failed') {
    message = `Could not connect: ${error || 'unknown error'}`;
  }

  const isError = connection === 'failed';
  return (
    <View style={[styles.banner, isError && styles.error]}>
      <Text style={[styles.text, isError && styles.errorText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.warningBg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  text: { color: colors.warningText, fontSize: 13, textAlign: 'center' },
  error: { backgroundColor: colors.dangerBg },
  errorText: { color: colors.danger },
});
