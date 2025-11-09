'use client'

import SidebarLayout from '@/components/SidebarLayout'
import { motion } from 'framer-motion'
import { Check, Zap, Crown, Rocket, Shield, Clock, Globe } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      icon: Zap,
      price: "Free",
      period: "forever",
      description: "Perfect for individuals getting started with digital finance",
      features: [
        "Up to 10 transactions per month",
        "Basic dashboard analytics",
        "Standard security features",
        "Email support",
        "Mobile app access",
        "1 linked bank account"
      ],
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      popular: false
    },
    {
      name: "Professional",
      icon: Crown,
      price: "$19",
      period: "per month",
      description: "For power users who need advanced features and priority support",
      features: [
        "Unlimited transactions",
        "Advanced analytics & insights",
        "Premium security features",
        "Priority 24/7 support",
        "Desktop & mobile apps",
        "Up to 5 linked bank accounts",
        "Crypto trading integration",
        "API access",
        "Custom reports"
      ],
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
      popular: true
    },
    {
      name: "Enterprise",
      icon: Rocket,
      price: "Custom",
      period: "contact us",
      description: "For businesses requiring custom solutions and dedicated support",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "White-label options",
        "SLA guarantees",
        "Unlimited bank accounts",
        "Advanced compliance tools",
        "Custom API limits",
        "On-premise deployment option",
        "Training & onboarding"
      ],
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-50 to-red-50",
      popular: false
    }
  ]

  const addons = [
    {
      icon: Shield,
      title: "Enhanced Security",
      price: "$5/month",
      description: "2FA, biometric authentication, and security alerts"
    },
    {
      icon: Clock,
      title: "Transaction History",
      price: "$3/month",
      description: "Extended history beyond 90 days, up to 10 years"
    },
    {
      icon: Globe,
      title: "Multi-Currency",
      price: "$8/month",
      description: "Support for 100+ currencies with real-time conversion"
    }
  ]

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-green-900 font-semibold">Simple, Transparent Pricing</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Choose Your Plan
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Start free and upgrade as you grow. No hidden fees, cancel anytime.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl shadow-xl border-2 ${
                  plan.popular ? 'border-purple-500 scale-105' : 'border-slate-200'
                } hover:shadow-2xl transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Header */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} mb-6`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  
                  <p className="text-slate-600 mb-6 min-h-[48px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                        {plan.price}
                      </span>
                      <span className="text-slate-500">/{plan.period}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all mb-8 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center mt-0.5`}>
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Optional Add-ons
              </span>
            </h2>
            <p className="text-slate-600 text-lg">
              Enhance your plan with these powerful features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {addons.map((addon, index) => (
              <motion.div
                key={addon.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <addon.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {addon.title}
                </h3>
                
                <p className="text-slate-600 mb-4">
                  {addon.description}
                </p>
                
                <div className="text-2xl font-bold text-purple-600">
                  {addon.price}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-slate-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and we&apos;ll prorate any charges accordingly.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Is there a long-term commitment?
                </h3>
                <p className="text-slate-600">
                  No commitments required. All plans are billed monthly and you can cancel anytime with no penalties.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-slate-600">
                  We accept all major credit cards, debit cards, PayPal, and cryptocurrency payments.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-slate-600">
                  Yes, we offer a 30-day money-back guarantee. If you&apos;re not satisfied, we&apos;ll refund your payment in full.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  )
}
