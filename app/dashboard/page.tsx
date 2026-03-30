'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { Customer, Listing } from '@/lib/types/database';

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
    <div className="max-w-5xl mx-auto space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
          <p className="text-sm text-slate-500">Hoş geldin {user?.email?.split('@')[0] || ''}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/new-listing">
            <Button><Plus className="mr-2 h-4 w-4" />Yeni İlan</Button>
          </Link>
          <Link href="/dashboard/customers">
            <Button variant="outline"><Users className="mr-2 h-4 w-4" />Müşteriler</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="px-3 py-1.5 rounded-full border bg-white text-sm text-slate-700">
          Portföy: <span className="font-semibold">{listings.length}</span>
        </div>
        <div className="px-3 py-1.5 rounded-full border bg-white text-sm text-slate-700">
          Müşteri: <span className="font-semibold">{customers.length}</span>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur border-slate-200">
        <CardHeader>
          <CardTitle>Son İlanlar</CardTitle>
          <CardDescription>En son portföy kayıtları</CardDescription>
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
