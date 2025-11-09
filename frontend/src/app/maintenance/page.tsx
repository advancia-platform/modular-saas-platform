"use client";

import { motion } from "framer-motion";
import {
  Settings,
  Heart,
  Zap,
  Shield,
  RefreshCw,
  Home,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(15);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 15));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.log("Still in maintenance");
    } finally {
      setIsChecking(false);
    }
  };

  const features = [
    {
      icon: Zap,
      text: "Upgrading performance",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Shield,
      text: "Enhancing security",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Heart,
      text: "Improving reliability",
      color: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20"
        >
          {/* Rotating Gear Icon */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-full">
                <Settings className="h-20 w-20 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Main Message */}
          <div className="text-center space-y-6 text-white">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold"
            >
              We'll Be Right Back! 🚀
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-blue-200"
            >
              We're making Advancia Pay even better for you
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Our platform is currently undergoing scheduled maintenance to
              bring you exciting new features and improvements. Don't worry—your
              account and data are completely safe! ✨
            </motion.p>
          </div>

          {/* Features Being Worked On */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
              >
                <div
                  className={`inline-flex p-4 rounded-full bg-gradient-to-br ${feature.color} mb-3`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <p className="text-white font-semibold">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Countdown & Actions */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Clock className="h-6 w-6 text-blue-300" />
                <span className="text-white text-lg font-semibold">
                  Auto-checking in:
                </span>
              </div>
              <div className="text-center">
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-bold text-white"
                >
                  {countdown}
                </motion.span>
                <span className="text-2xl text-blue-300 ml-2">seconds</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isChecking ? "animate-spin" : ""}`}
                />
                {isChecking ? "Checking..." : "Check Status Now"}
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://status.advanciapayledger.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/30 transition-all"
              >
                <Home className="h-5 w-5" />
                System Status
              </motion.a>
            </div>
          </div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 pt-8 border-t border-white/20 text-center"
          >
            <p className="text-slate-300 text-sm mb-3">
              Expected completion time:{" "}
              <strong className="text-white">Within 30 minutes</strong>
            </p>
            <p className="text-slate-400 text-sm">
              Questions? Contact us at{" "}
              <a
                href="mailto:support@advanciapayledger.com"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                support@advanciapayledger.com
              </a>
            </p>
          </motion.div>

          {/* Fun Animation */}
          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="h-3 w-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
              />
            ))}
          </div>
        </motion.div>

        {/* Thank You Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-8 text-slate-300 text-lg"
        >
          Thank you for your patience! We appreciate your trust in Advancia Pay.
          💙
        </motion.p>
      </div>
    </div>
  );
}
