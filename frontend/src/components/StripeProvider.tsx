'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface StripeContextValue {
  stripe: Stripe | null;
  isLoading: boolean;
  error: Error | null;
}

const StripeContext = createContext<StripeContextValue>({
  stripe: null,
  isLoading: true,
  error: null,
});

export function useStripe() {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}

interface StripeProviderProps {
  children: ReactNode;
  /**
   * Optional: Pass a custom publishable key.
   * Defaults to NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY env var.
   */
  publishableKey?: string;
}

export function StripeProvider({ children, publishableKey }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const stripeKey = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!stripeKey) {
      setError(
        new Error('Stripe publishable key not found. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
      );
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadStripe(stripeKey)
      .then((stripeInstance) => {
        if (isMounted) {
          setStripe(stripeInstance);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load Stripe'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [stripeKey]);

  if (error) {
    console.error('[StripeProvider] Initialization error:', error.message);
  }

  return (
    <StripeContext.Provider value={{ stripe, isLoading, error }}>{children}</StripeContext.Provider>
  );
}

/**
 * Higher-order component for wrapping components that need Stripe
 */
export function withStripe<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithStripeComponent(props: P) {
    return (
      <StripeProvider>
        <WrappedComponent {...props} />
      </StripeProvider>
    );
  };
}

export default StripeProvider;
