import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function StripeReturn() {
  useEffect(() => {
    router.replace('/PaymentMethods');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 16 }}>Returning to your seller payment settings…</Text>
    </View>
  );
}
