"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Bell, CalendarDays, Eye, EyeOff, MessageCircle, Sparkles, Wallet } from "lucide-react";

interface ProfileOverviewCardProps {
  name?: string;
  email?: string;
  balance?: number;
  accountNumber?: string;
  profileImage?: string | null;
  initials?: string;
  onTransactionsClick?: () => void;
  onTopUpClick?: () => void;
  onNotificationClick?: () => void;
  onSupportClick?: () => void;
  topUpLoading?: boolean;
}

// Formats an account number into groups while masking the sensitive section.
function maskAccountNumber(accountNumber?: string, fallbackSeed?: string) {
  if (accountNumber) {
    const digits = accountNumber.replace(/[^0-9]/g, "").padStart(8, "0");
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }

  if (!fallbackSeed) {
    return "3886 •••• •••• 2042";
  }

  const seedDigits = Array.from(fallbackSeed)
    .map((char) => char.charCodeAt(0) % 10)
    .join("");
  const padded = seedDigits.padEnd(8, "7");
  return `${padded.slice(0, 4)} •••• •••• ${padded.slice(4, 8)}`;
}

export default function ProfileOverviewCard({
  name,
  email,
  balance = 0,
  accountNumber,
  profileImage,
  initials,
  onTransactionsClick,
  onTopUpClick,
  onNotificationClick,
  onSupportClick,
  topUpLoading = false,
}: ProfileOverviewCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, [now]);

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(now),
    [now]
  );

  const displayBalance = useMemo(() => {
    if (!showBalance) {
      return "••••••";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(balance);
  }, [balance, showBalance]);

  const maskedAccountNumber = useMemo(
    () => maskAccountNumber(accountNumber, email || name),
    [accountNumber, email, name]
  );

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_50%)]" aria-hidden />
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-100">{greeting}</p>
            <h2 className="mt-1 text-2xl font-semibold">{name || "Advancia User"}</h2>
            {email && <p className="text-sm text-blue-100">{email}</p>}
          </div>
          <div className="flex flex-col items-end gap-3 text-right">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onNotificationClick) {
                    onNotificationClick();
                    return;
                  }
                  alert("No new notifications yet.");
                }}
                className="relative rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-rose-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSupportClick) {
                    onSupportClick();
                    return;
                  }
                  if (typeof window !== "undefined" && window.smartsupp) {
                    window.smartsupp("chat:open");
                  } else {
                    alert("Live support is getting ready. Please try again shortly.");
                  }
                }}
                className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
                aria-label="Open live support"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-blue-100">{formattedDate}</span>
              <span className="text-lg font-semibold tracking-wide">{formattedTime}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={`${name || "User"} profile`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                {initials || "AU"}
              </div>
            )}
            <div>
              <p className="text-sm text-blue-100">Available Balance</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl font-bold">{displayBalance}</span>
                <button
                  type="button"
                  onClick={() => setShowBalance((prev) => !prev)}
                  className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                  aria-label={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                <Wallet className="h-4 w-4" />
                <span>{maskedAccountNumber}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:p-5 lg:w-auto">
            <button
              type="button"
              onClick={onTransactionsClick}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/90 px-6 py-2 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition hover:bg-white"
            >
              <Sparkles className="h-4 w-4" /> Transactions
            </button>
            <button
              type="button"
              onClick={onTopUpClick}
              disabled={topUpLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/70 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarDays className="h-4 w-4" /> {topUpLoading ? "Opening checkout…" : "Top up"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
