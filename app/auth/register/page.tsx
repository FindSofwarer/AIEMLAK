'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Chrome as Home, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          agency_name: agencyName,
        },
      },
    });

    if (error) {
      toast.error('Kayıt başarısız', {
        description: error.message,
      });
      setLoading(false);
    } else if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          agency_name: agencyName,
          subscription_status: 'free',
        });

      if (profileError) {
        toast.error('Profil oluşturulamadı', {
          description: profileError.message,
        });
        setLoading(false);
      } else {
        toast.success('Kayıt başarılı!', {
          description: 'Hesabınıza giriş yapabilirsiniz.',
        });
        router.push('/auth/login');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8 space-x-3">
          <div className="bg-slate-900 p-3 rounded-xl">
            <Home className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RealsAI</h1>
            <p className="text-sm text-slate-600">Emlakçı Copilot</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Kayıt Ol</CardTitle>
            <CardDescription>
              Yeni bir hesap oluşturun ve AI destekli ilan oluşturmaya başlayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyName">Emlak Ofisi Adı (Opsiyonel)</Label>
                <Input
                  id="agencyName"
                  type="text"
                  placeholder="Yılmaz Emlak"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@emlak.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  'Kayıt Ol'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600">Zaten hesabınız var mı? </span>
              <Link href="/auth/login" className="text-slate-900 font-semibold hover:underline">
                Giriş Yap
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
