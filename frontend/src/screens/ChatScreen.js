import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CenteredState } from '../components/CenteredState';
import { ChatHeader } from '../components/ChatHeader';
import { ConnectionBanner } from '../components/ConnectionBanner';
import { DateSeparator } from '../components/DateSeparator';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { OnlineUsersBar } from '../components/OnlineUsersBar';
import { TypingIndicator } from '../components/TypingIndicator';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { colors, spacing } from '../theme';
import { isSameDay } from '../utils/time';

export function ChatScreen() {
  const { username, logout } = useAuth();
  const chat = useChat(username);

  // The list is inverted (newest at the bottom, anchored while new messages arrive),
  // so it needs the newest message first.
  const listData = useMemo(() => [...chat.messages].reverse(), [chat.messages]);
  const onlineCount = chat.users.filter((u) => u.online).length;

  const { retryMessage } = chat;
  const renderItem = useCallback(
    ({ item, index }) => {
      const older = listData[index + 1];
      const startsNewDay = !older || !isSameDay(older.createdAt, item.createdAt);
      const showSender = startsNewDay || older.username !== item.username;
      return (
        <View>
          {startsNewDay && <DateSeparator date={item.createdAt} />}
          <MessageBubble
            message={item}
            isMine={item.username === username}
            showSender={showSender}
            onRetry={retryMessage}
          />
        </View>
      );
    },
    [listData, username, retryMessage],
  );

  const renderListFooter = () => {
    // Rendered at the top because the list is inverted.
    if (chat.loadingOlder) return <ActivityIndicator style={styles.olderSpinner} color={colors.primary} />;
    if (chat.olderError) {
      return (
        <Text style={styles.olderError} onPress={chat.loadOlder}>
          Couldn’t load older messages. Tap to retry.
        </Text>
      );
    }
    return null;
  };

  const renderBody = () => {
    if (chat.historyStatus === 'loading') {
      return <CenteredState loading message="Loading messages…" />;
    }
    if (chat.historyStatus === 'error') {
      return (
        <CenteredState
          title="Couldn’t load messages"
          message={chat.historyError}
          actionLabel="Try again"
          onAction={() => chat.reloadHistory({ initial: true })}
        />
      );
    }
    if (!chat.messages.length) {
      return <CenteredState title="No messages yet" message="Say hi 👋 to start the conversation" />;
    }
    return (
      <FlatList
        inverted
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={chat.loadOlder}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ChatHeader username={username} onlineCount={onlineCount} connection={chat.connection} onLogout={logout} />
      <OnlineUsersBar users={chat.users} currentUser={username} />
      <ConnectionBanner connection={chat.connection} error={chat.connectionError} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.flex}>{renderBody()}</View>
        <TypingIndicator usernames={chat.typingUsers} />
        <SafeAreaView edges={['bottom']} style={styles.inputArea}>
          <MessageInput onSend={chat.sendMessage} onTyping={chat.notifyTyping} onStopTyping={chat.stopTyping} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingVertical: spacing.sm },
  inputArea: { backgroundColor: colors.surface },
  olderSpinner: { marginVertical: spacing.md },
  olderError: { textAlign: 'center', color: colors.danger, marginVertical: spacing.md, fontSize: 13 },
});
