"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "@/components/SidebarLayout";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Shield,
  CreditCard,
  Lock,
  Zap,
  MessageCircle,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer:
      'Click "Register" on the login page, enter your email, username, and password. You\'ll receive an email OTP to verify your account. Once verified, you can start using all features.',
  },
  {
    category: "Getting Started",
    question: "What authentication methods are supported?",
    answer:
      "We support email OTP (one-time password) and password login. For enhanced security, you can also enable 2FA (Two-Factor Authentication) with TOTP backup codes in your security settings.",
  },
  {
    category: "Getting Started",
    question: "Is my data secure?",
    answer:
      "Yes! We use industry-standard encryption (AES-256), secure JWT tokens, and all passwords are hashed with bcrypt. Your data is stored securely and we never share it with third parties.",
  },

  // Transactions & Payments
  {
    category: "Transactions & Payments",
    question: "How do I add funds to my account?",
    answer:
      'Go to Dashboard → "Add Funds" → Choose payment method (Card/Stripe) → Enter amount → Confirm. Funds are typically available instantly.',
  },
  {
    category: "Transactions & Payments",
    question: "What payment methods are accepted?",
    answer:
      "We accept credit/debit cards via Stripe, bank transfers, and cryptocurrency deposits (BTC, ETH, USDT). All transactions are secured with end-to-end encryption.",
  },
  {
    category: "Transactions & Payments",
    question: "How long do withdrawals take?",
    answer:
      "Withdrawals to bank accounts take 1-3 business days. Crypto withdrawals are processed within 30 minutes. Minimum withdrawal is $10.",
  },
  {
    category: "Transactions & Payments",
    question: "Are there any transaction fees?",
    answer:
      "Standard transactions have a 1.5% processing fee. Premium and Enterprise users enjoy reduced fees (0.75% and 0.25% respectively). Crypto transactions may have network fees.",
  },

  // Cryptocurrency
  {
    category: "Cryptocurrency",
    question: "What cryptocurrencies can I trade?",
    answer:
      "You can trade Bitcoin (BTC), Ethereum (ETH), USDT, TRUMP Coin, and MEDBED tokens. Real-time price updates and instant conversions are available.",
  },
  {
    category: "Cryptocurrency",
    question: "How do I cash out Trump Coin?",
    answer:
      'Go to Crypto section → Select TRUMP → Click "Sell" → Enter amount → Choose withdrawal method (USD/Bank) → Confirm. Funds arrive in 1-3 business days.',
  },
  {
    category: "Cryptocurrency",
    question: "What are MEDBED tokens?",
    answer:
      "MEDBED tokens are our health analytics utility tokens. Use them to access premium Med-Bed health monitoring features, AI diagnostics, and personalized health reports.",
  },
  {
    category: "Cryptocurrency",
    question: "Can I track my crypto portfolio?",
    answer:
      "Yes! Your dashboard displays real-time portfolio value, profit/loss tracking, transaction history, and interactive charts for all your crypto holdings.",
  },

  // Med-Bed Features
  {
    category: "Med-Bed Features",
    question: "What are Med-Bed Analytics?",
    answer:
      "Med-Bed Analytics uses AI to monitor your health metrics, detect anomalies, and provide personalized wellness recommendations. Book sessions to track vitals, sleep patterns, and stress levels.",
  },
  {
    category: "Med-Bed Features",
    question: "How do I book a Med-Bed session?",
    answer:
      'Navigate to Med-Beds → "Book Session" → Choose session type (Diagnostic/Therapeutic/Preventive) → Select date/time → Pay with MEDBED tokens or USD → Confirm booking.',
  },
  {
    category: "Med-Bed Features",
    question: "Are Med-Bed sessions covered by insurance?",
    answer:
      "Currently, Med-Bed sessions are not covered by traditional insurance. However, Enterprise plan members receive 50% off all sessions as a benefit.",
  },

  // Security & Privacy
  {
    category: "Security & Privacy",
    question: "How do I enable Two-Factor Authentication?",
    answer:
      "Go to Settings → Security → Enable 2FA → Scan QR code with authenticator app → Enter verification code → Save backup codes securely.",
  },
  {
    category: "Security & Privacy",
    question: "What if I lose my 2FA device?",
    answer:
      "Use one of your backup codes (provided during 2FA setup) to log in, then disable and re-enable 2FA with a new device. Contact support if you've lost backup codes.",
  },
  {
    category: "Security & Privacy",
    question: "How can I recover my account?",
    answer:
      'Click "Forgot Password" on login → Enter your email → Check email for recovery link → Set new password. For email access issues, contact support with ID verification.',
  },
  {
    category: "Security & Privacy",
    question: "Is my financial data encrypted?",
    answer:
      "Yes! All sensitive data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never store your full card numbers—only tokenized references via Stripe.",
  },

  // Debit Card
  {
    category: "Debit Card",
    question: "How do I order a debit card?",
    answer:
      'Go to Debit Card section → Click "Order Card" → Complete KYC verification → Choose card design → Confirm shipping address → Pay $10 fee → Card ships in 7-10 business days.',
  },
  {
    category: "Debit Card",
    question: "Can I use my card internationally?",
    answer:
      "Yes! Our debit cards work globally wherever Visa/Mastercard is accepted. Foreign transaction fees: 2% for Standard, 1% for Premium, 0% for Enterprise.",
  },
  {
    category: "Debit Card",
    question: "How do I freeze/unfreeze my card?",
    answer:
      'Go to Debit Card → Card Settings → Toggle "Freeze Card". This instantly blocks all transactions. Unfreeze anytime the same way.',
  },

  // Rewards & Loyalty
  {
    category: "Rewards & Loyalty",
    question: "How do I earn rewards?",
    answer:
      "Earn points on every transaction (1 point per $1 spent), referrals (500 points per friend), daily login streaks (10 points/day), and completing challenges.",
  },
  {
    category: "Rewards & Loyalty",
    question: "What can I redeem points for?",
    answer:
      "Redeem points for cashback, fee waivers, premium features, MEDBED tokens, or donate to charity. 100 points = $1 equivalent value.",
  },
  {
    category: "Rewards & Loyalty",
    question: "Do my points expire?",
    answer:
      "Points expire after 12 months of inactivity. Premium and Enterprise members have no expiration on points.",
  },

  // Support & Troubleshooting
  {
    category: "Support & Troubleshooting",
    question: "How do I contact support?",
    answer:
      "Click the chatbot icon (bottom-right) for instant AI help, submit a ticket via Support page, or email support@advanciapayledger.com. Premium users get priority response within 2 hours.",
  },
  {
    category: "Support & Troubleshooting",
    question: "I'm not receiving OTP codes. What should I do?",
    answer:
      "Check spam/junk folder, verify your email address is correct, ensure email isn't blocking our domain (advanciapayledger.com), try resending after 2 minutes. Still stuck? Contact support.",
  },
  {
    category: "Support & Troubleshooting",
    question: "Why is my transaction pending?",
    answer:
      "Transactions may be pending due to: bank processing times (1-3 days), fraud verification, insufficient funds, or blockchain confirmations (crypto). Check transaction details for specific status.",
  },
  {
    category: "Support & Troubleshooting",
    question: "Can I cancel a transaction?",
    answer:
      'Pending transactions can be canceled within 30 minutes via Transaction History → Select transaction → "Cancel". Completed transactions cannot be reversed—contact support for refunds.',
  },

  // Billing & Subscription
  {
    category: "Billing & Subscription",
    question: "How do I upgrade my plan?",
    answer:
      'Go to Pricing page → Choose Premium or Enterprise → Click "Upgrade" → Confirm payment → Changes take effect immediately with pro-rated charges.',
  },
  {
    category: "Billing & Subscription",
    question: "Can I cancel my subscription anytime?",
    answer:
      'Yes! No long-term contracts. Cancel anytime from Settings → Subscription → "Cancel Plan". You\'ll retain access until the end of your billing period.',
  },
  {
    category: "Billing & Subscription",
    question: "What happens if payment fails?",
    answer:
      "We'll retry payment 3 times over 7 days and send email notifications. If still unsuccessful, your account downgrades to Free plan but data remains safe.",
  },
];

