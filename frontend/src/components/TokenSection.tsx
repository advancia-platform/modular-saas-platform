"use client";
import { motion } from "framer-motion";

export default function TokenSection() {
  return (
    <section id="token" className="py-20 bg-gray-50">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-blue-700">Digital Rewards</h2>
        <p className="text-gray-600">Earn and manage your Advancia Tokens securely.</p>
      </div>

      <motion.div
        className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="font-semibold text-lg mb-2 text-blue-600">Wallet Balance</h3>
        <p className="text-3xl font-bold text-teal-600 mb-4">₦12,450.00</p>

        <div className="flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Withdraw</button>
          <button className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition">Cash-Out</button>
          <button className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 transition">Recovery</button>
        </div>

        <p className="mt-4 text-sm text-gray-500">Actions simulate token movement; no blockchain involved.</p>
      </motion.div>
    </section>
  );
}
