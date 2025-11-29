'use client';

import { hasPermission, useAuth, UserRole } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Gift,
  Key,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: 'red' | 'yellow' | 'green' | 'blue';
  allowedRoles?: UserRole[]; // Roles that can see this item
  permission?: string; // Permission required to see this item
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  {
    name: 'Users',
    path: '/admin/users',
    icon: Users,
    permission: 'users',
    allowedRoles: ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'admin'],
  },
  {
    name: 'Payments',
    path: '/admin/payments',
    icon: CreditCard,
    permission: 'payments',
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin'],
  },
  {
    name: 'Ledger',
    path: '/admin/ledger',
    icon: BookOpen,
    permission: 'ledger',
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin'],
  },
  {
    name: 'Credits',
    path: '/admin/credits',
    icon: Gift,
    permission: 'manage_ledger',
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin'],
  },
  {
    name: 'Withdrawals',
    path: '/admin/withdrawals',
    icon: DollarSign,
    badge: 3,
    badgeColor: 'yellow',
    permission: 'payments',
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin'],
  },
  {
    name: 'Crypto',
    path: '/admin/crypto',
    icon: Wallet,
    permission: 'crypto',
    allowedRoles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'admin'],
  },
  {
    name: 'Analytics',
    path: '/admin/analytics',
    icon: TrendingUp,
    permission: 'analytics',
  },
  {
    name: 'Sessions',
    path: '/admin/sessions',
    icon: Shield,
    allowedRoles: ['SUPER_ADMIN', 'admin'],
  },
  { name: 'Logs', path: '/admin/logs', icon: FileText, allowedRoles: ['SUPER_ADMIN', 'admin'] },
  {
    name: 'Rate Limits',
    path: '/admin/rate-limits',
    icon: Clock,
    allowedRoles: ['SUPER_ADMIN', 'admin'],
  },
  {
    name: 'Alerts',
    path: '/admin/alert-policies',
    icon: Bell,
    allowedRoles: ['SUPER_ADMIN', 'admin'],
  },
  {
    name: 'IP Blocks',
    path: '/admin/ip-blocks',
    icon: AlertTriangle,
    allowedRoles: ['SUPER_ADMIN', 'admin'],
  },
  { name: 'API Keys', path: '/admin/api-keys', icon: Key, allowedRoles: ['SUPER_ADMIN', 'admin'] },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    permission: 'settings',
    allowedRoles: ['SUPER_ADMIN', 'admin'],
  },
];

const badgeColors = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
};

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export default function AdminSidebar({
  collapsed: controlledCollapsed,
  onToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  const handleLogout = () => {
    // Use the logout page for cleaner token cleanup
    router.push('/logout');
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;

    // SUPER_ADMIN sees everything
    if (user.role === 'SUPER_ADMIN' || user.role === 'admin') return true;

    // Check permission-based access
    if (item.permission && hasPermission(user.role, item.permission)) return true;

    // Check role-based access
    if (item.allowedRoles && item.allowedRoles.includes(user.role)) return true;

    // If no restrictions, show to all
    if (!item.allowedRoles && !item.permission) return true;

    return false;
  });

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
        {!collapsed && (
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Advancia" className="w-8 h-8" />
            <span className="font-bold text-white text-lg">Admin</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin/dashboard">
            <img src="/logo-icon.svg" alt="Advancia" className="w-8 h-8" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-slate-800 group',
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border-l-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-purple-400')} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-semibold rounded-full text-white',
                            badgeColors[item.badgeColor || 'blue']
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer/Logout */}
      <div className="p-2 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors',
            'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
