'use client';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BellIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
  WalletIcon,
  XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
  navItems?: NavItem[];
  onLogout?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboardIcon className="h-4 w-4" /> },
  { label: 'Wallet', href: '/wallet', icon: <WalletIcon className="h-4 w-4" /> },
  { label: 'Settings', href: '/settings', icon: <SettingsIcon className="h-4 w-4" /> },
];

export function Header({
  user,
  navItems = defaultNavItems,
  onLogout,
  showNotifications = true,
  notificationCount = 0,
  onNotificationClick,
  className,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href || pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" showText={false} />
            <span className="font-bold text-xl hidden sm:inline-block">Advancia</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {showNotifications && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={onNotificationClick}
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  {user.role && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {user.role}
                    </span>
                  )}
                </div>
                {onLogout && (
                  <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
                    <LogOutIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <UserIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{user.name || user.email}</p>
                      {user.role && <p className="text-xs text-muted-foreground">{user.role}</p>}
                    </div>
                  </div>
                  {onLogout && (
                    <Button
                      variant="outline"
                      className="mx-3"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOutIcon className="h-4 w-4 mr-2" />
                      Log out
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Button variant="outline" asChild>
                    <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
