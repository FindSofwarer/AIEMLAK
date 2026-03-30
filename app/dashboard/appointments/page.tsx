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
import { CalendarClock, Plus, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, Customer, Listing } from '@/lib/types/database';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [listingId, setListingId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);

    const [appointmentsRes, customersRes, listingsRes] = await Promise.all([
      supabase.from('appointments').select('*').order('starts_at', { ascending: true }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    if (appointmentsRes.error) {
      toast.error('Randevular alınamadı', { description: appointmentsRes.error.message });
    }
    if (customersRes.error) {
      toast.error('Müşteriler alınamadı', { description: customersRes.error.message });
    }
    if (listingsRes.error) {
      toast.error('Portföyler alınamadı', { description: listingsRes.error.message });
    }

    setAppointments((appointmentsRes.data || []) as Appointment[]);
    setCustomers((customersRes.data || []) as Customer[]);
    setListings((listingsRes.data || []) as Listing[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAppointment = async () => {
    if (!user) return;
    if (!title.trim() || !startsAt) {
      toast.error('Başlık ve başlangıç zamanı gerekli');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        customer_id: customerId || null,
        listing_id: listingId || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Randevu kaydedilemedi', { description: error.message });
    } else {
      toast.success('Randevu eklendi');
      setAppointments((prev) => [...prev, data as Appointment].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setTitle('');
      setStartsAt('');
      setEndsAt('');
      setCustomerId('');
      setListingId('');
      setNotes('');
    }

    setSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Randevu Takvimi</h1>
        <p className="mt-2 text-slate-600">Müşteri + portföy eşleştir, gezdirme planını tek ekrandan yönet.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Randevu
          </CardTitle>
          <CardDescription>Portföy gezdirme veya müşteri görüşmesi planla</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Kadıköy 3+1 portföy gezdirme" />
          </div>

          <div className="space-y-2">
            <Label>Başlangıç</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bitiş</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Müşteri</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Portföy</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title || 'Başlıksız Portföy'}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label>Notlar</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Buluşma noktası, istekler, hatırlatma notları..." />
          </div>

          <div className="md:col-span-3">
            <Button onClick={handleCreateAppointment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Randevu Ekle
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Yaklaşan Randevular
          </CardTitle>
          <CardDescription>Toplam {appointments.length} kayıt</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
          ) : appointments.length === 0 ? (
            <div className="py-10 text-center text-slate-500">Henüz randevu yok</div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => {
                const customer = customers.find((c) => c.id === a.customer_id);
                const listing = listings.find((l) => l.id === a.listing_id);

                return (
                  <div key={a.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 break-words">{a.title}</h3>
                        <p className="text-sm text-slate-600">
                          {new Date(a.starts_at).toLocaleString('tr-TR')}
                          {a.ends_at ? ` - ${new Date(a.ends_at).toLocaleString('tr-TR')}` : ''}
                        </p>
                        <p className="text-sm text-slate-600 mt-1 break-words">
                          Müşteri: {customer?.full_name || '-'} • Portföy: {listing?.title || 'Seçilmedi'}
                        </p>
                        {a.notes && <p className="text-sm text-slate-500 mt-1">{a.notes}</p>}
                      </div>
                      <Badge
                        variant={a.status === 'planned' ? 'secondary' : 'outline'}
                        className={a.status === 'completed' ? 'bg-green-100 text-green-700' : a.status === 'canceled' ? 'bg-red-100 text-red-700' : ''}
                      >
                        {a.status === 'planned' ? 'Planlandı' : a.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
