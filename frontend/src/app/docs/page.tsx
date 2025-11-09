'use client'

import SidebarLayout from '@/components/SidebarLayout'
import { motion } from 'framer-motion'
import { Book, Code, Zap, Shield, Database, Boxes, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  const sections = [
    {
      icon: Zap,
      title: "Getting Started",
      description: "Quick start guide and initial setup",
      links: [
        { label: "Introduction", href: "#introduction" },
        { label: "Account Setup", href: "#account-setup" },
        { label: "Dashboard Overview", href: "#dashboard" },
        { label: "First Transaction", href: "#first-transaction" }
      ]
    },
    {
      icon: Shield,
      title: "Security",
      description: "Authentication and security features",
      links: [
        { label: "Two-Factor Authentication", href: "#2fa" },
        { label: "Password Management", href: "#passwords" },
        { label: "Session Security", href: "#sessions" },
        { label: "API Security", href: "#api-security" }
      ]
    },
    {
      icon: Database,
      title: "Transactions",
      description: "Managing your transactions",
      links: [
        { label: "Creating Transactions", href: "#create-transaction" },
        { label: "Transaction History", href: "#history" },
        { label: "Filters & Search", href: "#filters" },
        { label: "Export Data", href: "#export" }
      ]
    },
    {
      icon: Code,
      title: "API Reference",
      description: "Developer documentation",
      links: [
        { label: "Authentication", href: "#auth-api" },
        { label: "Transactions API", href: "#transactions-api" },
        { label: "Tokens API", href: "#tokens-api" },
        { label: "Webhooks", href: "#webhooks" }
      ]
    },
    {
      icon: Boxes,
      title: "Features",
      description: "Platform features and capabilities",
      links: [
        { label: "Crypto Trading", href: "#crypto" },
        { label: "Loan System", href: "#loans" },
        { label: "Rewards Program", href: "#rewards" },
        { label: "Analytics", href: "#analytics" }
      ]
    },
    {
      icon: FileText,
      title: "Guides",
      description: "Step-by-step tutorials",
      links: [
        { label: "Mobile App Setup", href: "#mobile-setup" },
        { label: "Link Bank Account", href: "#link-bank" },
        { label: "Set Up Notifications", href: "#notifications" },
        { label: "Tax Reporting", href: "#taxes" }
      ]
    }
  ]

  const quickLinks = [
    { title: "Backend README", href: "https://github.com/your-repo/backend#readme", external: true },
    { title: "Frontend README", href: "https://github.com/your-repo/frontend#readme", external: true },
    { title: "Troubleshooting Guide", href: "#troubleshooting", external: false },
    { title: "FAQ", href: "#faq", external: false }
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
                <Book className="h-6 w-6 text-blue-600" />
                <span className="text-blue-900 font-semibold">Documentation</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Learn & Build
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to know about using Advancia Pay Ledger
              </p>
            </motion.div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {quickLinks.map((link, index) => (
              <motion.a
                key={link.title}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all font-medium text-slate-700 hover:text-purple-600"
              >
                {link.title}
                {link.external && <ExternalLink className="h-4 w-4" />}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Documentation Grid */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-2">
                  {section.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block px-4 py-2.5 rounded-lg text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-purple-600 transition-colors font-medium"
                    >
                      → {link.label}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* API Reference Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-6">
              <Code className="h-8 w-8" />
              <h2 className="text-3xl font-bold">API Documentation</h2>
            </div>
            
            <p className="text-slate-300 text-lg mb-8 max-w-3xl">
              Build powerful integrations with our RESTful API. Access transaction data, 
              manage user accounts, and automate workflows programmatically.
            </p>

            <div className="bg-slate-950/50 rounded-xl p-6 mb-8 border border-slate-700">
              <div className="text-sm text-slate-400 mb-2">Example API Request</div>
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`POST /api/transactions
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "amount": 100.00,
  "type": "deposit",
  "description": "Monthly salary"
}`}
              </pre>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="#api-reference"
                className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                View Full API Docs
              </Link>
              <Link
                href="#api-keys"
                className="px-6 py-3 bg-slate-800 border-2 border-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Get API Key
              </Link>
            </div>
          </motion.div>
        </div>

        {/* FAQ Preview */}
        <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Common Questions
            </span>
          </h2>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                How do I get started?
              </h3>
              <p className="text-slate-600">
                Simply create an account, verify your email, and you&apos;ll be ready to start 
                managing your finances. Check out our <Link href="#getting-started" className="text-purple-600 hover:underline">Getting Started guide</Link> for a detailed walkthrough.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-slate-600">
                Yes! We use bank-grade encryption, secure authentication, and follow industry 
                best practices. Learn more in our <Link href="#security" className="text-purple-600 hover:underline">Security section</Link>.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Can I integrate this with my own application?
              </h3>
              <p className="text-slate-600">
                Absolutely! Our API allows you to integrate Advancia Pay into your applications. 
                Check out our <Link href="#api-reference" className="text-purple-600 hover:underline">API Reference</Link> to get started.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
