'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Sparkles, Users, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Listing } from '@/lib/types/database';

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchListings = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setListings(data);
      }
      setLoading(false);
    };

    fetchListings();
  }, [supabase]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div className="rounded-3xl p-5 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Emlak Asistan Paneli</h1>
        <p className="mt-2 text-sm md:text-base text-slate-200 max-w-3xl">
          Portföy, müşteri ve randevuları tek yerden yönet. iOS tarzı hızlı kartlarla günlük iş akışını kolaylaştır.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs md:text-sm">Toplam Portföy: {listings.length}</div>
          <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs md:text-sm">Aktif Kullanıcı: {user?.email || 'Giriş yapıldı'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-2xl">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Yeni İlan</CardTitle>
                <CardDescription>Fotoğraf yükleyerek başlayın</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/new-listing">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                İlan Oluştur
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-2xl">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>İlanlarım</CardTitle>
                <CardDescription>Tüm ilanları görüntüle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/listings">
              <Button variant="outline" className="w-full">
                <FolderOpen className="mr-2 h-4 w-4" />
                İlanları Gör
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-500 p-3 rounded-2xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Teknolojisi</CardTitle>
                <CardDescription>Akıllı içerik üretimi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Fotoğraflarınız yapay zeka tarafından analiz edilerek profesyonel ilan metinleri oluşturulur.
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-2xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Müşteriler</CardTitle>
                <CardDescription>Lead ve rehber yönetimi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/customers">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Müşteri Rehberi
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-white/40 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-2xl">
                <CalendarClock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Randevular</CardTitle>
                <CardDescription>Gezdirme planını oluştur</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/appointments">
              <Button variant="outline" className="w-full">
                <CalendarClock className="mr-2 h-4 w-4" />
                Takvime Git
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/40 bg-white/80 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Son İlanlar</CardTitle>
          <CardDescription>
            En son oluşturduğunuz ilanlar burada görünür
          </CardDescription>
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
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {listing.description || 'Açıklama eklenmemiş'}
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
