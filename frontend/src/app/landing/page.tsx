"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Shield, Zap, TrendingUp, Lock, Globe, Award, ArrowRight, CheckCircle, DollarSign, Bitcoin, Wallet, CreditCard } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Bitcoin className="w-8 h-8" />,
      title: "Crypto Trading Made Simple",
      description: "Trade Bitcoin, Ethereum, and USDT with lightning-fast transactions and real-time portfolio tracking"
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Secure Digital Wallet",
      description: "Bank-grade security with multi-layer encryption. Your assets are protected 24/7"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Smart Investment Tools",
      description: "AI-powered analytics, real-time charts, and expert insights to maximize your returns"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Transactions",
      description: "Send and receive payments globally in seconds, not days. Zero delays, maximum efficiency"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Military-Grade Security",
      description: "Two-factor authentication, biometric login, and cold storage protection for your peace of mind"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Rewards & Cashback",
      description: "Earn up to 15% bonus on every transaction. Level up your tier and unlock exclusive perks"
    }
  ];

  const stats = [
    { number: "500K+", label: "Active Users" },
    { number: "$2.5B+", label: "Trading Volume" },
    { number: "150+", label: "Countries" },
    { number: "99.9%", label: "Uptime" }
  ];

  const faqs = [
    {
      question: "What is the 30-Day Money-Back Guarantee?",
      answer: "We're so confident you'll love Advancia that we offer a full refund within 30 days of your first deposit. No questions asked. If you're not completely satisfied with our platform, simply request a refund and we'll return 100% of your initial deposit to your bank account within 5-7 business days."
    },
    {
      question: "How secure is my money and crypto?",
      answer: "Your security is our top priority. We use military-grade AES-256 encryption, two-factor authentication, and store 95% of crypto assets in cold storage (offline wallets). All fiat funds are held in FDIC-insured accounts. We've never been hacked and maintain SOC 2 Type II compliance."
    },
    {
      question: "What are the fees and hidden charges?",
      answer: "Complete transparency - no hidden fees. Trading: 0.5% per transaction. Crypto withdrawal: 1% network fee. Bank transfers: Free (ACH) or $25 (wire). Monthly maintenance: $0. We believe in honest pricing, and you'll never see surprise charges on your statement."
    },
    {
      question: "How quickly can I withdraw my money?",
      answer: "Crypto withdrawals: 10-30 minutes (after admin approval for security). Bank transfers: 1-3 business days (ACH) or same-day (wire). We prioritize fast access to YOUR money. Large withdrawals may require additional verification to protect your account from fraud."
    },
    {
      question: "What cryptocurrencies do you support?",
      answer: "Currently: Bitcoin (BTC), Ethereum (ETH), and Tether (USDT). Coming soon: Litecoin, Ripple, Cardano, and 20+ more. You can trade, hold, and withdraw all supported cryptos with real-time market pricing and instant conversion to USD."
    },
    {
      question: "Is this platform regulated and legal?",
      answer: "Yes! Advancia operates in full compliance with FinCEN (Financial Crimes Enforcement Network) and state money transmitter licenses. We follow KYC (Know Your Customer) and AML (Anti-Money Laundering) regulations. Your funds are legally protected and segregated from company assets."
    },
    {
      question: "What are the account limits?",
      answer: "New users: $10,000 daily trading limit. Verified users (ID + address): $50,000 daily. Premium tier: $250,000+ daily. No minimum deposit required. Start with as little as $10 and scale as you grow. Withdrawal limits match your tier level."
    },
    {
      question: "How do I earn the 15% bonus?",
      answer: "Automatically applied! Every time you deposit or receive funds, you earn 15% bonus tokens. Example: Deposit $1,000, get $150 in bonus tokens instantly. Use tokens for trading fee discounts, premium features, or cash out at $0.10 per token. No games, no tricks - just free money."
    },
    {
      question: "What if I forget my password or lose access?",
      answer: "Easy recovery! Use email verification or SMS code to reset your password instantly. For added security, you'll receive backup codes during 2FA setup - store them safely. Our 24/7 support team can verify your identity and restore access within 2 hours if needed."
    },
    {
      question: "Can I use this for my business?",
      answer: "Absolutely! Advancia Business accounts include: bulk payments, API access, multi-user permissions, custom limits, dedicated account manager, and invoicing tools. Process payroll, accept crypto payments, or manage company finances - all in one platform. Contact sales for enterprise pricing."
    },
    {
      question: "What are the platform rules I must follow?",
      answer: "Simple rules for everyone's safety: (1) No money laundering or illegal activities, (2) One account per person, (3) Accurate KYC information required, (4) No chargebacks or fraud attempts, (5) Minimum age 18+, (6) Comply with your local laws. Breaking these rules results in immediate account suspension and potential legal action. We're committed to a safe, compliant platform for all users."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Crypto Trader",
      image: "👩‍💼",
      text: "Made $15,000 in my first month! The AI tools are incredibly accurate. Best platform I've used."
    },
    {
      name: "James Rodriguez",
      role: "Small Business Owner",
      image: "👨‍💻",
      text: "Accepted crypto payments for my store. Customers love it, and I save 3% on credit card fees!"
    },
    {
      name: "Emily Chen",
      role: "Investor",
      image: "👩‍🎓",
      text: "Finally, a platform that doesn't nickel-and-dime you. Transparent fees and amazing support."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Advancia
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition">FAQ</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Trusted by 500,000+ investors worldwide</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Your Gateway to
              </span>
              <br />
              <span className="text-white">Financial Freedom</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Trade crypto, manage wealth, and grow your portfolio with the most trusted platform. 
              <span className="text-purple-400 font-semibold"> 15% bonus on every deposit.</span> Start in 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <Link href="/auth/register" className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105 flex items-center">
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link href="#how-it-works" className="border border-purple-500/50 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-500/10 transition">
                Watch Demo
              </Link>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>30-Day Money-Back</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Bank-Level Security</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-xl text-gray-400">Powerful tools designed for both beginners and pros</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/50 transition group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get Started in <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-400">From signup to your first trade in under 2 minutes</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Sign up with email in 30 seconds. No paperwork, no hassle." },
              { step: "2", title: "Add Funds", desc: "Deposit via bank transfer, card, or crypto. Instant credit + 15% bonus." },
              { step: "3", title: "Start Trading", desc: "Buy, sell, trade crypto or manage your portfolio. It's that easy!" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-purple-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Transparent Pricing</span>
            </h2>
            <p className="text-xl text-gray-400">No hidden fees. No surprises. Just honest pricing.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "/month",
                features: ["$10,000 daily limit", "0.5% trading fee", "Basic charts", "Email support", "15% deposit bonus"],
                cta: "Start Free",
                popular: false
              },
              {
                name: "Pro",
                price: "$29",
                period: "/month",
                features: ["$50,000 daily limit", "0.3% trading fee", "Advanced AI tools", "Priority support", "20% deposit bonus", "API access"],
                cta: "Go Pro",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                features: ["Unlimited limits", "0.1% trading fee", "Dedicated manager", "24/7 phone support", "25% deposit bonus", "Custom features"],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-purple-500/10 to-blue-500/10 border ${
                  plan.popular ? 'border-purple-500 shadow-2xl shadow-purple-500/50 scale-105' : 'border-purple-500/20'
                } rounded-2xl p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`block w-full text-center py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-xl hover:shadow-purple-500/50'
                    : 'border border-purple-500/50 text-white hover:bg-purple-500/10'
                }`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-xl text-gray-400">See what our users are saying</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{testimonial.image}</div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Questions? <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">We've Got Answers</span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to know about Advancia</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-purple-500/5 transition"
                >
                  <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-6 h-6 text-purple-400 flex-shrink-0 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 30-Day Guarantee Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-2xl p-8 text-center"
          >
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">30-Day Money-Back Guarantee</h3>
            <p className="text-gray-300 mb-4">
              Try Advancia risk-free. If you're not 100% satisfied within 30 days, we'll refund your entire deposit. 
              No questions. No hassle. Just your money back.
            </p>
            <div className="inline-flex items-center space-x-2 text-green-400 font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>Protected by Advancia Trust</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Join 500,000+ users who are already building wealth with Advancia
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/auth/register" className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 flex items-center">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="#faq" className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 py-12 px-4 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Advancia</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted gateway to financial freedom and cryptocurrency excellence.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-500/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Advancia Financial. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Globe className="w-5 h-5 text-gray-400 hover:text-white transition cursor-pointer" />
              <Award className="w-5 h-5 text-gray-400 hover:text-white transition cursor-pointer" />
              <Shield className="w-5 h-5 text-gray-400 hover:text-white transition cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
