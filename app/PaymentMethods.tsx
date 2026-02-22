import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

// Conditionally import Stripe components (native only)
let useStripe: () => { confirmSetupIntent: any } = () => ({ confirmSetupIntent: null });
let CardField: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const StripeModule = require('@stripe/stripe-react-native');
  useStripe = StripeModule.useStripe;
  CardField = StripeModule.CardField;
  /* eslint-enable @typescript-eslint/no-require-imports */
}

type PaymentMethodCard = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

const PaymentMethods = () => {
  const { userData, setUserData } = useUser();
  const colors = useAppColors();
  const { confirmSetupIntent } = useStripe();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodCard[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  // Stripe Connect state
  const [connectStatus, setConnectStatus] = useState<{
    hasAccount: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await firebaseService.getPaymentMethods();
      setPaymentMethods(result.paymentMethods);
      setDefaultPaymentMethodId(result.defaultPaymentMethodId);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load payment methods',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConnectStatus = useCallback(async () => {
    try {
      const status = await firebaseService.getConnectedAccountStatus();
      setConnectStatus(status);
    } catch (error) {
      console.error('Error loading connect status:', error);
    }
  }, []);

  useEffect(() => {
    loadPaymentMethods();
    loadConnectStatus();
  }, [loadPaymentMethods, loadConnectStatus]);

  const handleAddCard = async () => {
    if (Platform.OS === 'web') {
      Toast.show({
        type: 'error',
        text1: 'Not Available',
        text2: 'Card management is only available on mobile devices.',
      });
      return;
    }

    if (!cardComplete) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete',
        text2: 'Please fill in all card details.',
      });
      return;
    }

    try {
      setIsAdding(true);

      // Create a SetupIntent on the server
      const { clientSecret, customerId } = await firebaseService.createSetupIntent();

      // Confirm the SetupIntent with the card details from CardField
      const { error, setupIntent } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to save card',
        });
        return;
      }

      if (setupIntent) {
        // Update local user data with stripeCustomerId if not already set
        if (userData && !userData.stripeCustomerId) {
          await setUserData({ ...userData, stripeCustomerId: customerId });
        }

        Toast.show({
          type: 'success',
          text1: 'Card Saved',
          text2: 'Your card has been saved securely.',
        });

        setShowAddCard(false);
        setCardComplete(false);
        await loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error adding card:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save card. Please try again.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCard = (paymentMethodId: string, last4: string) => {
    const doDelete = async () => {
      try {
        await firebaseService.deletePaymentMethod(paymentMethodId);
        Toast.show({
          type: 'success',
          text1: 'Removed',
          text2: `Card ending in ${last4} has been removed.`,
        });
        await loadPaymentMethods();
      } catch (error) {
        console.error('Error deleting card:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to remove card.',
        });
      }
    };

    if (Platform.OS === 'web') {
      doDelete();
    } else {
      Alert.alert('Remove Card', `Remove card ending in ${last4}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await firebaseService.setDefaultPaymentMethod(paymentMethodId);
      setDefaultPaymentMethodId(paymentMethodId);
      Toast.show({
        type: 'success',
        text1: 'Default Updated',
        text2: 'Default payment method updated.',
      });
    } catch (error) {
      console.error('Error setting default:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update default payment method.',
      });
    }
  };

  const handleConnectStripeAccount = async () => {
    try {
      setIsConnecting(true);

      // First try OAuth flow (for existing Stripe accounts)
      const redirectUri = 'myapp://stripe-connect';
      const { url } = await firebaseService.getStripeOAuthUrl(redirectUri);

      // Open the Stripe OAuth URL in the device browser
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        Toast.show({
          type: 'success',
          text1: 'Stripe Connect',
          text2: 'Complete the setup in your browser. Return here when done.',
          visibilityTime: 5000,
        });
      } else {
        // Fallback: create a new Standard account + onboarding link
        await firebaseService.createConnectedAccount();
        const { url: onboardingUrl } = await firebaseService.createAccountLink(
          redirectUri,
          redirectUri
        );

        const onboardingSupported = await Linking.canOpenURL(onboardingUrl);
        if (onboardingSupported) {
          await Linking.openURL(onboardingUrl);
          Toast.show({
            type: 'success',
            text1: 'Stripe Connect',
            text2: 'Complete the setup in your browser. Return here when done.',
            visibilityTime: 5000,
          });
        }
      }
    } catch (error: any) {
      // If OAuth fails because user already has an account, just refresh status
      if (error?.code === 'already-exists') {
        await loadConnectStatus();
        Toast.show({
          type: 'success',
          text1: 'Already Connected',
          text2: 'Your Stripe account is already linked.',
        });
        return;
      }

      console.error('Error connecting Stripe account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start Stripe account connection.',
      });
    } finally {
      setIsConnecting(false);
      // Refresh connect status when user returns
      loadConnectStatus();
    }
  };

  const handleNewStripeAccount = async () => {
    try {
      setIsConnecting(true);
      await firebaseService.createConnectedAccount();

      const redirectUri = 'myapp://stripe-connect';
      const { url } = await firebaseService.createAccountLink(redirectUri, redirectUri);

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        Toast.show({
          type: 'success',
          text1: 'Stripe Connect',
          text2: 'Complete the setup in your browser. Return here when done.',
          visibilityTime: 5000,
        });
      }
    } catch (error: any) {
      if (error?.code === 'already-exists') {
        await loadConnectStatus();
        return;
      }
      console.error('Error creating Stripe account:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create Stripe account.',
      });
    } finally {
      setIsConnecting(false);
      loadConnectStatus();
    }
  };

  const getBrandIcon = (brand: string): string => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.navText }]}>Payment Methods</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading payment methods...
            </Text>
          </View>
        ) : (
          <>
            {paymentMethods.length === 0 && !showAddCard ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No saved payment methods
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Add a card to speed up checkout
                </Text>
              </View>
            ) : (
              paymentMethods.map((pm) => (
                <View
                  key={pm.id}
                  style={[
                    styles.cardItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        pm.id === defaultPaymentMethodId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardInfo}>
                    <Ionicons
                      name={getBrandIcon(pm.brand) as any}
                      size={28}
                      color={colors.primary}
                    />
                    <View style={styles.cardDetails}>
                      <Text style={[styles.cardBrand, { color: colors.text }]}>
                        {pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} •••• {pm.last4}
                      </Text>
                      <Text style={[styles.cardExpiry, { color: colors.textMuted }]}>
                        Expires {String(pm.expMonth).padStart(2, '0')}/{pm.expYear}
                      </Text>
                    </View>
                    {pm.id === defaultPaymentMethodId && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.defaultBadgeText, { color: colors.buttonText }]}>
                          Default
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    {pm.id !== defaultPaymentMethodId && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}
                        onPress={() => handleSetDefault(pm.id)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                          Set Default
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => handleDeleteCard(pm.id, pm.last4)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Add Card Section */}
            {showAddCard && Platform.OS !== 'web' && CardField ? (
              <View style={[styles.addCardSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.addCardTitle, { color: colors.text }]}>Add New Card</Text>
                <CardField
                  postalCodeEnabled={true}
                  placeholders={{ number: '4242 4242 4242 4242' }}
                  cardStyle={{
                    backgroundColor: colors.inputBackground,
                    textColor: colors.text,
                    placeholderColor: colors.placeholder,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    fontSize: 16,
                  }}
                  style={styles.cardField}
                  onCardChange={(details: { complete: boolean }) => {
                    setCardComplete(details.complete);
                  }}
                />
                <View style={styles.addCardActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
                    onPress={() => {
                      setShowAddCard(false);
                      setCardComplete(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveCardButton,
                      { backgroundColor: colors.buttonPrimary },
                      (!cardComplete || isAdding) && { opacity: 0.6 },
                    ]}
                    onPress={handleAddCard}
                    disabled={!cardComplete || isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <Text style={[styles.saveCardText, { color: colors.buttonText }]}>
                        Save Card
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : showAddCard && Platform.OS === 'web' ? (
              <View style={[styles.addCardSection, { backgroundColor: colors.surface }]}>
                <Text style={[styles.webNotice, { color: colors.textMuted }]}>
                  Card management is only available on the mobile app.
                </Text>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => setShowAddCard(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Stripe Connect Section — for sellers */}
            <View
              style={[
                styles.connectSection,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.connectHeader}>
                <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                <Text style={[styles.connectTitle, { color: colors.text }]}>Seller Payouts</Text>
              </View>
              <Text style={[styles.connectDescription, { color: colors.textMuted }]}>
                Connect your Stripe account to receive payouts from sales. You can link an existing
                Stripe account or create a new one.
              </Text>

              {connectStatus?.hasAccount ? (
                <View style={styles.connectStatusContainer}>
                  <View style={styles.connectStatusRow}>
                    <Ionicons
                      name={
                        connectStatus.detailsSubmitted ? 'checkmark-circle' : 'alert-circle-outline'
                      }
                      size={20}
                      color={connectStatus.detailsSubmitted ? '#4CAF50' : '#FF9800'}
                    />
                    <Text style={[styles.connectStatusText, { color: colors.text }]}>
                      {connectStatus.detailsSubmitted
                        ? 'Account details submitted'
                        : 'Onboarding incomplete'}
                    </Text>
                  </View>
                  <View style={styles.connectStatusRow}>
                    <Ionicons
                      name={
                        connectStatus.payoutsEnabled ? 'checkmark-circle' : 'alert-circle-outline'
                      }
                      size={20}
                      color={connectStatus.payoutsEnabled ? '#4CAF50' : '#FF9800'}
                    />
                    <Text style={[styles.connectStatusText, { color: colors.text }]}>
                      {connectStatus.payoutsEnabled ? 'Payouts enabled' : 'Payouts not yet enabled'}
                    </Text>
                  </View>
                  {!connectStatus.detailsSubmitted && (
                    <TouchableOpacity
                      style={[styles.connectButton, { backgroundColor: colors.primary }]}
                      onPress={handleNewStripeAccount}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <ActivityIndicator size="small" color={colors.buttonText} />
                      ) : (
                        <Text style={[styles.connectButtonText, { color: colors.buttonText }]}>
                          Complete Onboarding
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.connectActions}>
                  <TouchableOpacity
                    style={[styles.connectButton, { backgroundColor: colors.primary }]}
                    onPress={handleConnectStripeAccount}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <ActivityIndicator size="small" color={colors.buttonText} />
                    ) : (
                      <>
                        <Ionicons name="link-outline" size={18} color={colors.buttonText} />
                        <Text style={[styles.connectButtonText, { color: colors.buttonText }]}>
                          Connect Existing Stripe Account
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.connectButton,
                      {
                        backgroundColor: colors.inputBackground,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={handleNewStripeAccount}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                        <Text style={[styles.connectButtonText, { color: colors.primary }]}>
                          Create New Stripe Account
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Card Button */}
      {!showAddCard && !isLoading && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => setShowAddCard(true)}
          >
            <Ionicons name="add" size={24} color={colors.buttonText} />
            <Text style={[styles.addButtonText, { color: colors.buttonText }]}>
              Add Payment Method
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'TitanOne',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
  },
  cardItem: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  cardExpiry: {
    fontSize: 13,
    fontFamily: 'TextMeOne',
    marginTop: 2,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'TextMeOne',
  },
  addCardSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addCardTitle: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 16,
  },
  addCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  saveCardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  saveCardText: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  webNotice: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  connectSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  connectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  connectTitle: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  connectDescription: {
    fontSize: 13,
    fontFamily: 'TextMeOne',
    marginBottom: 16,
    lineHeight: 18,
  },
  connectActions: {
    gap: 10,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 15,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  connectStatusContainer: {
    gap: 8,
  },
  connectStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectStatusText: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
  },
});

export default PaymentMethods;
