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

import { SafeView } from '@/components/SafeView';
import { useMessage, useUser, MessageData, ThreadData } from '@/store/reduxHooks';

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
  isSentByMe,
}: {
  orderData: MessageData['orderData'];
  isSentByMe: boolean;
}) => {
  if (!orderData) return null;

  return (
    <View style={[styles.orderBubble, isSentByMe && styles.orderBubbleSent]}>
      <View style={styles.orderHeader}>
        <Ionicons name="receipt-outline" size={20} color="#333" />
        <Text style={styles.orderTitle}>Order</Text>
      </View>
      {orderData.shopPhotoURL && (
        <Image source={{ uri: orderData.shopPhotoURL }} style={styles.orderImage} />
      )}
      <Text style={styles.orderShopName}>{orderData.shopName}</Text>
      <View style={styles.orderItems}>
        {orderData.items?.slice(0, 3).map((item, index) => (
          <Text key={index} style={styles.orderItem}>
            {item.quantity}x {item.name} - ${item.price.toFixed(2)}
          </Text>
        ))}
        {orderData.items && orderData.items.length > 3 && (
          <Text style={styles.orderItemMore}>+{orderData.items.length - 3} more items</Text>
        )}
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${orderData.total?.toFixed(2)}</Text>
        <View
          style={[
            styles.orderStatusBadge,
            { backgroundColor: getStatusColor(orderData.status || 'pending') },
          ]}
        >
          <Text style={styles.orderStatusText}>
            {orderData.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#ffc107';
    case 'preparing':
      return '#17a2b8';
    case 'ready':
      return '#28a745';
    case 'in-delivery':
      return '#007bff';
    case 'completed':
      return '#6c757d';
    case 'cancelled':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

export default function MessageThreadScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { userData } = useUser();
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
            <Text style={styles.dateSeparatorText}>{formatMessageDate(item.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isSentByMe ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          {item.type === 'order' ? (
            <OrderMessageBubble orderData={item.orderData} isSentByMe={isSentByMe} />
          ) : (
            <View
              style={[styles.messageBubble, isSentByMe ? styles.sentBubble : styles.receivedBubble]}
            >
              <Text style={[styles.messageText, isSentByMe && styles.sentMessageText]}>
                {item.content}
              </Text>
            </View>
          )}
          <Text style={[styles.messageTime, isSentByMe && styles.sentMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyMessagesContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
      <Text style={styles.emptyMessagesText}>Start the conversation!</Text>
    </View>
  );

  return (
    <SafeView>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {otherUserInfo?.photoURL ? (
              <Image source={{ uri: otherUserInfo.photoURL }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarText}>
                  {(otherUserInfo?.username || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {otherUserInfo?.username || 'Unknown User'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages List */}
        {isLoadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#87CEFA" />
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSendingMessage) && styles.sendButtonDisabled,
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
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#87CEFA',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    fontFamily: 'TextMeOne',
  },
  headerSpacer: {
    width: 40,
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
    fontSize: 12,
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
    fontSize: 16,
    color: '#333',
    fontFamily: 'TextMeOne',
  },
  sentMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    fontFamily: 'TextMeOne',
  },
  orderImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  orderShopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'TextMeOne',
  },
  orderItems: {
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'TextMeOne',
  },
  orderItemMore: {
    fontSize: 12,
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
    fontSize: 15,
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
    fontSize: 10,
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
    fontSize: 16,
    maxHeight: 100,
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
