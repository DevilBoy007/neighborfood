import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

type Props = {
  publishableKey: string;
  merchantIdentifier: string;
  children: React.ReactElement;
};

export default function StripePaymentProvider({
  publishableKey,
  merchantIdentifier,
  children,
}: Props) {
  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier={merchantIdentifier}>
      {children}
    </StripeProvider>
  );
}
