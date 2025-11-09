"use client";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues
const CryptoAdminPanel = dynamic(() => import("@/components/CryptoAdminPanel"), { ssr: false });

export default function AdminCryptoPage() {
  return <CryptoAdminPanel />;
}
