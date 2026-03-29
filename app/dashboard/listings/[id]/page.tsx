'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Copy, Share2, Loader as Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Listing } from '@/lib/types/database';
import { toast } from 'sonner';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        toast.error('İlan bulunamadı');
        router.push('/dashboard/listings');
      } else if (data) {
        setListing(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
      }
      setLoading(false);
    };

    fetchListing();
  }, [params.id, supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('listings')
      .update({
        title,
        description,
      })
      .eq('id', params.id);

    if (error) {
      toast.error('Kaydedilemedi', {
        description: error.message,
      });
    } else {
      toast.success('İlan güncellendi');
      if (listing) {
        setListing({ ...listing, title, description });
      }
    }
    setSaving(false);
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(description);
    toast.success('Metin kopyalandı!');
  };

  const handlePublish = async () => {
    const { error } = await supabase
      .from('listings')
      .update({ status: listing?.status === 'published' ? 'draft' : 'published' })
      .eq('id', params.id);

    if (error) {
      toast.error('Durum güncellenemedi');
    } else {
      toast.success(
        listing?.status === 'published' ? 'İlan taslağa alındı' : 'İlan yayınlandı'
      );
      if (listing) {
        setListing({
          ...listing,
          status: listing.status === 'published' ? 'draft' : 'published',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/listings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">İlan Detayı</h1>
            <p className="mt-1 text-sm text-slate-600">
              İlan metnini düzenleyin ve yönetin
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
          <Button variant="outline" onClick={handlePublish}>
            <Share2 className="mr-2 h-4 w-4" />
            {listing.status === 'published' ? 'Taslağa Al' : 'Yayınla'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Fotoğraflar</CardTitle>
            <CardDescription>
              İlana ait {listing.image_urls?.length || 0} fotoğraf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {listing.image_urls?.map((url, index) => (
                <div key={index} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>AI Tarafından Tespit Edilen Özellikler</span>
            </CardTitle>
            <CardDescription>
              Gemini AI tarafından analiz edildi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {listing.property_features &&
                Object.entries(listing.property_features).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 border rounded-lg p-3">
                    <p className="text-xs text-slate-500 capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium text-slate-900 text-sm">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>İlan Metni</CardTitle>
          <CardDescription>
            AI tarafından oluşturulan metni düzenleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="İlan başlığı"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İlan açıklaması"
              rows={12}
              className="resize-none font-mono text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCopyDescription}>
              <Copy className="mr-2 h-4 w-4" />
              Metni Kopyala
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <CardHeader>
          <CardTitle>Sosyal Medya Paylaşımı</CardTitle>
          <CardDescription>
            Bu metni Instagram veya Facebook gönderinizde kullanabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {title && `${title}\n\n`}
              {description?.substring(0, 200)}
              {description && description.length > 200 && '...'}
              {'\n\n📸 Detaylar için DM\n💼 Profesyonel hizmet\n🏠 #emlak #realestate #satılık'}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => {
              const socialText = `${title}\n\n${description?.substring(0, 200)}${
                description && description.length > 200 ? '...' : ''
              }\n\n📸 Detaylar için DM\n💼 Profesyonel hizmet\n🏠 #emlak #realestate #satılık`;
              navigator.clipboard.writeText(socialText);
              toast.success('Sosyal medya metni kopyalandı!');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Sosyal Medya Metnini Kopyala
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
