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
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Hoş Geldiniz!</h1>
        <p className="mt-2 text-lg text-slate-600">
          AI destekli ilan oluşturma platformuna hoş geldiniz. Fotoğraflarınızı yükleyin ve profesyonel ilan metinlerini saniyeler içinde oluşturun.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-lg">
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

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-lg">
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

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Teknolojisi</CardTitle>
                <CardDescription>Gemini 1.5 Flash ile çalışır</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Fotoğraflarınız yapay zeka tarafından analiz edilerek profesyonel ilan metinleri oluşturulur.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-lg">
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

        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-3 rounded-lg">
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

      <Card className="border-slate-200">
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
