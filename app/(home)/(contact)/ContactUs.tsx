import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native-gesture-handler';
import { useAppColors } from '@/hooks/useAppColors';

const ContactScreen = () => {
  const router = useRouter();
  const colors = useAppColors();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const options = ['feedback', 'question', 'other'];

  const handleSubmit = () => {
    // Handle form submission here
    console.log('Selected option:', selectedOption);
    console.log('Message:', message);
    router.back();
    router.push('/success');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" color={colors.icon} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.navText }]}>Contact Us</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 0 }}>
        <Text style={[styles.title, { color: colors.text, borderBottomColor: colors.border }]}>
          what&apos;s on your mind?
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={15}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.card },
                  selectedOption === option && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedOption(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.text },
                    selectedOption === option && { color: colors.buttonText },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedOption && (
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBackground, color: colors.text },
                ]}
                multiline
                placeholder="Type your message here..."
                placeholderTextColor={colors.placeholder}
                value={message}
                onChangeText={setMessage}
                blurOnSubmit={false}
                returnKeyType="default"
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.buttonPrimaryAlternate },
          (!selectedOption || !message) && { backgroundColor: colors.buttonDisabled },
        ]}
        disabled={!selectedOption || !message}
        onPress={handleSubmit}
      >
        <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '500',
    marginLeft: 16,
    fontFamily: 'TitanOne',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 1,
    borderBottomWidth: 1,
    paddingBottom: 8,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 25,
    textAlign: 'center',
    fontFamily: 'TextMeOne',
  },
  textInput: {
    borderRadius: 8,
    padding: 16,
    height: 225,
    marginTop: 24,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginBottom: 40,
      },
    }),
  },
  submitButtonText: {
    fontSize: 30,
    fontWeight: '500',
    fontFamily: 'TitanOne',
  },
});

export default ContactScreen;
