'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle,
  CreditCard,
  FileText,
  Gavel,
  Scale,
  Shield,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const lastUpdated = 'November 29, 2025';
  const effectiveDate = 'November 29, 2025';

  const sections = [
    {
      id: 'acceptance',
      icon: CheckCircle,
      title: '1. Acceptance of Terms',
      content: `By accessing or using Advancia Pay Ledger's services, website, or mobile applications (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use our Services.

These Terms constitute a legally binding agreement between you and Advancia Pay Ledger Inc. ("Advancia," "we," "us," or "our"). We may modify these Terms at any time, and your continued use of our Services following any changes constitutes acceptance of those changes.

**Eligibility:**
- You must be at least 18 years of age
- You must have the legal capacity to enter into binding contracts
- You must not be prohibited from using financial services under applicable law
- You must not be located in a sanctioned country or on any sanctions list`,
    },
    {
      id: 'account-registration',
      icon: UserCheck,
      title: '2. Account Registration & Verification',
      content: `**Account Creation:**
To use our Services, you must create an account and provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials.

**Identity Verification (KYC):**
We are required to verify your identity to comply with anti-money laundering (AML) regulations. You agree to:
- Provide valid government-issued identification
- Submit proof of address documentation
- Complete any additional verification steps we may require
- Notify us of any changes to your personal information

**Account Security:**
- Enable two-factor authentication (2FA)
- Use a strong, unique password
- Never share your credentials with others
- Notify us immediately of any unauthorized access

**Account Termination:**
We may suspend or terminate your account if you:
- Violate these Terms
- Provide false or misleading information
- Engage in fraudulent or illegal activities
- Fail to complete required verification`,
    },
    {
      id: 'services',
      icon: CreditCard,
      title: '3. Services Description',
      content: `Advancia Pay Ledger provides digital financial services including:

**Core Services:**
- Digital wallet for fiat and cryptocurrency
- Peer-to-peer payment transfers
- Cryptocurrency trading (BTC, ETH, USDT)
- Payment processing and merchant services
- Reward and cashback programs

**Service Availability:**
- Services may not be available in all jurisdictions
- We reserve the right to modify or discontinue services
- Scheduled maintenance may cause temporary interruptions
- We aim for 99.9% uptime but do not guarantee uninterrupted access

**Service Limitations:**
- Transaction limits may apply based on account tier
- Some features require enhanced verification
- Cryptocurrency prices are volatile and subject to market conditions
- Exchange rates are determined at the time of transaction`,
    },
    {
      id: 'fees',
      icon: CreditCard,
      title: '4. Fees and Charges',
      content: `**Transaction Fees:**
- Cryptocurrency trades: 0.5% - 1.5% per transaction
- Bank transfers: Variable based on method and region
- Instant transfers: Additional expedited processing fee
- Currency conversion: Market rate plus 1% spread

**Account Fees:**
- Account maintenance: Free for active accounts
- Inactivity fee: $5/month after 12 months of inactivity
- Enhanced features: Subscription pricing available

**Fee Disclosure:**
- All fees are disclosed before transaction confirmation
- Fees may be updated with 30 days' notice
- Current fee schedule available on our website

**Third-Party Fees:**
You may incur additional fees from:
- Your bank or payment provider
- Blockchain network fees (gas fees)
- Currency exchange fees`,
    },
    {
      id: 'prohibited',
      icon: Ban,
      title: '5. Prohibited Activities',
      content: `You agree not to use our Services for:

**Illegal Activities:**
- Money laundering or terrorist financing
- Fraud, scams, or pyramid schemes
- Tax evasion or illegal gambling
- Purchase of illegal goods or services
- Sanctions violations

**Harmful Conduct:**
- Harassment, abuse, or threats to others
- Spreading malware or conducting cyber attacks
- Attempting to manipulate markets
- Circumventing security measures
- Creating multiple accounts to evade restrictions

**Unauthorized Use:**
- Using another person's account without permission
- Impersonating Advancia staff or representatives
- Accessing accounts or systems without authorization
- Reverse engineering our software or systems

**Consequences:**
Violation of these prohibitions may result in:
- Immediate account suspension or termination
- Reporting to law enforcement agencies
- Forfeiture of account balances
- Legal action and liability for damages`,
    },
    {
      id: 'intellectual-property',
      icon: FileText,
      title: '6. Intellectual Property',
      content: `**Our Property:**
All content, features, and functionality of our Services are owned by Advancia Pay Ledger and are protected by copyright, trademark, and other intellectual property laws.

This includes:
- Website design and user interface
- Software, code, and algorithms
- Logos, trademarks, and branding
- Documentation and educational content

**Limited License:**
We grant you a limited, non-exclusive, non-transferable license to access and use our Services for personal, non-commercial purposes in accordance with these Terms.

**Restrictions:**
You may not:
- Copy, modify, or distribute our content
- Use our trademarks without written permission
- Create derivative works based on our Services
- Remove copyright or proprietary notices`,
    },
    {
      id: 'disclaimers',
      icon: AlertTriangle,
      title: '7. Disclaimers and Limitations',
      content: `**No Financial Advice:**
Our Services are not intended to provide financial, investment, tax, or legal advice. You should consult qualified professionals before making financial decisions.

**Cryptocurrency Risks:**
- Cryptocurrency values are highly volatile
- Past performance does not guarantee future results
- You may lose some or all of your investment
- Regulatory changes may affect cryptocurrency services

**Service Disclaimer:**
THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

**Limitation of Liability:**
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADVANCIA SHALL NOT BE LIABLE FOR:
- Indirect, incidental, or consequential damages
- Loss of profits, revenue, or data
- Service interruptions or errors
- Unauthorized access to your account
- Third-party actions or content

**Maximum Liability:**
Our total liability shall not exceed the greater of: (a) the fees you paid in the 12 months preceding the claim, or (b) $100 USD.`,
    },
    {
      id: 'indemnification',
      icon: Shield,
      title: '8. Indemnification',
      content: `You agree to indemnify, defend, and hold harmless Advancia Pay Ledger, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorney fees) arising from:

- Your use of our Services
- Your violation of these Terms
- Your violation of any third-party rights
- Your violation of applicable laws or regulations
- Any content you submit or transmit through our Services
- Any fraudulent or illegal activity on your account

This indemnification obligation survives termination of these Terms and your use of our Services.`,
    },
    {
      id: 'dispute-resolution',
      icon: Scale,
      title: '9. Dispute Resolution',
      content: `**Informal Resolution:**
Before filing any claim, you agree to contact us at legal@advanciapayledger.com to attempt to resolve the dispute informally within 30 days.

**Arbitration Agreement:**
Any dispute that cannot be resolved informally shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.

**Arbitration Terms:**
- Location: New York, New York, USA
- Language: English
- Arbitrator: Single arbitrator selected per AAA rules
- Fees: Each party bears its own costs

**Class Action Waiver:**
YOU AGREE TO RESOLVE DISPUTES ON AN INDIVIDUAL BASIS. YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS.

**Exceptions:**
- Either party may seek injunctive relief in court
- Small claims court actions are permitted
- Intellectual property disputes may be litigated`,
    },
    {
      id: 'governing-law',
      icon: Gavel,
      title: '10. Governing Law',
      content: `These Terms shall be governed by and construed in accordance with the laws of the State of New York, United States, without regard to conflict of law principles.

**Jurisdiction:**
For any matters not subject to arbitration, you consent to the exclusive jurisdiction of the state and federal courts located in New York County, New York.

**International Users:**
If you access our Services from outside the United States:
- You are responsible for compliance with local laws
- Some services may not be available in your jurisdiction
- These Terms still apply to the fullest extent permitted

**Regulatory Compliance:**
Advancia Pay Ledger operates in compliance with applicable U.S. federal and state regulations, including:
- Bank Secrecy Act (BSA)
- FinCEN regulations
- State money transmission laws
- OFAC sanctions requirements`,
    },
    {
      id: 'general',
      icon: FileText,
      title: '11. General Provisions',
      content: `**Entire Agreement:**
These Terms, together with our Privacy Policy and any additional terms for specific services, constitute the entire agreement between you and Advancia.

**Severability:**
If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full force and effect.

**Waiver:**
Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.

**Assignment:**
You may not assign your rights under these Terms. We may assign our rights without restriction.

**Force Majeure:**
We are not liable for delays or failures due to circumstances beyond our reasonable control.

**Contact Information:**
Advancia Pay Ledger Inc.
350 Fifth Avenue, Suite 4200
New York, NY 10118
Email: legal@advanciapayledger.com
Phone: +1 (717) 469-5102`,
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
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Legal Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Terms of Service</h1>
            <p className="text-xl text-gray-400 mb-4">
              Please read these terms carefully before using our services
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>Effective: {effectiveDate}</span>
              <span>•</span>
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">Important Notice</h3>
                <p className="text-gray-300 text-sm">
                  These Terms include a binding arbitration provision and class action waiver
                  (Section 9). By using our Services, you agree to resolve disputes through
                  individual arbitration rather than in court or through class actions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => (
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

      {/* Terms Content */}
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
                    {paragraph.startsWith('**') || paragraph.includes(':**') ? (
                      <div className="text-gray-300">
                        {paragraph.split('\n').map((line, lIndex) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <h4 key={lIndex} className="font-semibold text-white mt-4 mb-2">
                                {line.replace(/\*\*/g, '')}
                              </h4>
                            );
                          }
                          if (line.startsWith('**') && line.includes(':**')) {
                            const [title, ...rest] = line.split(':**');
                            return (
                              <div key={lIndex} className="mb-2">
                                <span className="font-semibold text-white">
                                  {(title ?? '').replace(/\*\*/g, '')}:
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
                          if (line.toUpperCase() === line && line.length > 20) {
                            return (
                              <p
                                key={lIndex}
                                className="text-gray-400 font-medium bg-white/5 p-3 rounded-lg my-2 text-sm"
                              >
                                {line}
                              </p>
                            );
                          }
                          return line ? (
                            <p key={lIndex} className="text-gray-400">
                              {line}
                            </p>
                          ) : null;
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

      {/* Agreement Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">
              By using Advancia Pay Ledger, you agree to these Terms
            </h3>
            <p className="text-gray-400 mb-6">
              If you have any questions about these Terms, please contact our legal team.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-colors"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
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
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
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
