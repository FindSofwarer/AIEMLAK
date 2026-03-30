import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, api_key, ai_description, ai_title, generated_image_url } = body || {};

    if (!listing_id || !api_key) {
      return NextResponse.json(
        { error: 'listing_id ve api_key zorunludur' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase environment değişkenleri eksik' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'x-api-key': api_key,
        },
      },
    });

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listing_id)
      .maybeSingle();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Geçersiz listing_id veya api_key' },
        { status: 403 }
      );
    }

    const payload: {
      ai_title?: string | null;
      ai_description?: string | null;
      title?: string | null;
      description?: string | null;
      automation_image_url?: string | null;
      status: 'draft' | 'generating' | 'published';
    } = {
      status: 'published',
    };

    if (typeof ai_title === 'string') {
      payload.ai_title = ai_title;
      payload.title = ai_title;
    }

    if (typeof ai_description === 'string') {
      payload.ai_description = ai_description;
      payload.description = ai_description;
    }

    if (typeof generated_image_url === 'string') {
      payload.automation_image_url = generated_image_url;
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update(payload)
      .eq('id', listing_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'İlan güncellenemedi', details: updateError.message },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, listing_id: listing.id, user_id: listing.user_id });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Automation update başarısız',
        details: error?.message || 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
