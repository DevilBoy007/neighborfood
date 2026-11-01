import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import firebaseService from '@/handlers/firebaseService';
import { useAppColors } from '@/hooks/useAppColors';
import { useSessionReset } from '@/hooks/useSessionReset';

const CONFIRMATION_WORD = 'DELETE';

export default function DeleteAccount() {
  const colors = useAppColors();
  const resetSession = useSessionReset();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = password.length > 0 && confirmation === CONFIRMATION_WORD && !isDeleting;

  const performDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await firebaseService.deleteAccount(password);
      await resetSession();
      router.dismissAll();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    const message =
      'This permanently deletes your profile, shops, items, photos, and messages. This cannot be undone.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void performDelete();
      return;
    }
    Alert.alert('Delete account?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void performDelete() },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Delete account</Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Deleting your account permanently removes:
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {'\u2022'} your profile, contact details and location{'\n'}
        {'\u2022'} your shops, items and photos{'\n'}
        {'\u2022'} your message threads{'\n'}
        {'\u2022'} your saved payment methods
      </Text>
      <Text style={[styles.body, { color: colors.text }]}>
        Order records are kept for accounting and tax purposes with your contact details removed.
        You must finish or cancel any open orders first. Open trade offers will be withdrawn.
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Password</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Enter your password"
        placeholderTextColor={colors.placeholder}
        accessibilityLabel="Password"
      />

      <Text style={[styles.label, { color: colors.text }]}>
        Type {CONFIRMATION_WORD} to confirm
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          },
        ]}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        placeholder={CONFIRMATION_WORD}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={`Type ${CONFIRMATION_WORD} to confirm`}
      />

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: canSubmit ? colors.error : colors.buttonDisabled },
        ]}
        onPress={handleDelete}
        disabled={!canSubmit}
        accessibilityRole="button"
      >
        {isDeleting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Permanently delete my account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancel} onPress={() => router.back()} disabled={isDeleting}>
        <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 70,
    gap: 12,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'TextMeOne',
    fontSize: 17,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
  },
  button: {
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  cancel: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
  },
});
