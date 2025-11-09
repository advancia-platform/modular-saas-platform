"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, Shield, Sparkles, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      setEmail(userEmail);
    }

    // Check approval status every 10 seconds
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:4000/api/auth/check-approval', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        
        if (data.approved) {
          // User approved! Redirect to dashboard
          clearInterval(interval);
          router.push('/dashboard');
        } else if (data.rejected) {
          // User rejected
          clearInterval(interval);
          alert(`Account Rejected: ${data.reason || 'Please contact support'}`);
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "15% Welcome Bonus",
      description: "Get instant bonus on your first deposit once approved"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description: "Your funds are protected with military-grade encryption"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Premium Features",
      description: "Access advanced trading tools and AI-powered analytics"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "VIP Support",
      description: "Get priority 24/7 customer support from our expert team"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        {/* Main Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-3xl p-8 md:p-12 backdrop-blur-lg">
          {/* Animated Clock Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50"
          >
            <Clock className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Almost There!
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-300 text-center mb-8">
            Your account is pending admin approval
          </p>

          {/* Email Badge */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 mb-8 text-center">
            <p className="text-sm text-gray-400 mb-1">Registered Email</p>
            <p className="text-lg font-semibold text-white">{email}</p>
          </div>

          {/* Status Steps */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Registration</p>
                <p className="text-sm text-gray-400">Completed ✓</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4 flex items-center space-x-3 animate-pulse">
              <Clock className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Admin Review</p>
                <p className="text-sm text-gray-400">In Progress...</p>
              </div>
            </div>
            
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 flex items-center space-x-3 opacity-50">
              <Sparkles className="w-6 h-6 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Access Granted</p>
                <p className="text-sm text-gray-400">Pending</p>
              </div>
            </div>
          </div>

          {/* Encouraging Message */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Our admin team is reviewing your application (typically takes 1-2 hours)</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>You'll receive an email notification once approved</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>This page will automatically refresh when your account is activated</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Keep this tab open or check back soon!</span>
              </li>
            </ul>
          </div>

          {/* Benefits Grid */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              While You Wait, Here's What You'll Get
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/50 transition"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                      <p className="text-sm text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-4">Trusted by 500,000+ users worldwide</p>
            <div className="flex justify-center items-center space-x-6 text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="text-xs">SOC 2 Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">FinCEN Registered</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span className="text-xs">FDIC Insured</span>
              </div>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6 text-center text-sm text-gray-500"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Auto-checking approval status every 10 seconds...
          </motion.div>
        </div>

        {/* Support Contact */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Questions? Contact us at{" "}
            <a href="mailto:support@advancia.com" className="text-purple-400 hover:text-purple-300 transition">
              support@advancia.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
