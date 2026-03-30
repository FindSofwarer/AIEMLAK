'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Customer } from '@/lib/types/database';

export default function CustomersPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [locations, setLocations] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Müşteriler alınamadı', { description: error.message });
    } else {
      setCustomers((data || []) as Customer[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      toast.error('Müşteri adı gerekli');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone || null,
        email: email || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        preferred_locations: locations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Müşteri kaydedilemedi', { description: error.message });
    } else {
      toast.success('Müşteri eklendi');
      setCustomers((prev) => [data as Customer, ...prev]);
      setFullName('');
      setPhone('');
      setEmail('');
      setBudgetMin('');
      setBudgetMax('');
      setLocations('');
      setNotes('');
    }

    setSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Müşteri Rehberi</h1>
        <p className="mt-2 text-slate-600">Lead topla, bütçe ve bölge tercihlerini kaydet, randevuya bağla.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Müşteri
          </CardTitle>
          <CardDescription>Temel müşteri bilgisini ekle</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ad Soyad</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Örn. Ahmet Yılmaz" />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
          </div>
          <div className="space-y-2">
            <Label>E-posta</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@ornek.com" />
          </div>

          <div className="space-y-2">
            <Label>Min Bütçe (₺)</Label>
            <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max Bütçe (₺)</Label>
            <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tercih Edilen Bölgeler</Label>
            <Input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Kadıköy, Ataşehir, Maltepe" />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label>Notlar</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Özel istekler, randevu notları..." />
          </div>

          <div className="md:col-span-3">
            <Button onClick={handleCreateCustomer} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Müşteri Ekle
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Müşteri Listesi
          </CardTitle>
          <CardDescription>Toplam {customers.length} müşteri</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
          ) : customers.length === 0 ? (
            <div className="py-10 text-center text-slate-500">Henüz müşteri kaydı yok</div>
          ) : (
            <div className="space-y-3">
              {customers.map((c) => (
                <div key={c.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 break-words">{c.full_name}</h3>
                      <p className="text-sm text-slate-600 break-all">{c.phone || '-'} • {c.email || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      {c.budget_min || c.budget_max ? (
                        <Badge variant="secondary" className="whitespace-normal text-center">
                          {c.budget_min ? `${c.budget_min.toLocaleString('tr-TR')}₺` : '...'} - {c.budget_max ? `${c.budget_max.toLocaleString('tr-TR')}₺` : '...'}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {c.preferred_locations?.length > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      Bölgeler: {c.preferred_locations.join(', ')}
                    </p>
                  )}
                  {c.notes && <p className="text-sm text-slate-500 mt-1">{c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
