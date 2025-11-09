"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  TouchButton,
  MobileCard,
  BottomSheet,
  MobileInput,
} from "@/components/mobile";
import {
  Save,
  Mail,
  Shield,
  Bell,
  CheckCircle,
  Download,
  Settings,
  CreditCard,
  Lock,
  User,
  Phone,
  MapPin,
} from "lucide-react";

export default function MobileComponentsDemo() {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSaveDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Demo save completed!");
    }, 2000);
  };

  const handleEmailValidation = () => {
    if (!email.includes("@")) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
      alert(`Email validated: ${email}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Mobile Components Demo
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Professional, touch-optimized UI components for mobile-first design
          </p>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* TouchButton Showcase */}
          <MobileCard
            title="TouchButton Component"
            subtitle="Touch-optimized buttons with multiple variants and sizes"
            icon={Settings}
            headerGradient="from-blue-500 to-cyan-600"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Variants
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TouchButton variant="primary" icon={Save} fullWidth>
                    Primary Button
                  </TouchButton>
                  <TouchButton variant="success" icon={CheckCircle} fullWidth>
                    Success Button
                  </TouchButton>
                  <TouchButton variant="danger" icon={Shield} fullWidth>
                    Danger Button
                  </TouchButton>
                  <TouchButton variant="warning" icon={Bell} fullWidth>
                    Warning Button
                  </TouchButton>
                  <TouchButton variant="secondary" icon={Download} fullWidth>
                    Secondary Button
                  </TouchButton>
                  <TouchButton variant="ghost" icon={Lock} fullWidth>
                    Ghost Button
                  </TouchButton>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Sizes
                </h3>
                <div className="space-y-3">
                  <TouchButton size="sm" icon={User} fullWidth>
                    Small (44px min)
                  </TouchButton>
                  <TouchButton size="md" icon={User} fullWidth>
                    Medium (48px min)
                  </TouchButton>
                  <TouchButton size="lg" icon={User} fullWidth>
                    Large (52px min)
                  </TouchButton>
                  <TouchButton size="xl" icon={User} fullWidth>
                    Extra Large (56px min)
                  </TouchButton>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  States
                </h3>
                <div className="space-y-3">
                  <TouchButton
                    variant="primary"
                    icon={Save}
                    fullWidth
                    loading={loading}
                    onClick={handleSaveDemo}
                  >
                    {loading ? "Processing..." : "Click to Test Loading"}
                  </TouchButton>
                  <TouchButton
                    variant="secondary"
                    icon={Lock}
                    fullWidth
                    disabled
                  >
                    Disabled Button
                  </TouchButton>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Icon Positions
                </h3>
                <div className="space-y-3">
                  <TouchButton
                    variant="primary"
                    icon={Mail}
                    iconPosition="left"
                    fullWidth
                  >
                    Icon Left
                  </TouchButton>
                  <TouchButton
                    variant="primary"
                    icon={Mail}
                    iconPosition="right"
                    fullWidth
                  >
                    Icon Right
                  </TouchButton>
                </div>
              </div>
            </div>
          </MobileCard>

          {/* MobileInput Showcase */}
          <MobileCard
            title="MobileInput Component"
            subtitle="Touch-friendly input fields with validation"
            icon={Mail}
            headerGradient="from-green-500 to-teal-600"
          >
            <div className="space-y-4">
              <MobileInput
                id="demo-email"
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                helperText="We'll never share your email with anyone"
              />

              <MobileInput
                id="demo-phone"
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="+1 (555) 000-0000"
                helperText="Include your country code"
              />

              <MobileInput
                id="demo-password"
                label="Password"
                icon={Lock}
                type="password"
                placeholder="Enter your password"
              />

              <MobileInput
                id="demo-address"
                label="Address"
                icon={MapPin}
                type="text"
                placeholder="123 Main St, City, State"
              />

              <TouchButton
                variant="success"
                icon={CheckCircle}
                fullWidth
                onClick={handleEmailValidation}
              >
                Validate Email
              </TouchButton>
            </div>
          </MobileCard>

          {/* BottomSheet Showcase */}
          <MobileCard
            title="BottomSheet Component"
            subtitle="iOS-style bottom modal with drag-to-dismiss"
            icon={CreditCard}
            headerGradient="from-purple-500 to-pink-600"
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click the button below to open a bottom sheet modal. You can
                drag it down to dismiss!
              </p>

              <TouchButton
                variant="primary"
                icon={Settings}
                fullWidth
                onClick={() => setShowBottomSheet(true)}
              >
                Open Bottom Sheet Demo
              </TouchButton>
            </div>
          </MobileCard>

          {/* Interactive Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <MobileCard
              title="Security"
              subtitle="Account protection"
              icon={Shield}
              headerGradient="from-red-500 to-orange-600"
              onClick={() => alert("Security card clicked!")}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click this card to interact. Cards can have onClick handlers for
                navigation.
              </p>
            </MobileCard>

            <MobileCard
              title="Notifications"
              subtitle="Stay updated"
              icon={Bell}
              headerGradient="from-indigo-500 to-purple-600"
              onClick={() => alert("Notifications card clicked!")}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This card demonstrates hover and active states optimized for
                touch.
              </p>
            </MobileCard>
          </motion.div>

          {/* Responsive Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 sm:p-6"
          >
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Responsive Breakpoints
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                📱 <strong>Mobile (&lt; 640px)</strong>: Single column, 48px+
                touch targets
              </p>
              <p>
                📱 <strong>Tablet (640-1024px)</strong>: Two columns, optimized
                spacing
              </p>
              <p>
                🖥️ <strong>Desktop (&gt; 1024px)</strong>: Multi-column,
                enhanced interactions
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Sheet Demo */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Bottom Sheet Demo"
        subtitle="Drag down or click X to close"
        height="auto"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This is a bottom sheet component with drag-to-dismiss functionality.
            Try dragging it down to close!
          </p>

          <MobileInput
            id="sheet-email"
            label="Email in Sheet"
            icon={Mail}
            type="email"
            placeholder="test@example.com"
          />

          <MobileInput
            id="sheet-name"
            label="Full Name"
            icon={User}
            type="text"
            placeholder="John Doe"
          />

          <div className="flex gap-3 pt-4">
            <TouchButton
              variant="success"
              icon={Save}
              fullWidth
              onClick={() => {
                alert("Saved from bottom sheet!");
                setShowBottomSheet(false);
              }}
            >
              Save Changes
            </TouchButton>
            <TouchButton
              variant="ghost"
              fullWidth
              onClick={() => setShowBottomSheet(false)}
            >
              Cancel
            </TouchButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
