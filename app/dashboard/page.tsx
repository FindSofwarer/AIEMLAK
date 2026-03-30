'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { Customer, Listing } from '@/lib/types/database';

type MonthPoint = { label: string; listings: number; customers: number };

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const points: MonthPoint[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('tr-TR', { month: 'short' });

    const listingCount = listings.filter((l) => {
      const ld = new Date(l.created_at);
      return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
    }).length;

    const customerCount = customers.filter((c) => {
      const cd = new Date(c.created_at);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;

    return { label, listings: listingCount, customers: customerCount };
  });

  const maxY = Math.max(1, ...points.map((p) => Math.max(p.listings, p.customers)));

  useEffect(() => {
    const fetchData = async () => {
      const [listingsRes, customersRes] = await Promise.all([
        supabase.from('listings').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
      ]);

      if (listingsRes.data) setListings(listingsRes.data);
      if (customersRes.data) setCustomers(customersRes.data as Customer[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">
      <div className="rounded-3xl p-5 md:p-7 bg-gradient-to-br from-[#0A84FF] via-[#5E5CE6] to-[#BF5AF2] text-white shadow-xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hoş geldin {user?.email?.split('@')[0] || ''}</h1>
        <p className="mt-1 text-white/90 text-sm md:text-base">Sadece gerekli metrikler: portföy, müşteri, hızlı aksiyonlar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Toplam Portföy</p>
            <p className="text-2xl font-semibold mt-1">{listings.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Toplam Müşteri</p>
            <p className="text-2xl font-semibold mt-1">{customers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Link href="/dashboard/new-listing" className="flex-1">
                <Button className="w-full"><Plus className="mr-2 h-4 w-4" />Yeni</Button>
              </Link>
              <Link href="/dashboard/listings" className="flex-1">
                <Button variant="outline" className="w-full"><FolderOpen className="mr-2 h-4 w-4" />Portföy</Button>
              </Link>
              <Link href="/dashboard/customers" className="flex-1">
                <Button variant="outline" className="w-full"><Users className="mr-2 h-4 w-4" />Müşteri</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur border-slate-200">
        <CardHeader>
          <CardTitle>Müşteri & Portföy Grafiği</CardTitle>
          <CardDescription>Son 6 ay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {points.map((p) => (
              <div key={p.label} className="grid grid-cols-[44px_1fr] gap-3 items-center">
                <span className="text-xs text-slate-500">{p.label}</span>
                <div className="space-y-2">
                  <div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[#0A84FF]"
                        style={{ width: `${(p.listings / maxY) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Portföy: {p.listings}</p>
                  </div>
                  <div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[#34C759]"
                        style={{ width: `${(p.customers / maxY) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Müşteri: {p.customers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur border-slate-200">
        <CardHeader>
          <CardTitle>Son İlanlar</CardTitle>
          <CardDescription>Gerekli özet alanlar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Yükleniyor...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-4">Henüz ilan oluşturmadınız</p>
              <Link href="/dashboard/new-listing">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk İlanınızı Oluşturun
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/dashboard/listings/${listing.id}`}
                  className="block p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {listing.title || 'Başlıksız İlan'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {(listing.property_features?.listing_type === 'rent' ? 'Kiralık' : 'Satılık')} • {listing.property_features?.room_layout || '-'} • {listing.property_features?.gross_m2 || '-'} m²
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        listing.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {listing.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
