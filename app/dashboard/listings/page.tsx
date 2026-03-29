'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Eye, CreditCard as Edit, Trash2, Loader as Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Listing } from '@/lib/types/database';
import { toast } from 'sonner';
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
  const supabase = createClient();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">İlanlarım</h1>
          <p className="mt-2 text-slate-600">
            Tüm ilanlarınızı görüntüleyin ve yönetin
          </p>
        </div>
        <Link href="/dashboard/new-listing">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni İlan
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Henüz ilan yok
              </h3>
              <p className="text-slate-600 mb-6">
                İlk ilanınızı oluşturarak başlayın
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
          {listings.map((listing) => (
            <Card key={listing.id} className="border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 relative">
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  <img
                    src={listing.image_urls[0]}
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
                    className={
                      listing.status === 'published'
                        ? 'bg-green-500 hover:bg-green-600'
                        : ''
                    }
                  >
                    {listing.status === 'published' ? 'Yayında' : 'Taslak'}
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
          ))}
        </div>
      )}
    </div>
  );
}
