import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { Avatar } from './Avatar';

const CONNECTION_LABELS = {
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  failed: 'Offline',
};

export function ChatHeader({ username, onlineCount, connection, onLogout }) {
  const subtitle =
    connection === 'connected' ? `${onlineCount} online` : CONNECTION_LABELS[connection] || connection;

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Group Chat</Text>
        <View style={styles.subtitleRow}>
          <View
            style={[styles.statusDot, { backgroundColor: connection === 'connected' ? colors.online : colors.offline }]}
          />
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.userBlock}>
        <Avatar username={username} size={32} />
        <Pressable
          onPress={onLogout}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  titleBlock: { flexShrink: 1 },
  title: { color: colors.primaryText, fontSize: 18, fontWeight: '700' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  subtitle: { color: '#E0E7FF', fontSize: 13 },
  userBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logout: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoutText: { color: colors.primaryText, fontWeight: '600', fontSize: 13 },
  pressed: { opacity: 0.7 },
});
