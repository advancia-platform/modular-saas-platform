export function trackEvent(action: string, category: string, label?: string, value?: number) {
  // Stub for analytics tracking
  if (typeof window !== 'undefined' && console) {
    console.log('Track event:', action, category, label, value);
  }
}

export function MarketingScripts() {
  return null;
}

export const seoMetadata = {
  title: 'Advancia PayLedger - Modern Payment Processing',
  description: 'Secure, scalable payment processing with real-time analytics',
  keywords: 'payments, fintech, transactions, ledger, crypto',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://advanciapayledger.com',
    title: 'Advancia PayLedger',
    description: 'Modern Payment Processing Platform',
    site_name: 'Advancia PayLedger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advancia PayLedger',
    description: 'Modern Payment Processing Platform',
  },
};
