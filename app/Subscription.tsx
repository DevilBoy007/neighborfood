import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import firebaseService, { SellerPlanStatus } from '@/handlers/firebaseService';
import {
  SUBSCRIPTIONS_AVAILABLE,
  manageSubscription,
  presentProPaywall,
  restorePurchases,
} from '@/handlers/subscriptionService';
import { openLegalDocument } from '@/constants/Legal';
import { useAppColors } from '@/hooks/useAppColors';
import { OutlinedTitle } from '@/components/OutlinedTitle';

const BENEFITS = [
  { icon: 'storefront-outline', text: 'Run up to 10 shops' },
  { icon: 'basket-outline', text: 'List up to 1,000 items' },
  { icon: 'cash-outline', text: 'No Neighborfood platform fee on your sales' },
  { icon: 'heart-outline', text: 'Support a local, independent marketplace' },
] as const;

export default function Subscription() {
  const colors = useAppColors();
  const [status, setStatus] = useState<SellerPlanStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await firebaseService.getSellerPlanStatus());
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load your plan' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<boolean>, successMessage: string) => {
    setBusy(true);
    try {
      if (await action()) {
        setStatus(await firebaseService.syncSubscription());
        Toast.show({ type: 'success', text1: successMessage });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const isPro = status?.plan === 'pro';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={[styles.backText, { color: colors.text }]}>{'\u2039'} back</Text>
      </TouchableOpacity>
      <OutlinedTitle style={styles.title}>Neighborfood Pro</OutlinedTitle>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {status ? (
          <>
            <Text style={[styles.planName, { color: colors.text }]}>
              {isPro ? 'You are a Pro seller' : 'Free plan'}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Shops: {status.shopCount} of {status.limits.maxShops} {'\u00b7'} Items:{' '}
              {status.itemCount} of {status.limits.maxItems}
            </Text>
            {isPro && status.expiresAt ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Renews or ends on {new Date(status.expiresAt).toLocaleDateString()}
              </Text>
            ) : null}
          </>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>

      {BENEFITS.map((benefit) => (
        <View key={benefit.text} style={styles.benefit}>
          <Ionicons name={benefit.icon} size={24} color={colors.icon} />
          <Text style={[styles.body, styles.benefitText, { color: colors.text }]}>
            {benefit.text}
          </Text>
        </View>
      ))}

      {!SUBSCRIPTIONS_AVAILABLE ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Subscriptions are available in the Neighborfood iOS and Android apps.
        </Text>
      ) : isPro ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => manageSubscription()}
          disabled={busy}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Manage subscription</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => run(presentProPaywall, 'Welcome to Neighborfood Pro!')}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Go Pro: $0.99/month or $10/year
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => run(restorePurchases, 'Purchases restored')}
            disabled={busy}
          >
            <Text style={[styles.link, { color: colors.text }]}>Restore purchases</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={[styles.fineprint, { color: colors.textSecondary }]}>
        Payment is charged to your App Store or Google Play account. Subscriptions renew
        automatically unless cancelled at least 24 hours before the end of the current period.
        Manage or cancel any time in your store account settings.
      </Text>
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => openLegalDocument('terms')}>
          <Text style={[styles.link, { color: colors.text }]}>Terms of Use</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLegalDocument('privacy')}>
          <Text style={[styles.link, { color: colors.text }]}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 100,
    paddingBottom: 60,
    gap: 14,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
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
    fontSize: 30,
    alignSelf: 'center',
  },
  card: {
    alignItems: 'center',
    gap: 6,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  planName: {
    fontFamily: 'TitanOne',
    fontSize: 20,
  },
  body: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    textAlign: 'left',
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
  },
  link: {
    fontFamily: 'TextMeOne',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
    padding: 6,
  },
  fineprint: {
    fontFamily: 'TextMeOne',
    fontSize: 12,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});
