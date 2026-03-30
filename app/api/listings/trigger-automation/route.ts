import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AUTOMATION_WEBHOOK_URL = process.env.N8N_LISTING_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    if (!AUTOMATION_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'N8N_LISTING_WEBHOOK_URL environment variable tanımlı değil' },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id } = await request.json();

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id zorunludur' }, { status: 400 });
    }

    const [{ data: listing, error: listingError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from('listings')
        .select('id, user_id, property_features, status')
        .eq('id', listing_id)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('api_key')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (listingError || !listing) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    }

    if (profileError || !profile?.api_key) {
      return NextResponse.json({ error: 'API key bulunamadı' }, { status: 400 });
    }

    const payload = {
      listing_id: listing.id,
      user_id: listing.user_id,
      api_key: profile.api_key,
      keypoints: listing.property_features || {},
    };

    const webhookResponse = await fetch(AUTOMATION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      return NextResponse.json(
        {
          error: 'n8n webhook çağrısı başarısız',
          details: errorText || webhookResponse.statusText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Automation trigger başarısız',
        details: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
