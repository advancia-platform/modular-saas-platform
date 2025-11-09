"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SidebarLayout from "@/components/SidebarLayout";
import {
  Heart,
  Brain,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Booking {
  id: string;
  chamberName: string;
  chamberType: string;
  sessionDate: string;
  duration: number;
  cost: string;
  status: string;
  effectiveness?: number;
  paymentStatus: string;
}

export default function MedBedsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    avgEffectiveness: 0,
    upcomingSessions: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/medbeds/my-bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setBookings(data);

        // Calculate stats
        const completed = data.filter((b: Booking) => b.status === "completed");
        const upcoming = data.filter((b: Booking) => b.status === "scheduled");
        const avgEff =
          completed.length > 0
            ? completed.reduce(
                (sum: number, b: Booking) => sum + (b.effectiveness || 0),
                0
              ) / completed.length
            : 0;

        setStats({
          totalSessions: data.length,
          completedSessions: completed.length,
          avgEffectiveness: Math.round(avgEff),
          upcomingSessions: upcoming.length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const chamberTypes = [
    {
      id: "recovery",
      name: "Recovery Chamber",
      icon: Heart,
      color: "from-green-500 to-emerald-600",
      description: "Cellular regeneration and healing optimization",
      features: ["Tissue Repair", "Pain Relief", "Immune Boost"],
      duration: "60-90 min",
      price: "$150/session",
    },
    {
      id: "enhancement",
      name: "Enhancement Chamber",
      icon: Zap,
      color: "from-purple-500 to-pink-600",
      description: "Performance enhancement and vitality boost",
      features: ["Energy Boost", "Mental Clarity", "Stress Relief"],
      duration: "45-60 min",
      price: "$120/session",
    },
    {
      id: "diagnostic",
      name: "Diagnostic Scanner",
      icon: Brain,
      color: "from-blue-500 to-cyan-600",
      description: "Comprehensive health analysis and monitoring",
      features: ["Full Body Scan", "DNA Analysis", "Health Metrics"],
      duration: "30-45 min",
      price: "$100/session",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "scheduled":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Heart className="h-6 w-6" />
                <span className="font-semibold">Med-Bed Health Analytics</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold">
                Advanced Health Monitoring
              </h1>

              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Experience cutting-edge health technology with AI-powered
                diagnostics and personalized wellness solutions
              </p>

              <Link
                href="/medbeds/book"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Book a Session
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        {!loading && session && (
          <div className="max-w-7xl mx-auto px-6 -mt-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Sessions",
                  value: stats.totalSessions,
                  icon: Activity,
                  color: "blue",
                },
                {
                  label: "Completed",
                  value: stats.completedSessions,
                  icon: CheckCircle,
                  color: "green",
                },
                {
                  label: "Avg Effectiveness",
                  value: `${stats.avgEffectiveness}%`,
                  icon: TrendingUp,
                  color: "purple",
                },
                {
                  label: "Upcoming",
                  value: stats.upcomingSessions,
                  icon: Calendar,
                  color: "orange",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                    <span
                      className={`text-3xl font-bold text-${stat.color}-600`}
                    >
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Chamber Types */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Choose Your Chamber
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              Each chamber is designed for specific health goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {chamberTypes.map((chamber, index) => (
              <motion.div
                key={chamber.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 hover:shadow-2xl transition-shadow"
              >
                <div
                  className={`bg-gradient-to-br ${chamber.color} p-8 text-white`}
                >
                  <chamber.icon className="h-12 w-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{chamber.name}</h3>
                  <p className="text-white/90">{chamber.description}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {chamber.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {chamber.duration}
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {chamber.price}
                    </span>
                  </div>

                  <Link
                    href="/medbeds/book"
                    className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
                  >
                    Book Now
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        {!loading && bookings.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 pb-16">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-slate-900">
                  Your Sessions
                </h2>
                <Link
                  href="/medbeds/book"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          booking.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : booking.status === "in-progress"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {booking.status === "completed" ? (
                          <CheckCircle />
                        ) : booking.status === "in-progress" ? (
                          <Activity />
                        ) : (
                          <Calendar />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {booking.chamberName}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.sessionDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.duration} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                      {booking.effectiveness && (
                        <p className="text-sm text-slate-600 mt-1">
                          {booking.effectiveness}% effective
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Notice */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 border border-blue-200"
          >
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Safety First
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  All Med-Bed sessions are monitored by AI-powered health
                  systems and comply with international medical standards.
                  Consult with your healthcare provider before booking if you
                  have any pre-existing conditions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
