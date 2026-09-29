import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { formatDayLabel } from '../utils/time';

export function DateSeparator({ date }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{formatDayLabel(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: spacing.md },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
