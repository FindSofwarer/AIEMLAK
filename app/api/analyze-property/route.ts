import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

const MAX_AI_REQUESTS_PER_MINUTE = 5;
const FREE_PLAN_MONTHLY_LISTING_LIMIT = 20;
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];

    return models
      .filter((m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => String(m?.name || '').replace('models/', ''))
      .filter((name: string) => name.startsWith('gemini-'));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Bu işlem için giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    const { imageUrls } = await request.json();

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'En az bir fotoğraf gerekli' },
        { status: 400 }
      );
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentRequestCount, error: rateLimitError } = await supabase
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneMinuteAgo);

    if (rateLimitError) {
      throw rateLimitError;
    }

    if ((recentRequestCount ?? 0) >= MAX_AI_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        {
          error:
            'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyip tekrar deneyin.',
        },
        { status: 429 }
      );
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const subscriptionStatus = profileData?.subscription_status ?? 'free';

    if (subscriptionStatus === 'free') {
      const now = new Date();
      const startOfMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      ).toISOString();
      const startOfNextMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
      ).toISOString();

      const { count: monthlyListingCount, error: monthlyCountError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
        .lt('created_at', startOfNextMonth);

      if (monthlyCountError) {
        throw monthlyCountError;
      }

      if ((monthlyListingCount ?? 0) >= FREE_PLAN_MONTHLY_LISTING_LIMIT) {
        return NextResponse.json(
          {
            error:
              'Free paket aylık 20 ilan limiti doldu. Pro pakete geçerek sınırsız devam edebilirsiniz.',
          },
          { status: 403 }
        );
      }
    }

    const { error: usageLogError } = await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      endpoint: 'analyze-property',
    });

    if (usageLogError) {
      throw usageLogError;
    }

    const imageParts = await Promise.all(
      imageUrls.map(async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Görsel alınamadı: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return {
          inlineData: {
            data: Buffer.from(buffer).toString('base64'),
            mimeType,
          },
        };
      })
    );

    const prompt = `Bu fotoğraflardaki evi profesyonel bir emlakçı ve iç mimar perspektifinden analiz et.

GÖREV 1: Teknik Analiz
- Oda sayısı ve türlerini belirle (salon, yatak odası, mutfak, banyo vb.)
- Zemin türünü tespit et (parke, laminat, seramik, mermer vb.)
- Mutfak tezgahı ve dolap malzemesini analiz et
- Aydınlatma durumunu değerlendir (doğal ışık, yapay aydınlatma)
- Genel kondisyonu belirle (sıfır, az kullanılmış, orta, eski vb.)
- Tespit ettiğin tüm özellikleri listele

GÖREV 2: Profesyonel İlan Metni
Türkiye emlak sektörüne uygun, ikna edici ve profesyonel bir ilan metni yaz:
- İlk cümlede en çekici özelliği vurgula
- Mekansal özellikleri detaylandır
- Kullanılan malzemeleri ve konfor unsurlarını belirt
- Potansiyel alıcının hayalini canlandıracak cümleler kullan
- Sahibinden.com, Hürriyet Emlak tarzında profesyonel bir dil kullan
- 150-250 kelime arası olsun

ÇIKTI FORMATI: Lütfen yanıtını JSON formatında ver:
{
  "title": "İlan başlığı (kısa ve çekici, max 60 karakter)",
  "description": "Profesyonel ilan metni (150-250 kelime)",
  "features": {
    "rooms": "Oda sayısı",
    "bathrooms": "Banyo sayısı",
    "floor_type": "Zemin türü",
    "kitchen_type": "Mutfak özellikleri",
    "lighting": "Aydınlatma durumu",
    "condition": "Genel kondisyon",
    "amenities": ["Özellik 1", "Özellik 2", "Özellik 3"]
  }
}

Lütfen sadece JSON yanıtı ver, başka açıklama ekleme.`;

    const availableModels = await getAvailableGeminiModels(process.env.GEMINI_API_KEY || '');
    const preferredModels = [
      PRIMARY_GEMINI_MODEL,
      ...GEMINI_MODELS.filter((model) => model !== PRIMARY_GEMINI_MODEL),
    ];

    const preferredAvailableModels = preferredModels.filter((model) =>
      availableModels.includes(model)
    );
    const modelCandidates = [
      ...preferredAvailableModels,
      ...availableModels.filter((model) => !preferredAvailableModels.includes(model)),
      ...preferredModels.filter((model) => !preferredAvailableModels.includes(model)),
    ];

    let result: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>['generateContent']>> | null = null;
    let lastModelError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent([prompt, ...imageParts]);
        break;
      } catch (err: any) {
        lastModelError = err;
      }
    }

    if (!result) {
      const modelList = modelCandidates.join(', ');
      throw lastModelError || new Error(`Desteklenen Gemini modeli bulunamadı. Denenen modeller: ${modelList}`);
    }

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI yanıtı JSON formatında değil');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysisData);
  } catch (error: any) {
    console.error('AI analiz hatası:', error);
    return NextResponse.json(
      {
        error: 'AI analizi başarısız oldu',
        details: error.message
      },
      { status: 500 }
    );
  }
}
