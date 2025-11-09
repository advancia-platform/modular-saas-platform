"use client";

import FinShapeLogo from "@/components/FinShapeLogo";
import { motion } from "framer-motion";

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            FinShape Logo Showcase
          </h1>
          <p className="text-gray-600 text-lg">
            FinTech-inspired logo system for your crypto trading platform
          </p>
        </div>

        {/* Main Logo Display */}
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-12 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center">
            <FinShapeLogo size="xl" animated={true} showText={true} />
          </div>
        </motion.div>

        {/* Size Variations */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Size Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Small */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-sm font-semibold text-gray-500 uppercase">Small</p>
              <FinShapeLogo size="sm" animated={false} showText={true} />
            </motion.div>

            {/* Medium */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm font-semibold text-gray-500 uppercase">Medium</p>
              <FinShapeLogo size="md" animated={false} showText={true} />
            </motion.div>

            {/* Large */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-semibold text-gray-500 uppercase">Large</p>
              <FinShapeLogo size="lg" animated={false} showText={true} />
            </motion.div>

            {/* Extra Large */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-gray-500 uppercase">Extra Large</p>
              <FinShapeLogo size="xl" animated={false} showText={true} />
            </motion.div>
          </div>
        </div>

        {/* Icon Only Versions */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Icon Only</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(["sm", "md", "lg", "xl"] as const).map((size, index) => (
              <motion.div
                key={size}
                className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <p className="text-sm font-semibold text-gray-500 uppercase">{size}</p>
                <FinShapeLogo size={size} animated={false} showText={false} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Background Variations */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">On Different Backgrounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Light Background */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm font-semibold text-gray-500 uppercase">Light</p>
              <FinShapeLogo size="lg" animated={false} showText={true} />
            </motion.div>

            {/* Dark Background */}
            <motion.div
              className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-semibold text-gray-400 uppercase">Dark</p>
              <FinShapeLogo size="lg" animated={false} showText={true} />
            </motion.div>

            {/* Gradient Background */}
            <motion.div
              className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl shadow-lg p-8 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-white uppercase">Gradient</p>
              <div className="filter brightness-150">
                <FinShapeLogo size="lg" animated={false} showText={true} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Animated Version */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">Animated Logo</h2>
          <motion.div
            className="bg-white rounded-xl shadow-lg p-12 border border-gray-100 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <FinShapeLogo size="xl" animated={true} showText={true} />
          </motion.div>
          <p className="text-center text-gray-600">
            Refresh the page to see the entry animation
          </p>
        </div>

        {/* Logo Concept */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Logo Concept</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-blue-600">Design Elements</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Hexagon:</strong> Represents structure, stability, and blockchain technology</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Chart Line:</strong> Symbolizes financial growth and market analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Dollar Sign:</strong> Merges traditional finance with modern crypto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Gradient Colors:</strong> Blue → Cyan → Teal represents trust, innovation, and growth</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-blue-600">Brand Values</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Professional:</strong> Clean, modern design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Trustworthy:</strong> Stable geometric shapes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Innovative:</strong> Tech-forward aesthetic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span><strong>Dynamic:</strong> Growth-oriented imagery</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">Usage Guidelines</h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>Clear Space:</strong> Maintain minimum padding equal to the height of one letter around the logo.</p>
            <p><strong>Minimum Size:</strong> Never display the logo smaller than 24px height for digital or 0.5 inches for print.</p>
            <p><strong>Color Variations:</strong> Use the gradient version on light backgrounds, white version on dark backgrounds.</p>
            <p><strong>Animation:</strong> Use animated version for splash screens and main landing pages only.</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center py-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
