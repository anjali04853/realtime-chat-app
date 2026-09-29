import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_MESSAGE_LENGTH } from '../config';
import { colors, spacing } from '../theme';

export function MessageInput({ onSend, onTyping, onStopTyping }) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const handleChange = (value) => {
    setText(value);
    if (value.trim()) onTyping();
    else onStopTyping();
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  // On web, Enter sends and Shift+Enter inserts a newline.
  const handleKeyPress = (e) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        onBlur={onStopTyping}
        placeholder="Type a message"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        accessibilityLabel="Message"
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={({ pressed }) => [styles.send, !canSend && styles.sendDisabled, pressed && styles.pressed]}
      >
        <Text style={styles.sendText}>➤</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    borderRadius: 21,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.offline },
  pressed: { opacity: 0.8 },
  sendText: { color: colors.primaryText, fontSize: 18, marginLeft: 2 },
});
