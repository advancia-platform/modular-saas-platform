"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Award,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import SummaryCard from "@/components/SummaryCard";
import BalanceDropdown from "@/components/BalanceDropdown";
import TransactionList from "@/components/TransactionList";
import BalanceChart from "@/components/BalanceChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProfileOverviewCard from "@/components/ProfileOverviewCard";
import { useBalance } from "@/hooks/useBalance";
import { useTransactions } from "@/hooks/useTransactions";
import { useSoundFeedback } from "@/hooks/useSoundFeedback";
import { useSession } from "next-auth/react";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function Dashboard() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [hasRecentActivity, setHasRecentActivity] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const previousTransactionCount = useRef<number>(0);
  
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = sessionUser?.id && sessionUser.id.length > 0 ? sessionUser.id : DEMO_USER_ID;

  const displayName = useMemo(() => {
    if (sessionUser?.name && sessionUser.name.trim().length > 0) {
      return sessionUser.name;
    }
    if (sessionUser?.email) {
      return sessionUser.email.split("@")[0];
    }
    return "Advancia User";
  }, [sessionUser?.name, sessionUser?.email]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "AU";
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${first}${last}`.toUpperCase();
  }, [displayName]);

  const derivedAccountNumber = useMemo(() => {
    if (sessionUser?.id) {
      const digits = sessionUser.id.replace(/[^0-9]/g, "");
      if (digits.length >= 8) return digits.slice(0, 12);
      if (digits.length > 0) return digits.padEnd(8, "7");
    }

    if (sessionUser?.email) {
      const ascii = Array.from(sessionUser.email)
        .map((char) => char.charCodeAt(0) % 10)
        .join("");
      return ascii.slice(0, 12).padEnd(8, "5");
    }

    return undefined;
  }, [sessionUser?.id, sessionUser?.email]);

  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
  } = useBalance(userId);
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions(userId);
  const { playClick, hapticFeedback } = useSoundFeedback();

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (transactionsLoading) return;

    const txArray = Array.isArray(transactions) ? transactions : [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (
      previousTransactionCount.current &&
      txArray.length > previousTransactionCount.current
    ) {
      setHasRecentActivity(true);
      timer = setTimeout(() => setHasRecentActivity(false), 4000);
    }

    previousTransactionCount.current = txArray.length;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [transactions, transactionsLoading]);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    let bonuses = 0;

    // Ensure transactions is an array before iterating
    const txArray = Array.isArray(transactions) ? transactions : [];

    txArray.forEach((tx) => {
      const amount = typeof tx.amount === "number" ? tx.amount : Number(tx.amount);
      if (Number.isNaN(amount)) return;

      switch (tx.type) {
        case "credit":
          credits += amount;
          break;
        case "bonus":
          credits += amount;
          bonuses += amount;
          break;
        case "debit":
        case "transfer":
          debits += Math.abs(amount);
          break;
        default:
          break;
      }
    });

    const volume = credits + debits;
    const average = txArray.length ? volume / txArray.length : 0;

    return {
      credits,
      debits,
      bonuses,
      volume,
      average,
    };
  }, [transactions]);

  const netBalance = balance?.total ?? totals.credits - totals.debits;

  const handleShowBreakdown = () => {
    if (!balance) return;
    playClick();
    hapticFeedback();
    setShowBreakdown(true);
    setHasRecentActivity(false);
  };

  const notifyTopUpError = async (message: string) => {
    // Log error silently for debugging
    console.error("Top up error:", message);
    
    // Send error to admin endpoint (RPA monitoring)
    try {
      await fetch(`${API_URL}/api/admin/error-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'checkout_error',
          message,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {/* Silent fail */});
    } catch {
      // Silent fail - don't notify user about monitoring errors
    }
    
    // Show generic friendly message to user (not technical details)
    alert("We're processing your request. Please try again in a moment.");
  };

  const handleTopUp = async () => {
    const amountInput = prompt("Enter the amount to add (USD):", "50");
    if (!amountInput) return;

    const parsedAmount = Number(amountInput);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      notifyTopUpError("Please provide a valid amount greater than zero.");
      return;
    }

    try {
      setTopUpLoading(true);
      const response = await fetch(`${API_URL}/api/payments/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          metadata: {
            userId,
            email: sessionUser?.email,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const reason = (errorBody as { error?: string } | null)?.error;
        notifyTopUpError(reason || "Unable to start checkout session.");
        return;
      }

      const payload = (await response.json()) as { url?: string };
      if (payload.url) {
        window.location.href = payload.url;
      } else {
        notifyTopUpError("Checkout response missing redirect URL.");
      }
    } catch (error) {
      console.error("Top up request failed", error);
      notifyTopUpError("Network error while starting checkout.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const summaryCards = [
    {
      title: "Total Credits",
      value: totals.credits,
      icon: <TrendingUp className="w-6 h-6" />,
      iconBg: "bg-green-500",
      gradient: "from-green-50 to-emerald-100",
      delay: 0,
    },
    {
      title: "Total Debits",
      value: totals.debits,
      icon: <TrendingDown className="w-6 h-6" />,
      iconBg: "bg-rose-500",
      gradient: "from-rose-50 to-red-100",
      delay: 0.1,
    },
    {
      title: "Net Balance",
      value: netBalance,
      icon: <Wallet className="w-6 h-6" />,
      iconBg: "bg-blue-500",
      gradient: "from-blue-50 to-sky-100",
      delay: 0.2,
      clickable: true,
    },
  ];

  const isLoading = balanceLoading || transactionsLoading;
  const errorMessage = balanceError || transactionsError;
  const txArray = Array.isArray(transactions) ? transactions : [];

  // Show loading spinner on initial load
  if (isInitialLoading) {
    return <LoadingSpinner size="lg" variant="both" message="Loading Dashboard..." />;
  }

  if (isLoading && !balance && txArray.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 text-gray-800 p-6 md:p-10">
        <div className="max-w-7xl mx-auto flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-blue-600">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
            <p className="text-sm font-semibold">Loading dashboard data…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 text-gray-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-500 tracking-wide uppercase flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" /> Real-time ledger overview
              </p>
              <h1 className="mt-1 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Advancia Pay Ledger
              </h1>
              <p className="mt-2 max-w-xl text-base text-gray-600">
                Track balances, rewards, and token activity across your multi-currency wallets with instant updates.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (topUpLoading) return;
                  playClick();
                  hapticFeedback();
                  handleTopUp();
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowUpRight className="w-5 h-5" />
                Add Funds
              </button>
              <button
                onClick={() => {
                  playClick();
                  hapticFeedback();
                }}
                className="flex items-center gap-2 rounded-xl border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <TrendingDown className="w-5 h-5" />
                Withdraw
              </button>
            </div>
          </div>

          <ProfileOverviewCard
            name={displayName}
            email={sessionUser?.email ?? undefined}
            balance={balance?.total ?? totals.credits - totals.debits}
            accountNumber={derivedAccountNumber}
            profileImage={sessionUser?.image ?? null}
            initials={initials}
            onTransactionsClick={handleShowBreakdown}
            onTopUpClick={() => {
              if (topUpLoading) return;
              playClick();
              hapticFeedback();
              handleTopUp();
            }}
            onNotificationClick={() => {
              playClick();
              hapticFeedback();
              alert("All caught up — no new notifications.");
            }}
            onSupportClick={() => {
              playClick();
              hapticFeedback();
              if (typeof window !== "undefined" && window.smartsupp) {
                window.smartsupp("chat:open");
              } else {
                alert("Live support is loading. Please try again in a moment.");
              }
            }}
            topUpLoading={topUpLoading}
          />
        </header>

        {errorMessage && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Loading your latest data...</span>
            </div>
          </div>
        )}

        {/* Empty state for new users */}
        {!errorMessage && txArray.length === 0 && balance?.total === 0 && (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Welcome to Advancia!</h3>
              <p className="text-slate-600">
                Your dashboard is ready. Get started by adding funds to unlock all platform features including crypto trading, token management, and rewards.
              </p>
              <button
                onClick={() => {
                  if (!topUpLoading) {
                    playClick();
                    hapticFeedback();
                    handleTopUp();
                  }
                }}
                disabled={topUpLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                <ArrowUpRight className="w-5 h-5" />
                {topUpLoading ? 'Processing...' : 'Add Your First Funds'}
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={Number.isFinite(card.value) ? card.value : 0}
              icon={card.icon}
              iconBg={card.iconBg}
              gradient={card.gradient}
              delay={card.delay}
              clickable={card.clickable}
              badge={
                card.title === "Net Balance" && hasRecentActivity ? (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                    </span>
                    Updated
                  </span>
                ) : null
              }
              {...(card.title === "Net Balance"
                ? {
                    onClick: handleShowBreakdown,
                  }
                : { onClick: undefined })}
            />
          ))}
        </section>

        {balance?.portfolio && (
          <section className="grid gap-4 sm:grid-cols-3">
            {([
              {
                label: "Admin USD Credits",
                value: balance.portfolio.USD,
                suffix: "USD",
              },
              {
                label: "Admin ETH Drops",
                value: balance.portfolio.ETH,
                suffix: "ETH",
              },
              {
                label: "Admin BTC Drops",
                value: balance.portfolio.BTC,
                suffix: "BTC",
              },
            ] as const).map((entry) => (
              <div
                key={entry.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{entry.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {entry.value.toLocaleString(undefined, {
                    maximumFractionDigits: entry.suffix === "USD" ? 2 : 6,
                  })}{" "}
                  <span className="text-base font-semibold text-slate-400">
                    {entry.suffix}
                  </span>
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Latest totals credited from admin treasury transfers.
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <TransactionList transactions={txArray} loading={transactionsLoading} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">{txArray.length}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <PieChart className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Combined credits, debits, and bonus events captured in the last sync.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Average Ticket Size</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      ${Number.isFinite(totals.average) ? totals.average.toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Based on gross transaction volume over the current reporting period.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Monthly Rewards</p>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      ${(balance?.earnings ?? totals.bonuses).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-500">
                    <Award className="w-6 h-6" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Auto-accrued from daily payout multipliers.
                </p>
              </div>
              <BalanceChart />
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showBreakdown && balance && (
          <BalanceDropdown balance={balance} onClose={() => setShowBreakdown(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
