export interface Profile {
  id: string;
  full_name: string | null;
  agency_name: string | null;
  subscription_status: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface PropertyFeatures {
  rooms?: number;
  bathrooms?: number;
  floor_type?: string;
  kitchen_type?: string;
  lighting?: string;
  condition?: string;
  amenities?: string[];
  [key: string]: any;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  image_urls: string[];
  property_features: PropertyFeatures;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}
