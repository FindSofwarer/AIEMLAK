'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Eye, Trash2, Loader as Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Listing } from '@/lib/types/database';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [roomFilter, setRoomFilter] = useState('');
  const [minM2Filter, setMinM2Filter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const supabase = createClient();

  const filteredListings = listings.filter((listing) => {
    const f = listing.property_features || {};

    const queryMatch =
      !query.trim() ||
      `${listing.title || ''} ${listing.description || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());

    const typeMatch =
      listingTypeFilter === 'all' ||
      (f.listing_type || '').toString() === listingTypeFilter;

    const roomMatch =
      !roomFilter.trim() ||
      (f.room_layout || '').toString().toLowerCase().includes(roomFilter.toLowerCase());

    const minM2 = minM2Filter ? Number(minM2Filter) : null;
    const grossM2 = typeof f.gross_m2 === 'number' ? f.gross_m2 : Number(f.gross_m2 || 0);
    const m2Match = !minM2 || grossM2 >= minM2;

    const maxPrice = maxPriceFilter ? Number(maxPriceFilter) : null;
    const price = typeof f.price_try === 'number' ? f.price_try : Number(f.price_try || 0);
    const priceMatch = !maxPrice || (price > 0 && price <= maxPrice);

    return queryMatch && typeMatch && roomMatch && m2Match && priceMatch;
  });

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setListings(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [supabase]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('listings').delete().eq('id', id);

    if (error) {
      toast.error('İlan silinemedi', {
        description: error.message,
      });
    } else {
      toast.success('İlan başarıyla silindi');
      setListings(listings.filter((l) => l.id !== id));
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">İlanlarım</h1>
          <p className="mt-2 text-slate-600">
            Tüm ilanlarınızı görüntüleyin ve yönetin
          </p>
        </div>
        <Link href="/dashboard/new-listing">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Yeni İlan
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Portföy Arama / Filtre</CardTitle>
          <CardDescription>Örn: kiralık + 2+1 + min 300 m² gibi filtreleyin</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-9"
              placeholder="Başlık / açıklama ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={listingTypeFilter}
            onChange={(e) => setListingTypeFilter(e.target.value as 'all' | 'sale' | 'rent')}
          >
            <option value="all">Tümü</option>
            <option value="sale">Satılık</option>
            <option value="rent">Kiralık</option>
          </select>

          <Input
            placeholder="Oda (örn 2+1)"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Min m² (brüt)"
            value={minM2Filter}
            onChange={(e) => setMinM2Filter(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Max fiyat (₺)"
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(e.target.value)}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Sonuç bulunamadı
              </h3>
              <p className="text-slate-600 mb-6">
                Filtreleri azaltın veya yeni portföy ekleyin
              </p>
              <Link href="/dashboard/new-listing">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk İlanı Oluştur
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const coverImage = listing.automation_image_url || listing.image_urls?.[0] || null;
            const statusLabel = listing.status === 'published' ? 'Yayında' : listing.status === 'generating' ? 'Üretiliyor' : 'Taslak';
            const statusClassName = listing.status === 'published' ? 'bg-green-500 hover:bg-green-600' : listing.status === 'generating' ? 'bg-amber-500 hover:bg-amber-600' : '';

            return (
            <Card key={listing.id} className="border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 relative">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={listing.title || 'Listing'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FolderOpen className="h-12 w-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={listing.status === 'published' ? 'default' : 'secondary'}
                    className={statusClassName}
                  >
                    {statusLabel}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">
                  {listing.title || 'Başlıksız İlan'}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {listing.description || 'Açıklama eklenmemiş'}
                </CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">
                    {listing.property_features?.listing_type === 'rent' ? 'Kiralık' : 'Satılık'}
                  </Badge>
                  {listing.property_features?.room_layout && (
                    <Badge variant="outline">{listing.property_features.room_layout}</Badge>
                  )}
                  {listing.property_features?.gross_m2 && (
                    <Badge variant="outline">{listing.property_features.gross_m2} m²</Badge>
                  )}
                  {listing.property_features?.price_try && (
                    <Badge variant="outline">
                      {Number(listing.property_features.price_try).toLocaleString('tr-TR')} ₺
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Link href={`/dashboard/listings/${listing.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Görüntüle
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting === listing.id}
                      >
                        {deleting === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>İlanı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. İlan kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(listing.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
