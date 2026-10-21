import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/store/reduxHooks';

export default function StripeRefresh() {
  const { userData } = useUser();
  const [message, setMessage] = useState('Refreshing your Stripe onboarding link…');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOnboarding = useCallback(async () => {
    if (!userData?.uid) {
      setMessage('Sign in to Neighborfood to continue your seller onboarding.');
      return;
    }
    try {
      setIsRefreshing(true);
      const { url } = await firebaseService.createAccountLink();
      await Linking.openURL(url);
      setMessage('Your new onboarding link is ready.');
    } catch (error) {
      console.error('Error refreshing Stripe onboarding:', error);
      setMessage('Unable to refresh onboarding. Return to Payment Methods and try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [userData?.uid]);

  useEffect(() => {
    refreshOnboarding();
  }, [refreshOnboarding]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {isRefreshing && <ActivityIndicator />}
      <Text style={{ marginVertical: 16, textAlign: 'center' }}>{message}</Text>
      {!isRefreshing && (
        <SoundTouchableOpacity onPress={refreshOnboarding} soundType="tap">
          <Text>Continue onboarding</Text>
        </SoundTouchableOpacity>
      )}
    </View>
  );
}
