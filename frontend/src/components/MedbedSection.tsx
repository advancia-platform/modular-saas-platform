"use client";
import { motion } from "framer-motion";
import DashboardRouteGuard from "./DashboardRouteGuard";

export default function MedbedSection() {
  return (
    <DashboardRouteGuard>
      <section id="medbed" className="py-20 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-blue-700">Health Insights</h2>
          <p className="text-gray-600">View heart-rate and wellness analytics from connected devices.</p>
        </div>

        <motion.div
          className="mx-auto max-w-xl bg-white rounded-xl shadow p-6 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-semibold text-lg mb-4 text-blue-600">Heart-Rate Analysis</h3>
          <div className="h-32 bg-gradient-to-r from-teal-400 to-blue-400 rounded-md animate-pulse" />
          <p className="mt-4 text-gray-500 text-sm">Sample data for visualization only.</p>
        </motion.div>
      </section>
    </DashboardRouteGuard>
  );
}
