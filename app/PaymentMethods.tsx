import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
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

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

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
});

export default PaymentMethods;
