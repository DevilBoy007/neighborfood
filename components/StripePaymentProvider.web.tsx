import React from 'react';

type Props = {
  publishableKey: string;
  merchantIdentifier: string;
  children: React.ReactElement;
};

export default function StripePaymentProvider({ children }: Props) {
  return children;
}
