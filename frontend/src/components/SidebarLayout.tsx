"use client";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Home,
  BarChart3,
  Wallet,
  Grid3x3,
  Settings,
  User,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut,
  LucideIcon,
  Banknote,
  Info,
  DollarSign,
  Book,
} from "lucide-react";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  image?: string | null;
};

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const userRole = sessionUser?.role || sessionUser?.email;
  const isAdmin = userRole === "admin" || 
                  sessionUser?.email === "admin@advancia.com" ||
                  sessionUser?.email?.includes("admin");

  const displayName = useMemo(() => {
    if (sessionUser?.name && sessionUser.name.trim().length > 0) {
      return sessionUser.name;
    }
    if (sessionUser?.email) {
      return sessionUser.email.split("@")[0];
    }
    return "Guest";
  }, [sessionUser?.name, sessionUser?.email]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    const primary = parts[0]?.[0] ?? "";
    const secondary = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${primary}${secondary}`.toUpperCase();
  }, [displayName]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/assets", label: "My Assets", icon: Wallet },
    { href: "/eth/transactions", label: "ETH Activity", icon: Activity },
    { href: "/loans", label: "Loans", icon: Banknote },
    { href: "/features", label: "Features", icon: Grid3x3 },
    { href: "/about", label: "About", icon: Info },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/docs", label: "Docs", icon: Book },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const NavLink = ({ href, label, icon: Icon, onClick }: NavLinkProps) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`
          group relative flex items-center gap-3 px-4 py-3.5 rounded-xl
          transition-all duration-300 ease-out
          ${isActive 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700'
          }
          active:scale-95 touch-manipulation
        `}
      >
        <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
        <span className="font-medium truncate">{label}</span>
        {!isActive && (
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Advancia
            </span>
            <span className="text-purple-400">Pay</span>
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all touch-manipulation"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Advancia
                  </span>
                  <span className="text-purple-400">Pay</span> Ledger
                </h1>
              </div>
              
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
                
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3.5 rounded-xl
                      border-2 border-red-200 mt-4
                      ${pathname === '/admin'
                        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                        : 'text-red-600 hover:bg-red-50'
                      }
                      transition-all active:scale-95 touch-manipulation
                    `}
                  >
                    <Shield className="h-5 w-5 shrink-0" />
                    <span className="font-bold">Admin Panel</span>
                  </Link>
                )}
              </nav>

              <div className="p-4 border-t bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex items-center gap-3 mb-3">
                  {sessionUser?.image ? (
                    <Image
                      src={sessionUser.image}
                      alt={displayName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {initials || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    {sessionUser?.email && (
                      <p className="text-xs text-gray-500 truncate">{sessionUser.email}</p>
                    )}
                  </div>
                </div>
                <Link
                  href="/api/auth/signout"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all active:scale-95 touch-manipulation shadow-md"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r flex-col shadow-xl">
        <div className="p-6 border-b bg-gradient-to-br from-white to-blue-50">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Advancia
            </span>
            <span className="text-purple-400">Pay</span> Ledger
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          
          {isAdmin && (
            <Link
              href="/admin"
              className={`
                group flex items-center gap-3 px-4 py-3.5 rounded-xl
                border-2 border-red-200 mt-4
                ${pathname === '/admin'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                  : 'text-red-600 hover:bg-red-50'
                }
                transition-all active:scale-95
              `}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span className="font-bold">Admin Panel</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="flex items-center gap-3 mb-3">
            {sessionUser?.image ? (
              <Image
                src={sessionUser.image}
                alt={displayName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500 shrink-0"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {initials || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              {sessionUser?.email && (
                <p className="text-xs text-gray-500 truncate">{sessionUser.email}</p>
              )}
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all active:scale-95 shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}


