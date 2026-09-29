import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/** Full-area loading / error / empty placeholder. */
export function CenteredState({ loading, title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color={colors.primary} />}
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: 20,
  },
  buttonText: { color: colors.primaryText, fontWeight: '600' },
});
