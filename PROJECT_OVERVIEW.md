# RealsAI – Emlakçı Copilot

RealsAI, emlak danışmanlarının günlük operasyonlarını hızlandırmak için geliştirilmiş mobil uyumlu bir web uygulamasıdır.

Temel hedef:
- Portföy oluşturmayı hızlandırmak
- Müşteri/lead yönetimini tek panelde toplamak
- Randevu planlamasını kolaylaştırmak
- AI ile ilan açıklaması üretimini tek tıkla yapmak

---

## 1) Ürün Özeti

RealsAI üç ana modülden oluşur:

1. Portföy Yönetimi
- Fotoğraf yükleme
- AI destekli analiz
- İlan başlığı ve açıklama üretimi
- Keypoint tabanlı portföy alanları (satılık/kiralık, m², oda, kat, fiyat vb.)
- Portföy detayında sonradan düzenleme

2. CRM (Müşteri Yönetimi)
- Müşteri kaydı
- Bütçe aralığı
- Tercih edilen lokasyonlar
- Notlar

3. Randevu/Takvim
- Müşteri + portföy eşleştirme
- Başlangıç/bitiş tarih-saat planlama
- Durum takibi (planned/completed/canceled)

---

## 2) Öne Çıkan Özellikler

- AI ile ilan metni üretimi (Google Gemini)
- n8n entegrasyonu ile outbound/inbound otomasyon
- Tenant bazlı API key doğrulaması
- Keypoint bilgilerini prompt içine dahil ederek daha doğru metin üretimi
- Satılık/Kiralık portföy tipi
- Portföy fiyat alanı
- Keypoint bazlı filtreleme:
  - İlan tipi
  - Oda düzeni
  - Min m²
  - Max fiyat
- Portföy fotoğraflarını indirme
- Mobil responsive dashboard (yan scroll ihtiyacı olmadan kullanım)
- iOS tarzı sade/modern UI dili

---

## 3) Teknoloji Yığını

Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- shadcn/ui

Backend / Veri
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- RLS (Row Level Security)

AI
- Google Gemini API

Dağıtım
- GitHub
- Netlify yapılandırması mevcut

---

## 4) Mimari Akış

### Portföy Oluşturma Akışı
1. Kullanıcı fotoğrafları yükler
2. Keypoint bilgilerini girer
3. Görseller + keypointler AI analiz endpointine gönderilir
4. AI başlık/açıklama/özellik döner
5. Kullanıcı sonucu düzenler
6. Portföy kaydedilir
7. n8n webhook tetiklenir (listing_id + keypoints + api_key)

### Prompt Kalitesi
- Sistem, kullanıcı keypointlerini prompta ekler
- Keypoint alanları çelişmiyorsa öncelikli kabul edilir
- Çıktının başlık/açıklama/özellik tarafına yansıtılması istenir

---

## 5) Veritabanı Modelleri (Özet)

- profiles
  - Kullanıcı profil bilgileri
- listings
  - Portföy kayıtları
  - AI açıklama
  - Görsel URL listesi
  - automation_image_url (n8n üretilen görsel)
  - property_features/keypoints (JSON)
- customers
  - CRM müşteri kayıtları
- appointments
  - Müşteri + portföy randevu planı
- ai_usage_logs
  - AI istek kullanım logları (rate limit takibi)

---

## 6) Güvenlik ve Limitler

- Tablolarda RLS aktif
- Kullanıcı yalnızca kendi verisini görür/düzenler
- AI endpoint için kullanıcı bazlı rate limit uygulanır
- Free plan için aylık ilan üretim limiti uygulanır

---

## 7) Ortam Değişkenleri

Gerekli örnek değişkenler:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GEMINI_API_KEY
- GEMINI_MODEL (önerilen: gemini-2.5-flash-lite)
- N8N_LISTING_WEBHOOK_URL

---

## 7.1) n8n Callback Endpoint

- Endpoint: `PATCH /api/listings/update-automation`
- Beklenen alanlar: `listing_id`, `api_key`, `ai_title`, `ai_description`, `generated_image_url`
- Güvenlik: RLS açık kalır, `x-api-key` başlığıyla tenant doğrulaması yapılır

---

## 8) Mobil Deneyim Prensipleri

- Dashboard shell mobilde drawer + alt navigasyonla çalışır
- Kart ve satır düzenleri küçük ekranda satır kırar
- Uzun metinler overflow üretmez
- Yatay kaydırma ihtiyacı minimize edilmiştir

---

## 9) İyileştirme Yol Haritası

- Otomatik portföy-müşteri eşleşme skoru
- Takvimde sürükle-bırak planlama
- Portal bazlı (sahibinden/emlakjet) alan eşleme sihirbazı
- Push bildirim / hatırlatma
- Gelişmiş raporlama paneli

---

## 10) Kısa Değer Önerisi

RealsAI, emlak danışmanının zamanını tekrar eden işlerden kurtarıp satışa odaklanmasını sağlar:
- Daha hızlı ilan üretimi
- Daha düzenli müşteri takibi
- Daha planlı randevu yönetimi
- Daha tutarlı ve profesyonel ilan metinleri
