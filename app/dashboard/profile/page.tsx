'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Save, User as UserIcon, Building2, Copy, RefreshCcw } from 'lucide-react';
import { Profile } from '@/lib/types/database';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingApiKey, setRefreshingApiKey] = useState(false);
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAgencyName(data.agency_name || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        agency_name: agencyName,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Profil güncellenemedi', {
        description: error.message,
      });
    } else {
      toast.success('Profil başarıyla güncellendi');
      if (profile) {
        setProfile({ ...profile, full_name: fullName, agency_name: agencyName });
      }
    }
    setSaving(false);
  };

  const handleRefreshApiKey = async () => {
    if (!user) return;

    setRefreshingApiKey(true);
    const newApiKey = crypto.randomUUID();

    const { data, error } = await supabase
      .from('profiles')
      .update({ api_key: newApiKey })
      .eq('id', user.id)
      .select('*')
      .maybeSingle();

    if (error) {
      toast.error('API key yenilenemedi', {
        description: error.message,
      });
    } else {
      setProfile(data as Profile);
      toast.success('API key yenilendi');
    }

    setRefreshingApiKey(false);
  };

  const handleCopyApiKey = async () => {
    if (!profile?.api_key) return;

    await navigator.clipboard.writeText(profile.api_key);
    toast.success('API key kopyalandı');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profil Ayarları</h1>
        <p className="mt-2 text-slate-600">
          Hesap bilgilerinizi ve abonelik durumunuzu yönetin
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Hesap Bilgileri</CardTitle>
          <CardDescription>
            Kişisel bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">
              E-posta adresi değiştirilemez
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agencyName">Emlak Ofisi Adı (Opsiyonel)</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="agencyName"
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Yılmaz Emlak"
                className="pl-10"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
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
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Automation API Key</CardTitle>
          <CardDescription>
            n8n webhook geri dönüşlerinde bu anahtar ile tenant doğrulaması yapılır
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={profile?.api_key || ''}
              disabled
              className="font-mono text-xs sm:text-sm bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleCopyApiKey} disabled={!profile?.api_key}>
              <Copy className="mr-2 h-4 w-4" />
              Kopyala
            </Button>
            <Button type="button" onClick={handleRefreshApiKey} disabled={refreshingApiKey}>
              {refreshingApiKey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yenileniyor...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Yenile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Abonelik Durumu</CardTitle>
          <CardDescription>
            Mevcut paket ve kullanım limitleri
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Mevcut Paket</p>
              <p className="text-sm text-slate-600">Aktif abonelik planınız</p>
            </div>
            <Badge className="capitalize">
              {profile?.subscription_status || 'Free'}
            </Badge>
          </div>

          {profile?.subscription_status === 'free' && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                Pro sürüme geçin
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Sınırsız ilan oluşturma, öncelikli AI analizi ve daha fazla özellik
              </p>
              <Button variant="default" disabled>
                Yakında Gelecek
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-slate-500">
              Hesap oluşturulma tarihi:{' '}
              {profile?.created_at &&
                new Date(profile.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
