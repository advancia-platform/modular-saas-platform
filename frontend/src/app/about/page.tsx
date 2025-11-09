'use client'

import SidebarLayout from '@/components/SidebarLayout'
import { motion } from 'framer-motion'
import { Building2, Users, Target, Shield, Globe, Heart } from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Bank-grade encryption and security protocols protect your financial data 24/7."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Support for multiple currencies and international transactions across 50+ countries."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Built with feedback from thousands of users to create the best experience."
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "24/7 customer support and dedicated account managers for premium users."
    }
  ]

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Transactions", value: "$5M+" },
    { label: "Countries", value: "50+" },
    { label: "Uptime", value: "99.9%" }
  ]

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="text-blue-900 font-semibold">About Advancia Pay</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Revolutionizing
                </span>
                <br />
                Digital Finance
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Advancia Pay Ledger is a modern fintech platform designed to make financial 
                management simple, secure, and accessible to everyone.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-lg border border-slate-200"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-8 w-8 text-purple-600" />
              <h2 className="text-3xl font-bold text-slate-900">Our Mission</h2>
            </div>
            
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              At Advancia Pay, we believe that everyone deserves access to powerful financial tools 
              that are both easy to use and secure. Our mission is to democratize financial services 
              by providing a platform that combines the best of traditional banking with cutting-edge 
              blockchain technology.
            </p>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              We&apos;re committed to transparency, security, and putting our users first in everything we do. 
              Whether you&apos;re managing your daily expenses, investing in cryptocurrency, or building your 
              financial future, Advancia Pay is here to help you succeed.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Why Choose Us
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl"
          >
            <Users className="h-16 w-16 mx-auto mb-6 opacity-90" />
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built by Fintech Experts
            </h2>
            
            <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed mb-8">
              Our team brings decades of combined experience from leading financial institutions, 
              tech companies, and blockchain projects. We&apos;re passionate about creating tools that 
              empower users to take control of their financial future.
            </p>
            
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Join Our Team
            </button>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  )
}
