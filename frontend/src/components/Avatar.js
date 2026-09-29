import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const PALETTE = ['#F97316', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899', '#EAB308', '#14B8A6', '#6366F1'];

const colorFor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export function Avatar({ username, size = 36, online }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(username) },
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{username.charAt(0).toUpperCase()}</Text>
      </View>
      {online !== undefined && (
        <View style={[styles.dot, { backgroundColor: online ? colors.online : colors.offline }]} />
      )}
    </View>
  );
}

export { colorFor };

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
