import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { formatLastSeen } from '../utils/time';
import { Avatar } from './Avatar';

/** Horizontal list of users with online/offline status. */
export function OnlineUsersBar({ users, currentUser }) {
  if (!users.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {users.map((user) => (
          <View key={user.username} style={styles.user}>
            <Avatar username={user.username} size={30} online={user.online} />
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {user.username === currentUser ? `${user.username} (you)` : user.username}
              </Text>
              <Text style={[styles.status, user.online && styles.online]} numberOfLines={1}>
                {user.online ? 'online' : formatLastSeen(user.lastSeen)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  content: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md },
  user: { flexDirection: 'row', alignItems: 'center', maxWidth: 170 },
  text: { marginLeft: spacing.sm, flexShrink: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text },
  status: { fontSize: 11, color: colors.textMuted },
  online: { color: colors.online },
});
