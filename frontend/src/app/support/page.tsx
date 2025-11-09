"use client";

import { useState } from "react";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import { Mail, Send } from "lucide-react";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setMessage({
          type: "error",
          text: "Authentication token not found. Please log in again.",
        });
        return;
      }

      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit support ticket");
      }

      setMessage({
        type: "success",
        text: "✅ Support ticket submitted successfully! Our team will respond shortly.",
      });
      setFormData({
        subject: "",
        category: "GENERAL",
        priority: "MEDIUM",
        message: "",
      });
    } catch (error) {
      console.error("Support ticket error:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to submit support ticket. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Contact Support
            </h1>
            <p className="text-xl text-slate-600">
              Have a question or issue? We&apos;re here to help. Submit a support
              ticket and our team will respond within 24 hours.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 bg-white transition-colors"
                  >
                    <option value="GENERAL">General Inquiry</option>
                    <option value="BILLING">Billing Issue</option>
                    <option value="TECHNICAL">Technical Issue</option>
                    <option value="SECURITY">Security Concern</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 bg-white transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 resize-none transition-colors"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Minimum 10 characters required
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                {loading ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </form>

            {/* Help Info */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                What to expect:
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>
                    Our support team reviews all tickets within 24 hours
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>
                    You&apos;ll receive updates via email as your ticket progresses
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>
                    Critical security issues receive priority handling
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
