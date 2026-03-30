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
import { ArrowLeft, Save, Copy, Share2, Loader as Loader2, Sparkles, Download, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Listing, ListingKeypoints } from '@/lib/types/database';
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
  const [keypoints, setKeypoints] = useState<ListingKeypoints>({});

  const statusLabel = listing?.status === 'published'
    ? 'Yayında'
    : listing?.status === 'generating'
      ? 'Üretiliyor'
      : 'Taslak';

  const statusClassName = listing?.status === 'published'
    ? 'bg-green-500 hover:bg-green-600'
    : listing?.status === 'generating'
      ? 'bg-amber-500 hover:bg-amber-600'
      : '';

  const orderedImages = [
    ...(listing?.automation_image_url ? [listing.automation_image_url] : []),
    ...((listing?.image_urls || []).filter((url) => url !== listing?.automation_image_url)),
  ];

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
        setKeypoints(data.property_features || {});
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
        property_features: {
          ...(listing?.property_features || {}),
          ...keypoints,
        },
      })
      .eq('id', params.id);

    if (error) {
      toast.error('Kaydedilemedi', {
        description: error.message,
      });
    } else {
      toast.success('İlan güncellendi');
      if (listing) {
        setListing({
          ...listing,
          title,
          description,
          property_features: {
            ...(listing.property_features || {}),
            ...keypoints,
          },
        });
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

  const handleDownloadImages = async () => {
    if (!listing) {
      return;
    }

    if (!orderedImages.length) {
      toast.error('İndirilecek fotoğraf yok');
      return;
    }

    try {
      for (let i = 0; i < orderedImages.length; i++) {
        const url = orderedImages[i];
        const response = await fetch(url);
        if (!response.ok) {
          window.open(url, '_blank');
          continue;
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `portfoy-${listing.id}-${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);
      }

      toast.success('Fotoğraflar indiriliyor');
    } catch {
      toast.error('Fotoğraflar indirilemedi');
    }
  };

  const handleStartAutomation = async () => {
    if (!listing) return;

    const { error: statusError } = await supabase
      .from('listings')
      .update({ status: 'generating' })
      .eq('id', listing.id);

    if (statusError) {
      toast.error('İlan durumu güncellenemedi', {
        description: statusError.message,
      });
      return;
    }

    setListing({ ...listing, status: 'generating' });

    const triggerRes = await fetch('/api/listings/trigger-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id }),
    });

    if (!triggerRes.ok) {
      toast.error('n8n otomasyonu tetiklenemedi');
      return;
    }

    toast.success('n8n otomasyonu tetiklendi');
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center space-x-4">
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={listing.status === 'published' ? 'default' : 'secondary'}
            className={statusClassName}
          >
            {statusLabel}
          </Badge>
          <Button variant="outline" onClick={handleStartAutomation}>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Otomasyonunu Başlat
          </Button>
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
              İlana ait {orderedImages.length || 0} görsel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {orderedImages.map((url, index) => (
                <div key={index} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={index === 0 && listing.automation_image_url === url ? 'Automation visual' : `Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={handleDownloadImages}>
              <Download className="mr-2 h-4 w-4" />
              Fotoğrafları İndir
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Portföy Keypoint Alanları</CardTitle>
            <CardDescription>
              Bu bilgiler sonradan güncellenebilir ve pazar yeri çıktılarına otomatik yansır.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>İlan Tipi</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={keypoints.listing_type || 'sale'}
                  onChange={(e) => setKeypoints((p) => ({ ...p, listing_type: e.target.value as 'sale' | 'rent' }))}
                >
                  <option value="sale">Satılık</option>
                  <option value="rent">Kiralık</option>
                </select>
            </div>
            <div className="space-y-2">
              <Label>Gayrimenkul Tipi</Label>
              <Input value={keypoints.property_type || ''} onChange={(e) => setKeypoints((p) => ({ ...p, property_type: e.target.value }))} />
            </div>
              <div className="space-y-2">
                <Label>Fiyat (₺)</Label>
                <Input
                  type="number"
                  value={keypoints.price_try ?? ''}
                  onChange={(e) => setKeypoints((p) => ({ ...p, price_try: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            <div className="space-y-2">
              <Label>Oda Düzeni</Label>
              <Input value={keypoints.room_layout || ''} onChange={(e) => setKeypoints((p) => ({ ...p, room_layout: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Brüt m²</Label>
              <Input type="number" value={keypoints.gross_m2 ?? ''} onChange={(e) => setKeypoints((p) => ({ ...p, gross_m2: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label>Net m²</Label>
              <Input type="number" value={keypoints.net_m2 ?? ''} onChange={(e) => setKeypoints((p) => ({ ...p, net_m2: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label>Bina Yaşı</Label>
              <Input type="number" value={keypoints.building_age ?? ''} onChange={(e) => setKeypoints((p) => ({ ...p, building_age: e.target.value ? Number(e.target.value) : null }))} />
            </div>

            <div className="space-y-2">
              <Label>Bulunduğu Kat</Label>
              <Input type="number" value={keypoints.floor_no ?? ''} onChange={(e) => setKeypoints((p) => ({ ...p, floor_no: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label>Toplam Kat</Label>
              <Input type="number" value={keypoints.total_floors ?? ''} onChange={(e) => setKeypoints((p) => ({ ...p, total_floors: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label>Isıtma</Label>
              <Input value={keypoints.heating_type || ''} onChange={(e) => setKeypoints((p) => ({ ...p, heating_type: e.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Lokasyon Notu</Label>
              <Input value={keypoints.location_note || ''} onChange={(e) => setKeypoints((p) => ({ ...p, location_note: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Yakınlık / Çevre</Label>
              <Input value={keypoints.proximity_note || ''} onChange={(e) => setKeypoints((p) => ({ ...p, proximity_note: e.target.value }))} />
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
