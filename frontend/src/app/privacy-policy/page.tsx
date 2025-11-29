'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileText, Globe, Lock, Mail, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'November 29, 2025';

  const sections = [
    {
      id: 'information-collection',
      icon: FileText,
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, make a transaction, contact customer support, or otherwise communicate with us.

**Personal Information:**
- Full name and contact information (email, phone number)
- Government-issued identification for KYC/AML compliance
- Financial information (bank account details, payment card information)
- Transaction history and account activity
- Device information and IP addresses

**Automatically Collected Information:**
- Log data (browser type, access times, pages viewed)
- Device identifiers and mobile network information
- Location data (with your consent)
- Cookies and similar tracking technologies`,
    },
    {
      id: 'information-use',
      icon: Eye,
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:

- Process transactions and send related information
- Verify your identity and comply with legal requirements
- Detect, prevent, and address fraud and security issues
- Provide customer support and respond to inquiries
- Send promotional communications (with your consent)
- Improve our services and develop new features
- Comply with legal obligations and regulatory requirements

**Legal Basis for Processing (GDPR):**
- Contract performance: Processing necessary for our services
- Legal obligation: Compliance with KYC/AML regulations
- Legitimate interests: Fraud prevention and security
- Consent: Marketing communications and cookies`,
    },
    {
      id: 'information-sharing',
      icon: Users,
      title: '3. Information Sharing',
      content: `We do not sell your personal information. We may share your information in the following circumstances:

**Service Providers:**
We work with third-party service providers who perform services on our behalf, including payment processing, identity verification, cloud hosting, and customer support.

**Legal Requirements:**
We may disclose your information if required by law, regulation, legal process, or governmental request.

**Business Transfers:**
In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.

**With Your Consent:**
We may share your information for other purposes with your explicit consent.`,
    },
    {
      id: 'data-security',
      icon: Lock,
      title: '4. Data Security',
      content: `We implement robust security measures to protect your personal information:

**Technical Safeguards:**
- 256-bit SSL/TLS encryption for all data transmission
- AES-256 encryption for data at rest
- Multi-factor authentication (MFA)
- Regular security audits and penetration testing
- SOC 2 Type II certified infrastructure

**Organizational Measures:**
- Access controls and role-based permissions
- Employee security training and background checks
- Incident response procedures
- Regular security assessments

**Financial Security:**
- PCI DSS Level 1 compliance
- Cold storage for cryptocurrency assets
- Multi-signature wallet technology`,
    },
    {
      id: 'your-rights',
      icon: Shield,
      title: '5. Your Rights and Choices',
      content: `You have the following rights regarding your personal information:

**Access:** Request a copy of your personal data
**Correction:** Update or correct inaccurate information
**Deletion:** Request deletion of your personal data (subject to legal retention requirements)
**Portability:** Receive your data in a structured, machine-readable format
**Objection:** Object to processing based on legitimate interests
**Restriction:** Request limitation of processing
**Withdraw Consent:** Withdraw consent for marketing communications

**For EU/EEA Residents (GDPR):**
You have additional rights under the General Data Protection Regulation, including the right to lodge a complaint with your local supervisory authority.

**For California Residents (CCPA):**
You have the right to know, delete, and opt-out of the sale of personal information. We do not sell personal information.`,
    },
    {
      id: 'international-transfers',
      icon: Globe,
      title: '6. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place:

- Standard Contractual Clauses (SCCs) approved by the European Commission
- Adequacy decisions for transfers to approved countries
- Binding Corporate Rules where applicable

**Data Storage Locations:**
- Primary servers: United States (AWS)
- Backup servers: European Union (Ireland)
- CDN: Global edge locations`,
    },
    {
      id: 'cookies',
      icon: Eye,
      title: '7. Cookies and Tracking',
      content: `We use cookies and similar technologies to enhance your experience:

**Essential Cookies:** Required for basic site functionality
**Analytics Cookies:** Help us understand how you use our services
**Marketing Cookies:** Used to deliver relevant advertisements

**Managing Cookies:**
You can control cookies through your browser settings. Note that disabling certain cookies may affect site functionality.

We also use:
- Google Analytics for usage analytics
- Sentry for error tracking
- Intercom for customer support`,
    },
    {
      id: 'retention',
      icon: FileText,
      title: '8. Data Retention',
      content: `We retain your information for as long as necessary to:

- Provide our services to you
- Comply with legal obligations (typically 5-7 years for financial records)
- Resolve disputes and enforce agreements
- Meet regulatory requirements (KYC/AML records)

**After Account Closure:**
- Transaction records: 7 years (regulatory requirement)
- KYC documents: 5 years after relationship ends
- Marketing data: Deleted upon request
- Technical logs: 90 days`,
    },
    {
      id: 'children',
      icon: Users,
      title: "9. Children's Privacy",
      content: `Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at privacy@advanciapayledger.com.`,
    },
    {
      id: 'changes',
      icon: FileText,
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:

- Posting the updated policy on our website
- Sending an email notification to registered users
- Displaying a prominent notice in our app

Your continued use of our services after changes become effective constitutes acceptance of the updated policy.`,
    },
    {
      id: 'contact',
      icon: Mail,
      title: '11. Contact Us',
      content: `If you have questions about this Privacy Policy or our data practices, please contact us:

**Data Protection Officer:**
Email: privacy@advanciapayledger.com
Phone: +1 (717) 469-5102

**Mailing Address:**
Advancia Pay Ledger Inc.
Attn: Privacy Team
350 Fifth Avenue, Suite 4200
New York, NY 10118
United States

**EU Representative:**
Advancia EU Ltd.
1 Canada Square, Canary Wharf
London E14 5AB, United Kingdom`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-white">Advancia</span>
            </Link>
            <Link
              href="/landing"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Your Privacy Matters</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Privacy Policy</h1>
            <p className="text-xl text-gray-400 mb-4">
              How we collect, use, and protect your personal information
            </p>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-gray-400 hover:text-blue-400 transition-colors text-sm py-1"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                {section.content.split('\n\n').map((paragraph, pIndex) => (
                  <div key={pIndex} className="mb-4">
                    {paragraph.startsWith('**') ? (
                      <div className="text-gray-300">
                        {paragraph.split('\n').map((line, lIndex) => {
                          if (line.startsWith('**') && line.includes(':**')) {
                            const parts = line.split(':**');
                            const title = parts[0] || '';
                            const rest = parts.slice(1);
                            return (
                              <div key={lIndex} className="mb-2">
                                <span className="font-semibold text-white">
                                  {title.replace(/\*\*/g, '')}:
                                </span>
                                <span className="text-gray-400">{rest.join(':**')}</span>
                              </div>
                            );
                          }
                          if (line.startsWith('- ')) {
                            return (
                              <div
                                key={lIndex}
                                className="flex items-start gap-2 ml-4 text-gray-400"
                              >
                                <span className="text-blue-400">•</span>
                                <span>{line.substring(2)}</span>
                              </div>
                            );
                          }
                          return (
                            <p key={lIndex} className="text-gray-400">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 leading-relaxed">{paragraph}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-white font-semibold">Advancia Pay Ledger</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Advancia Pay Ledger. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
