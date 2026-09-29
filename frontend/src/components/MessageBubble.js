import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { getOwnMessageStatus } from '../utils/messages';
import { formatTime } from '../utils/time';
import { colorFor } from './Avatar';
import { StatusTicks } from './StatusTicks';

/**
 * One chat message. Tap your own message to see who it was delivered to / read by;
 * tap a failed message to retry.
 */
function MessageBubbleComponent({ message, isMine, showSender, onRetry }) {
  const [showDetails, setShowDetails] = useState(false);
  const status = isMine ? getOwnMessageStatus(message) : null;

  const handlePress = () => {
    if (status === 'failed') onRetry(message);
    else if (isMine) setShowDetails((v) => !v);
  };

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther, showSender && styles.groupStart]}>
      <Pressable
        onPress={handlePress}
        disabled={!isMine}
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
      >
        {showSender && !isMine && (
          <Text style={[styles.sender, { color: colorFor(message.username) }]}>{message.username}</Text>
        )}
        <Text style={[styles.text, isMine && styles.textMine]}>{message.text}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isMine && styles.timeMine]}>{formatTime(message.createdAt)}</Text>
          {isMine && <StatusTicks status={status} />}
        </View>
      </Pressable>

      {status === 'failed' && (
        <Text style={styles.failedText}>{message.error || 'Not sent'} · Tap to retry</Text>
      )}
      {showDetails && status !== 'failed' && (
        <Text style={styles.details}>
          {message.readBy.length
            ? `Read by ${message.readBy.join(', ')}`
            : message.deliveredTo.length
              ? `Delivered to ${message.deliveredTo.join(', ')}`
              : 'Not delivered yet'}
        </Text>
      )}
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, marginTop: 2, maxWidth: '100%' },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  groupStart: { marginTop: spacing.sm },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleMine: { backgroundColor: colors.bubbleMine, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.bubbleOther, borderBottomLeftRadius: 4 },
  sender: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20, color: colors.text },
  textMine: { color: colors.primaryText },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  time: { fontSize: 11, color: colors.textMuted },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  failedText: { fontSize: 12, color: colors.danger, marginTop: 2 },
  details: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
