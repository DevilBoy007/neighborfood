import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMessage, useUser, useOrder, MessageData, ThreadData } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';
import { useAppColors } from '@/hooks/useAppColors';
import { useOrderStatus } from '@/hooks/useOrderStatus';

const formatMessageTime = (timestamp: { seconds: number; nanoseconds: number } | undefined) => {
  if (!timestamp) return '';

  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMessageDate = (timestamp: { seconds: number; nanoseconds: number } | undefined) => {
  if (!timestamp) return '';

  const date = new Date(timestamp.seconds * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }
};

// Component to render order messages
const OrderMessageBubble = ({
  orderData,
  orderId,
  isSentByMe,
  colors,
}: {
  orderData: MessageData['orderData'];
  orderId?: string;
  isSentByMe: boolean;
  colors: any;
}) => {
  const { allOrders } = useOrder();
  const { getStatusColor } = useOrderStatus();

  if (!orderData) return null;

  // Try to get the live order from Redux store
  const liveOrder = orderId ? allOrders.find((order) => order.id === orderId) : null;

  // Use live order status if available, otherwise fall back to static order data
  const currentStatus = liveOrder?.status || orderData.status || 'pending';

  return (
    <View
      style={[
        styles.orderBubble,
        { backgroundColor: colors.surface },
        isSentByMe && { backgroundColor: colors.card },
      ]}
    >
      <View style={styles.orderHeader}>
        <Ionicons name="receipt-outline" size={20} color={colors.icon} />
        <Text style={[styles.orderTitle, { color: colors.text }]}>Order</Text>
      </View>
      {orderData.shopPhotoURL && (
        <Image
          source={{ uri: orderData.shopPhotoURL }}
          style={styles.orderImage}
          resizeMode="cover"
        />
      )}
      <Text style={[styles.orderShopName, { color: colors.text }]}>{orderData.shopName}</Text>
      <View style={styles.orderItems}>
        {orderData.items?.slice(0, 3).map((item, index) => (
          <Text key={index} style={[styles.orderItem, { color: colors.textSecondary }]}>
            {item.quantity}x {item.name} - ${item.price.toFixed(2)}
          </Text>
        ))}
        {orderData.items && orderData.items.length > 3 && (
          <Text style={[styles.orderItemMore, { color: colors.textMuted }]}>
            +{orderData.items.length - 3} more items
          </Text>
        )}
      </View>
      <View style={[styles.orderFooter, { borderTopColor: colors.divider }]}>
        <Text style={[styles.orderTotal, { color: colors.text }]}>
          Total: ${orderData.total?.toFixed(2)}
        </Text>
        <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
          <Text style={styles.orderStatusText}>
            {currentStatus.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function MessageThreadScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { userData } = useUser();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const {
    selectedThread,
    messages,
    isLoadingMessages,
    isSendingMessage,
    loadMessages,
    sendMessage,
    markAsRead,
    setSelectedThread,
  } = useMessage();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Get the other participant's info
  const otherUserId = selectedThread?.participantIds.find((id) => id !== userData?.uid);
  const otherUserInfo = otherUserId ? selectedThread?.participantInfo[otherUserId] : null;

  useFocusEffect(
    useCallback(() => {
      if (threadId) {
        loadMessages(threadId);
        markAsRead(threadId);
      }
    }, [threadId, loadMessages, markAsRead])
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !threadId) return;

    const messageContent = inputText.trim();
    setInputText('');

    await sendMessage(threadId, {
      type: 'text',
      content: messageContent,
    });

    // Send push notification to the other participant
    if (otherUserId && userData) {
      try {
        await firebaseService.sendMessageNotification(
          threadId,
          otherUserId,
          userData.displayName || userData.first || 'Someone',
          messageContent,
          'text'
        );
      } catch (error) {
        // Don't fail the message send if notification fails
        console.warn('Failed to send push notification:', error);
      }
    }

    // Reload messages after sending
    loadMessages(threadId);
  };

  const shouldShowDateSeparator = (
    currentMessage: MessageData,
    previousMessage: MessageData | null
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt?.seconds * 1000).toDateString();
    const previousDate = new Date(previousMessage.createdAt?.seconds * 1000).toDateString();

    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }: { item: MessageData; index: number }) => {
    const isSentByMe = item.senderId === userData?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateSeparatorText, { backgroundColor: colors.divider }]}>
              {formatMessageDate(item.createdAt)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isSentByMe ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          {item.type === 'order' ? (
            <OrderMessageBubble
              orderData={item.orderData}
              orderId={item.orderId}
              isSentByMe={isSentByMe}
              colors={colors}
            />
          ) : (
            <View
              style={[
                styles.messageBubble,
                isSentByMe
                  ? [styles.sentBubble, { backgroundColor: colors.primary }]
                  : [styles.receivedBubble, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: colors.text },
                  isSentByMe && { color: colors.buttonText },
                ]}
              >
                {item.content}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.messageTime,
              {
                color: colors.textMuted === '#78716C' ? '#fffffff0' : colors.textMuted,
              },
              isSentByMe && styles.sentMessageTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color={colors.iconMuted} />
      <Text style={[styles.emptyMessagesText, { color: colors.textMuted }]}>
        Start the conversation!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS !== 'web' && (
        <View style={{ height: insets.top, backgroundColor: colors.navBackground }} />
      )}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.navBackground, borderBottomColor: colors.border },
            styles.headerMobile,
          ]}
        >
          <View style={styles.headerAvatarContainer}>
            {otherUserInfo?.photoURL ? (
              <Image source={{ uri: otherUserInfo.photoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Text style={[styles.headerAvatarText, { color: colors.primary }]}>
                  {(otherUserInfo?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {otherUserInfo?.username || 'Unknown User'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Use replace instead of back to handle cases where there's no navigation history
              router.replace('/(home)/(messages)' as any);
            }}
          >
            <Ionicons
              name="chevron-back"
              size={Platform.OS === 'web' ? 40 : 24}
              color={colors.icon}
            />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyMessagesList,
            ]}
            ListEmptyComponent={renderEmptyMessages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS !== 'web' ? 100 : 10,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.inputBackground, color: colors.text },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!inputText.trim() || isSendingMessage) && [
                styles.sendButtonDisabled,
                { backgroundColor: colors.buttonDisabled },
              ],
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS !== 'web' ? 20 : 10,
    backgroundColor: '#87CEFA',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerMobile: {
    justifyContent: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
    marginLeft: 8,
  },
  headerAvatarContainer: {
    backgroundColor: '#ffffff3f',
    padding: 4,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: Platform.OS === 'web' ? '100%' : 200,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#87CEFA',
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 36 : 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    fontFamily: 'TextMeOne',
  },
  headerSpacer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyMessagesList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyMessagesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessagesText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    fontFamily: 'TextMeOne',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: Platform.OS === 'web' ? 18 : 12,
    color: '#999',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'TextMeOne',
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  sentBubble: {
    backgroundColor: '#87CEFA',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: Platform.OS === 'web' ? 24 : 16,
    color: '#333',
    fontFamily: 'TextMeOne',
  },
  sentMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: Platform.OS === 'web' ? 18 : 11,
    color: '#999',
    marginTop: 4,
    fontFamily: 'TextMeOne',
  },
  sentMessageTime: {
    marginRight: 4,
  },
  orderBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderBubbleSent: {
    backgroundColor: '#e8f4fd',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: Platform.OS === 'web' ? 28 : 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    fontFamily: 'TextMeOne',
  },
  orderImage: {
    alignSelf: 'stretch',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  orderShopName: {
    fontSize: Platform.OS === 'web' ? 32 : 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'TextMeOne',
  },
  orderItems: {
    marginBottom: 8,
  },
  orderItem: {
    fontSize: Platform.OS === 'web' ? 26 : 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'TextMeOne',
  },
  orderItemMore: {
    fontSize: Platform.OS === 'web' ? 16 : 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'TextMeOne',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  orderTotal: {
    fontSize: Platform.OS === 'web' ? 28 : 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'TextMeOne',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: Platform.OS === 'web' ? 18 : 10,
    fontWeight: '600',
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: Platform.OS === 'web' ? 30 : 16,
    maxHeight: Platform.OS === 'web' ? 100 : 100,
    fontFamily: 'TextMeOne',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#87CEFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
