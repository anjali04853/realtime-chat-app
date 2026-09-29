import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

const describe = (names) => {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names.length} people are typing…`;
};

export function TypingIndicator({ usernames }) {
  // Fixed height so the list doesn't jump when someone starts typing.
  return (
    <View style={styles.container}>
      {usernames.length > 0 && <Text style={styles.text}>{describe(usernames)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 20, justifyContent: 'center', paddingHorizontal: spacing.lg },
  text: { fontSize: 12, fontStyle: 'italic', color: colors.textMuted },
});
