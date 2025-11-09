"use client";

import SidebarLayout from "@/components/SidebarLayout";
import RewardsDashboard from "@/components/RewardsDashboard";
import TokenWallet from "@/components/TokenWallet";
import HealthDashboard from "@/components/HealthDashboard";
import { useSession } from "next-auth/react";

const DEMO_ANALYTICS_USER_ID = "00000000-0000-0000-0000-000000000002";

type SessionUser = {
  id?: string;
  email?: string;
  role?: string;
};

export default function AnalyticsPage() {
  const { data: session } = useSession();

  const sessionUser = session?.user as SessionUser | undefined;
  const userId = sessionUser?.id && sessionUser.id.length > 0 ? sessionUser.id : DEMO_ANALYTICS_USER_ID;
  
  // Check if user is admin
  const userRole = sessionUser?.role || sessionUser?.email;
  const isAdmin = userRole === "admin" || 
                  sessionUser?.email === "admin@advancia.com" ||
                  sessionUser?.email?.includes("admin");

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Analytics Control Center</p>
              <h1 className="mt-1 text-4xl font-bold text-slate-900">Performance & Wellness Intelligence</h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Track your rewards and wellness metrics from a single, streamlined view.
              </p>
            </div>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-8">
              <RewardsDashboard userId={userId} />
            </div>
            {isAdmin && (
              <div className="space-y-8">
                <TokenWallet userId={userId} />
              </div>
            )}
          </section>

          <section>
            <HealthDashboard userId={userId} />
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
