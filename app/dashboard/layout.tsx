'use client';

import { useEffect } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { navigation, Sidebar } from '@/components/dashboard/sidebar';
import { Loader as Loader2, Menu, House } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="md:hidden sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-md">
              <House className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">RealsAI</p>
              <p className="text-[10px] text-slate-500 -mt-0.5">Emlak Asistanı</p>
            </div>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menüyü aç">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] max-w-[320px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Mobil Menü</SheetTitle>
              </SheetHeader>
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="md:flex md:min-h-screen">
        <aside className="hidden md:block md:w-64 md:fixed md:inset-y-0">
          <Sidebar />
        </aside>

        <div className="flex-1 md:ml-64">
          <main className="p-4 sm:p-6 md:p-8 pb-24 md:pb-8">{children}</main>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        <div className="grid grid-cols-5 gap-1">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] transition-colors',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600'
                )}
              >
                <item.icon className="h-4 w-4 mb-0.5" />
                <span className="truncate max-w-[56px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
