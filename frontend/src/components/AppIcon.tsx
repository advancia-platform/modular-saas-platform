"use client";
import Image from "next/image";

export default function AppIcon({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/favicon.ico"
      alt="Advancia Pay Ledger Icon"
      width={size}
      height={size}
      className="rounded-md"
      priority
    />
  );
}
