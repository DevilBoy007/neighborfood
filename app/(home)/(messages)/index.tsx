import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMessage, useUser, ThreadData } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number } | undefined) => {
  if (!timestamp) return '';

  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export default function MessagesScreen() {
  const router = useRouter();
  const { userData } = useUser();
  const { threads, isLoadingThreads, loadThreads, setSelectedThread, removeThread } = useMessage();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userData?.uid) {
        loadThreads(userData.uid);
      }
    }, [userData?.uid, loadThreads])
  );

  const handleRefresh = async () => {
    if (!userData?.uid) return;
    setRefreshing(true);
    await loadThreads(userData.uid);
    setRefreshing(false);
  };

  const handleThreadPress = (thread: ThreadData) => {
    setSelectedThread(thread);
    router.push(`/(home)/(messages)/${thread.id}` as any);
  };

  const handleDeleteThread = (thread: ThreadData) => {
    const otherUserId = thread.participantIds.find((id) => id !== userData?.uid);
    const otherUsername = otherUserId
      ? thread.participantInfo[otherUserId]?.username || 'this user'
      : 'this user';

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete conversation with ${otherUsername}?`)) {
        removeThread(thread.id);
      }
    } else {
      Alert.alert(
        'Delete Conversation',
        `Are you sure you want to delete your conversation with ${otherUsername}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeThread(thread.id),
          },
        ]
      );
    }
  };

  const renderThreadItem = ({ item }: { item: ThreadData }) => {
    const otherUserId = item.participantIds.find((id) => id !== userData?.uid);
    const otherUserInfo = otherUserId ? item.participantInfo[otherUserId] : null;

    return (
      <TouchableOpacity
        style={[styles.threadItem, { borderBottomColor: colors.divider }]}
        onPress={() => handleThreadPress(item)}
        onLongPress={() => handleDeleteThread(item)}
      >
        <View style={styles.avatarContainer}>
          {otherUserInfo?.photoURL ? (
            <Image source={{ uri: otherUserInfo.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
                {(otherUserInfo?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {otherUserInfo?.username || 'Unknown User'}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {formatTimestamp(item.lastMessage?.createdAt || item.updatedAt)}
            </Text>
          </View>
          <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.type === 'order'
              ? '📦 New order'
              : item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteThread(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={colors.iconMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Messages Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Start a conversation by placing an order or messaging a shop owner!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS !== 'web' && (
        <View style={{ height: insets.top, backgroundColor: colors.navBackground }} />
      )}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.navBackground, borderBottomColor: colors.border },
          Platform.OS !== 'web' && styles.headerMobile,
        ]}
      >
        {Platform.OS === 'web' ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={40} color={colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.buttonText }]}>Messages</Text>
            <View style={styles.headerSpacer} />
          </>
        ) : (
          <>
            <View style={styles.headerSpacer} />
            <View style={styles.headerRightGroup}>
              <Text style={[styles.headerTitle, { color: colors.buttonText }]}>Messages</Text>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {isLoadingThreads && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading conversations...
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThreadItem}
          contentContainerStyle={threads.length === 0 ? styles.emptyListContainer : undefined}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#87CEFA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 60 : 30,
    fontFamily: 'TitanOne',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'TextMeOne',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: Platform.OS === 'web' ? 40 : 25,
    color: '#333',
    marginTop: 20,
    fontFamily: 'TitanOne',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'TextMeOne',
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#87CEFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
    fontFamily: 'TextMeOne',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'TextMeOne',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'TextMeOne',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerMobile: {
    justifyContent: 'flex-end',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
