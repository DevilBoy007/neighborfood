import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import firebaseService from '@/handlers/firebaseService';
import { useAppColors } from '@/hooks/useAppColors';

type BlockedUser = { id: string; username: string; photoURL: string | null };

export default function BlockedUsers() {
  const colors = useAppColors();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setUsers(await firebaseService.getBlockedUsers());
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load blocked users' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unblock = async (user: BlockedUser) => {
    try {
      await firebaseService.unblockUser(user.id);
      setUsers((current) => current.filter((u) => u.id !== user.id));
      Toast.show({ type: 'success', text1: `Unblocked ${user.username}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not unblock user' });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={[styles.backText, { color: colors.text }]}>{'\u2039'} back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Blocked users</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(user) => user.id}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              You haven&apos;t blocked anyone.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface }]}>
              {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.inputBackground }]} />
              )}
              <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
              <TouchableOpacity
                style={[styles.unblock, { backgroundColor: colors.buttonPrimary }]}
                onPress={() => unblock(item)}
              >
                <Text style={[styles.unblockText, { color: colors.buttonText }]}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
  },
  back: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 20,
  },
  empty: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    flex: 1,
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  unblock: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  unblockText: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
  },
});
