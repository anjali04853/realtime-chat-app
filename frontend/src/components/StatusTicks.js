import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

const SYMBOLS = {
  sending: '🕓',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
  failed: '!',
};

const LABELS = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed to send',
};

export function StatusTicks({ status }) {
  return (
    <Text
      accessibilityLabel={LABELS[status]}
      style={[styles.base, status === 'read' && styles.read, status === 'failed' && styles.failed]}
    >
      {SYMBOLS[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginLeft: 4, fontWeight: '700' },
  read: { color: colors.read },
  failed: { color: '#FECACA' },
});
