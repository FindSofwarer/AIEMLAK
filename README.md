# RealsAI - Emlakçı Copilot SaaS Platformu

AI destekli emlak ilan oluşturma platformu. Emlakçılar fotoğraf yükleyerek saniyeler içinde profesyonel ilan metinleri, teknik analizler ve sosyal medya içerikleri oluşturabilir.

## Teknoloji Stack

- **Frontend**: Next.js 13 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Backend & Auth**: Supabase (PostgreSQL, GoTrue Auth)
- **Storage**: Supabase Storage (Emlak fotoğrafları)
- **AI Engine**: Google Gemini 1.5 Flash (Vision + Text)
- **Deployment**: Vercel

## Özellikler

- **AI Destekli Analiz**: Fotoğraflardan otomatik özellik tespiti (oda sayısı, zemin türü, mutfak özellikleri)
- **Profesyonel İlan Metinleri**: Gemini AI ile oluşturulan ikna edici açıklamalar
- **Sosyal Medya İçeriği**: Instagram/Facebook paylaşımları için hazır metinler
- **Güvenli Authentication**: Supabase Auth ile email/password girişi
- **Row Level Security**: Kullanıcılar sadece kendi verilerine erişebilir
- **Çoklu Fotoğraf Desteği**: Her ilan için 10 fotoğrafa kadar
- **İlan Yönetimi**: Taslak/Yayında durum yönetimi

## Kurulum

### 1. Gereksinimler

- Node.js 18+
- Supabase hesabı
- Google Gemini API anahtarı

### 2. Proje Klonlama ve Bağımlılıklar

\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables

