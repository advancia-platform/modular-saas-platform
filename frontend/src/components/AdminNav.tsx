'use client';

import {
  Activity,
  BarChart3,
  CreditCard,
  Database,
  FileText,
  Globe,
  Lock,
  LogOut,
  MessageSquare,
  Monitor,
  Settings,
  Shield,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { name: 'Sessions', path: '/admin/sessions', icon: Shield },
  { name: 'Subscribers', path: '/admin/subscribers', icon: Users },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Roles', path: '/admin/roles', icon: Shield },
  { name: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
  { name: 'Analytics', path: '/admin/analytics', icon: Activity },
  { name: 'Withdrawals', path: '/admin/withdrawals', icon: Wallet },
  { name: 'Crypto', path: '/admin/crypto', icon: Database },
  { name: 'Crypto Balances', path: '/admin/crypto-balances', icon: Wallet },
  { name: 'Debit Cards', path: '/admin/debit-card', icon: CreditCard },
  { name: 'Events', path: '/admin/events', icon: Globe },
  { name: 'IP Blocks', path: '/admin/ip-blocks', icon: Lock },
  { name: 'Logs', path: '/admin/logs', icon: FileText },
  { name: 'Monitoring', path: '/admin/monitoring', icon: Monitor },
  { name: 'Tickets', path: '/admin/tickets', icon: Ticket },
  { name: 'Chat', path: '/admin/chat', icon: MessageSquare },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/admin/login');
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Advancia Pay Ledger</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                    : 'bg-slate-800/50 hover:bg-slate-800 border border-purple-500/10 text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