const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryIcons: Record<string, typeof HelpCircle> = {
    "Getting Started": HelpCircle,
    "Transactions & Payments": CreditCard,
    Cryptocurrency: Zap,
    "Med-Bed Features": Shield,
    "Security & Privacy": Lock,
    "Debit Card": CreditCard,
    "Rewards & Loyalty": Zap,
    "Support & Troubleshooting": MessageCircle,
    "Billing & Subscription": CreditCard,
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                <span className="text-blue-900 font-semibold">
                  Frequently Asked Questions
                </span>
              </div>

              <h1 className="text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How Can We Help?
                </span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Find answers to common questions about Advancia Pay Ledger
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto mt-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "All"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((category) => {
                const Icon = categoryIcons[category] || HelpCircle;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-xl text-slate-500">
                No FAQs found matching your search.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? null : index)
                    }
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-blue-600 mb-1">
                        {faq.category}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${
                        expandedIndex === index ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100"
                      >
                        <div className="px-6 py-5 text-slate-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Still Need Help Section */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl"
          >
            <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-90" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Have Questions?
            </h2>

            <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8">
              Our support team is here to help 24/7. Get instant answers from
              our AI chatbot or speak with a human agent.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => {
                  // Trigger chatbot
                  const chatButton = document.querySelector(
                    "[data-chatbot-trigger]"
                  ) as HTMLElement;
                  chatButton?.click();
                }}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Chat with AI Bot
              </button>
              <a
                href="/support"
                className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