\`.env.local\` dosyası oluşturun:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# n8n Outbound Webhook (RealsAI -> n8n)
N8N_LISTING_WEBHOOK_URL=https://your-n8n-instance/webhook/realsai-new-listing
\`\`\`

### 4. Supabase Kurulumu

#### Veritabanı Migration

Supabase projenizde SQL Editor'ü açın ve migration dosyasını çalıştırın. Migration dosyası zaten uygulandı ve aşağıdaki tabloları oluşturdu:

- **profiles**: Kullanıcı profil bilgileri
- **listings**: Emlak ilanları

#### Storage Bucket

Storage bucket zaten oluşturuldu:

- **property-images**: Emlak fotoğrafları için (50MB limit, JPEG/PNG/WebP)

### 5. Gemini API Key Edinme

1. [Google AI Studio](https://makersuite.google.com/app/apikey)'ya gidin
2. "Get API Key" butonuna tıklayın
3. Yeni API key oluşturun
4. API key'i `.env.local` dosyasına ekleyin

### 6. Geliştirme Sunucusu

\`\`\`bash
npm run dev
\`\`\`

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacak.

## Kullanım Senaryosu

### 1. Kayıt ve Giriş
- Emlakçı email/password ile kayıt olur
- Profil bilgileri (ad, ofis adı) otomatik oluşturulur

### 2. Yeni İlan Oluşturma
1. Dashboard'dan "Yeni İlan" butonuna tıklayın
2. Emlak fotoğraflarını yükleyin (max 10 adet)
3. "Yükle ve AI ile Analiz Et" butonuna tıklayın
4. AI fotoğrafları analiz eder ve:
   - Oda sayısı, zemin türü gibi özellikleri tespit eder
   - Profesyonel ilan başlığı oluşturur
   - Detaylı ve ikna edici açıklama yazar

### 3. İlan Düzenleme ve Yayınlama
- AI tarafından oluşturulan metni düzenleyebilirsiniz
- "Metni Kopyala" ile ilanı kopyalayın
- Sosyal medya için hazır metin alın
- İlanı "Yayınla" veya "Taslağa Al"

## Veritabanı Yapısı

### Profiles Tablosu
\`\`\`sql
- id: UUID (references auth.users)
- full_name: TEXT
- agency_name: TEXT
- api_key: UUID (tenant bazlı automation key)
- subscription_status: TEXT (free, pro, enterprise)
- created_at: TIMESTAMPTZ
\`\`\`

### Listings Tablosu
\`\`\`sql
- id: UUID
- user_id: UUID (references auth.users)
- title: TEXT
- description: TEXT
- ai_title: TEXT
- ai_description: TEXT
- image_urls: TEXT[]
- automation_image_url: TEXT
- property_features: JSONB
- status: TEXT (draft, generating, published)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
\`\`\`

## n8n Entegrasyonu

### Outbound Trigger
- Endpoint: `POST /api/listings/trigger-automation`
- Ne zaman çağrılır:
  - Yeni ilan kaydedildikten sonra
  - İlan detayında `AI Otomasyonunu Başlat` tıklandığında (`status = generating`)
- n8n'e giden payload:

```json
{
  "listing_id": "uuid",
  "user_id": "uuid",
  "api_key": "uuid",
  "keypoints": {
    "listing_type": "sale",
    "room_layout": "2+1"
  }
}
```

### Inbound Callback
- Endpoint: `PATCH /api/listings/update-automation`
- n8n payload örneği:

```json
{
  "listing_id": "uuid",
  "api_key": "uuid",
  "ai_title": "Profesyonel başlık",
  "ai_description": "İlan metni",
  "generated_image_url": "https://..."
}
```

- Güvenlik:
  - RLS açık kalır
  - `x-api-key` header'ı ile listing sahibinin `profiles.api_key` eşleşmesi zorunludur
  - Eşleşme yoksa update reddedilir

## 0 TL ile n8n Kurulum Önerisi

- Yerelde ücretsiz: Docker Desktop ile n8n Community sürümü çalıştırın.
- Ücretsiz bulut denemesi: n8n cloud trial (sınırlı süre).
- Görsel üretim için sıfır maliyet yaklaşımı:
  - Bannerbear yerine n8n içinde HTML template + screenshot yaklaşımı
  - Cloudinary free tier (aylık kota ile)
  - Düşük hacimde Gemini ücretsiz kotası

## Güvenlik

- **Row Level Security (RLS)**: Tüm tablolarda aktif
- **Storage Policies**: Kullanıcılar sadece kendi fotoğraflarına erişebilir
- **API Key Security**: Gemini API key sadece backend'de kullanılır
- **Authentication**: Supabase Auth ile güvenli kimlik doğrulama
- **Rate Limiting**: Kullanıcı başına AI endpoint için dakikada maksimum 5 istek
- **Plan Limiti (Free)**: Aylık maksimum 20 ilan üretimi

## AI Prompt Yapısı

Gemini 1.5 Flash'a gönderilen prompt iki ana görevi içerir:

1. **Teknik Analiz**: Oda sayısı, zemin türü, mutfak özellikleri, aydınlatma, kondisyon
2. **İlan Metni**: Türkiye emlak sektörüne uygun, profesyonel, 150-250 kelime

Yanıt JSON formatında:
\`\`\`json
{
  "title": "İlan başlığı",
  "description": "Profesyonel ilan metni",
  "features": {
    "rooms": "3+1",
    "floor_type": "Laminat Parke",
    "kitchen_type": "Amerikan mutfak, granit tezgah"
  }
}
\`\`\`

## Deployment (Vercel)

1. Vercel hesabı oluşturun
2. Projeyi Vercel'e import edin
3. Environment variables'ı ayarlayın
4. Deploy edin

## Gelecek Özellikler

- **Pro Abonelik**: Stripe entegrasyonu ile aylık abonelik
- **Otomatik Paylaşım**: sahibinden.com API entegrasyonu
- **Sanal Dekorasyon**: Boş odaları AI ile mobilyalı hale getirme
- **Çoklu Dil Desteği**: İngilizce ilan metinleri
- **Toplu İlan**: Aynı anda birden fazla ilan oluşturma

## Lisans

Bu proje özel mülkiyettedir.

## Destek

Sorularınız için: support@realsai.com
