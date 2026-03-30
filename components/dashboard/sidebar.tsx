'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Chrome as Home, Plus, FolderOpen, User, LogOut, Users, CalendarClock } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';

export const navigation = [
  { name: 'Ana Sayfa', href: '/dashboard', icon: Home },
  { name: 'Yeni İlan', href: '/dashboard/new-listing', icon: Plus },
  { name: 'İlanlarım', href: '/dashboard/listings', icon: FolderOpen },
  { name: 'Müşteriler', href: '/dashboard/customers', icon: Users },
  { name: 'Randevular', href: '/dashboard/appointments', icon: CalendarClock },
  { name: 'Profil', href: '/dashboard/profile', icon: User },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <div className={cn('flex flex-col h-full bg-slate-900 text-white', className)}>
      <div className="flex items-center space-x-3 p-6 border-b border-slate-800">
        <div className="bg-white p-2 rounded-lg">
          <Home className="h-6 w-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold">RealsAI</h1>
          <p className="text-xs text-slate-400">Emlakçı Copilot</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-white text-slate-900 font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={async () => {
            onNavigate?.();
            await signOut();
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}
