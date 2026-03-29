🏠 Proje: RealsAI (Emlakçı Copilot SaaS)
Bu proje, emlakçıların fotoğraf yükleyerek saniyeler içinde profesyonel ilan metinleri, teknik analizler ve sosyal medya içerikleri oluşturmasını sağlayan bir Micro SaaS platformudur.

🛠️ Teknoloji Yığını (Tech Stack)
Frontend: Next.js 14/15 (App Router), Tailwind CSS, Shadcn/UI.

Backend & Auth: Supabase (PostgreSQL, GoTrue Auth).

Storage: Supabase Storage (Ev fotoğrafları için).

AI Engine: Google Gemini 1.5 Flash (Vision + Text).

Deployment: Vercel (Frontend & Edge Functions).

Database Security: PostgreSQL Row Level Security (RLS).

🏗️ Veritabanı Şeması & Migrations
Aşağıdaki SQL kodu Supabase SQL Editor'e yapıştırılarak veritabanı ayağa kaldırılır:

SQL
-- 1. PROFILLER (Kullanıcı Ek Bilgileri)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agency_name TEXT,
  subscription_status TEXT DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ILANLAR (Listings)
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT,
  description TEXT, -- AI tarafından oluşturulan metin
  image_urls TEXT[], -- Storage'daki fotoğrafların linkleri
  property_features JSONB, -- AI'ın fotoğraflardan çıkardığı teknik veriler (oda, zemin, mutfak vb.)
  status TEXT DEFAULT 'draft', -- draft, published
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. GÜVENLİK (RLS - Row Level Security)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi ilanlarını görebilir, ekleyebilir ve silebilir.
CREATE POLICY "Kullanıcılar sadece kendi verilerini yönetebilir" 
ON listings FOR ALL 
USING (auth.uid() = user_id);
🔄 Uygulama Senaryosu (User Flow)
1. Adım: Kayıt ve Giriş (Auth)
Emlakçı, Supabase Auth (Email/Password veya Google) ile sisteme giriş yapar.

İlk girişte profiles tablosunda otomatik bir kayıt oluşturulur.

2. Adım: Fotoğraf Yükleme (Storage)
Emlakçı, yeni ilan oluşturma sayfasına girer.

react-dropzone ile fotoğrafları seçer.

Fotoğraflar Supabase Storage'da listings/{user_id}/{listing_id}/ klasörüne yüklenir.

3. Adım: AI Analiz Süreci (The Magic)
Frontend, fotoğrafların publicURL'lerini bir Next.js API Route'una (/api/generate) gönderir.

Backend (Gemini API):

Sistem, fotoğrafları Gemini 1.5 Flash modeline gönderir.

Prompt: "Bu fotoğraflardaki evi bir iç mimar gözüyle analiz et. Mutfak tezgahı malzemesi, zemin türü, aydınlatma durumu ve genel kondisyonu belirle. Ardından emlakçıların kullandığı profesyonel ve ikna edici bir ilan metni yaz."

Gemini'den gelen JSON yanıtı hem description hem de property_features kolonlarına kaydedilir.

4. Adım: Düzenleme ve Yayına Alma
Emlakçı, AI'ın çıkardığı metni UI üzerinde görür ve gerekirse manuel düzeltme yapar.

"İlanı Hazırla" dediğinde sistem ona kopyalanabilir bir metin ve Instagram postu taslağı sunar.

🛡️ Güvenlik & RCS (Remote Config & Security)
Supabase RLS: Veritabanı düzeyinde güvenlik. Kimse user_id'si tutmayan bir satıra SELECT veya UPDATE atamaz.

Environment Variables: Gemini API anahtarları asla frontend'de gözükmez, sadece process.env.GEMINI_KEY olarak backend'de (Vercel) saklanır.

Rate Limiting: Aynı kullanıcının dakikada 5'ten fazla AI isteği atması engellenir (API maliyeti ve güvenlik için).

Storage Protection: Sadece giriş yapmış kullanıcılar görsel yükleyebilir (authenticated role).

📈 Ölçeklendirme (Gelecek Planı)
Pro Versiyon: Aylık 20 ilan sınırı kaldırılarak abonelik modeline geçiş (Stripe entegrasyonu).

Otomatik Paylaşım: Oluşturulan ilan metninin doğrudan sahibinden.com veya emlakjet'e (eğer API'leri varsa) gönderilmesi.

Sanal Dekorasyon: Boş odaları AI ile mobilyalı hale getirme özelliği ekleme.