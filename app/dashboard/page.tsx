'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Users, CalendarClock, CircleCheckBig, FileText } from 'lucide-react';
import Link from 'next/link';
import { Appointment, Customer, Listing } from '@/lib/types/database';

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const publishedCount = listings.filter((l) => l.status === 'published').length;
  const draftCount = listings.filter((l) => l.status === 'draft').length;
  const generatingCount = listings.filter((l) => l.status === 'generating').length;
  const saleCount = listings.filter((l) => l.property_features?.listing_type !== 'rent').length;
  const rentCount = listings.filter((l) => l.property_features?.listing_type === 'rent').length;

  const today = new Date();
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.starts_at);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const nextAppointment = appointments[0];

  useEffect(() => {
    const fetchData = async () => {
      const [listingsRes, customersRes, profileRes, appointmentsRes] = await Promise.all([
        supabase.from('listings').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('full_name').eq('id', user?.id || '').maybeSingle(),
        supabase
          .from('appointments')
          .select('*')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(5),
      ]);

      if (listingsRes.data) setListings(listingsRes.data);
      if (customersRes.data) setCustomers(customersRes.data as Customer[]);
      if (profileRes.data?.full_name) setFullName(profileRes.data.full_name);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data as Appointment[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase, user?.id]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
          <p className="text-sm text-slate-500">Hoş geldin {fullName || user?.email?.split('@')[0] || ''}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/dashboard/new-listing">
            <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Yeni İlan</Button>
          </Link>
          <Link href="/dashboard/customers">
            <Button variant="outline" className="w-full sm:w-auto"><Users className="mr-2 h-4 w-4" />Müşteriler</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Toplam Portföy</p>
            <p className="text-2xl font-semibold mt-1 text-slate-900">{listings.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Yayındaki İlan</p>
            <p className="text-2xl font-semibold mt-1 text-emerald-600">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Taslak İlan</p>
            <p className="text-2xl font-semibold mt-1 text-amber-600">{draftCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Üretilen İlan</p>
            <p className="text-2xl font-semibold mt-1 text-orange-600">{generatingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Müşteri Sayısı</p>
            <p className="text-2xl font-semibold mt-1 text-slate-900">{customers.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur border-slate-200 lg:col-span-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Hızlı Durum</CardTitle>
            <CardDescription>Emlakçının günlük bakacağı özetler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-700" />
                <span className="text-sm text-slate-700">Portföy Dağılımı</span>
              </div>
              <span className="text-sm font-medium text-slate-900">Satılık {saleCount} • Kiralık {rentCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-700" />
                <span className="text-sm text-slate-700">Bugünkü Randevu</span>
              </div>
              <span className="text-sm font-medium text-slate-900">{todayAppointments.length}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border">
              <div className="flex items-center gap-2">
                <CircleCheckBig className="h-4 w-4 text-slate-700" />
                <span className="text-sm text-slate-700">Sıradaki Randevu</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {nextAppointment
                  ? new Date(nextAppointment.starts_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Randevu yok'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Hızlı Aksiyon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/new-listing" className="block">
              <Button className="w-full"><Plus className="mr-2 h-4 w-4" />Yeni İlan Oluştur</Button>
            </Link>
            <Link href="/dashboard/listings" className="block">
              <Button variant="outline" className="w-full"><FolderOpen className="mr-2 h-4 w-4" />Portföylerim</Button>
            </Link>
            <Link href="/dashboard/appointments" className="block">
              <Button variant="outline" className="w-full"><CalendarClock className="mr-2 h-4 w-4" />Randevular</Button>
            </Link>
          </CardContent>
        </Card>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {listing.title || 'Başlıksız İlan'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 break-words">
                        {(listing.property_features?.listing_type === 'rent' ? 'Kiralık' : 'Satılık')} • {listing.property_features?.room_layout || '-'} • {listing.property_features?.gross_m2 || '-'} m²
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        listing.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'generating'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {listing.status === 'published' ? 'Yayında' : listing.status === 'generating' ? 'Üretiliyor' : 'Taslak'}
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
