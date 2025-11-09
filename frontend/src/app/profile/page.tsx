"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Camera, Mail, Shield, UserCircle, Users } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import ProfileOverviewCard from "@/components/ProfileOverviewCard";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const initialPreview = sessionUser?.image ?? null;
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreview);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  };

  // Refresh preview if a session image arrives later.
  useEffect(() => {
    if (!sessionUser?.image) return;
    setPreviewUrl((current) => current ?? sessionUser.image ?? null);
  }, [sessionUser?.image]);

  // Clean up blob URLs when the component unmounts.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const calculatedRole = useMemo(() => {
    const role = sessionUser?.role || sessionUser?.email;
    if (!role) return "User";

    if (role === "admin" || role.includes("admin")) {
      return "Administrator";
    }

    return "User";
  }, [sessionUser?.role, sessionUser?.email]);

  const notifyTopUpError = (message: string) => {
    console.error("Top up error:", message);
    alert(message);
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
            userId: sessionUser?.id,
            email: sessionUser?.email,
            source: "profile",
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

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 md:p-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your personal information, manage your avatar, and confirm your account status.
            </p>
          </div>

          <ProfileOverviewCard
            name={displayName}
            email={sessionUser?.email ?? undefined}
            balance={0}
            accountNumber={derivedAccountNumber}
            profileImage={previewUrl}
            initials={initials}
            onTopUpClick={() => {
              if (topUpLoading) return;
              handleTopUp();
            }}
            onNotificationClick={() => alert("No new notifications")}
            onSupportClick={() => {
              if (typeof window !== "undefined" && window.smartsupp) {
                window.smartsupp("chat:open");
              } else {
                alert("Live support is getting ready. Please try again shortly.");
              }
            }}
            topUpLoading={topUpLoading}
          />

          <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <section className="rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex flex-col items-center text-center">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`${displayName}'s profile photo`}
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-full object-cover shadow-lg ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-semibold text-white shadow-lg">
                    {initials}
                  </div>
                )}

                <label className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700">
                  <Camera className="h-4 w-4" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <p className="mt-3 text-xs text-slate-500">
                  Your image stays in this session only. Save to backend storage to persist this avatar.
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <UserCircle className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Full Name</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">{displayName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Shield className="h-4 w-4 text-emerald-500" /> {calculatedRole}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800 break-all">
                      <Mail className="h-4 w-4 text-blue-500" />
                      {sessionUser?.email || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Account Number</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">{derivedAccountNumber || "Pending"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <Users className="h-5 w-5 text-purple-500" />
                  Security & Access
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li>• Access limited to your profile and authorized dashboard sections.</li>
                  <li>• Uploading a picture here updates your on-screen avatar immediately.</li>
                  <li>• Contact an administrator for role upgrades or additional privileges.</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
