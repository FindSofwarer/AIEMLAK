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

export interface ListingKeypoints {
  listing_type?: 'sale' | 'rent';
  property_type?: string;
  price_try?: number | null;
  gross_m2?: number | null;
  net_m2?: number | null;
  room_layout?: string | null;
  building_age?: number | null;
  floor_no?: number | null;
  total_floors?: number | null;
  heating_type?: string | null;
  bathrooms_count?: number | null;
  balcony_count?: number | null;
  furnished?: boolean | null;
  usage_status?: string | null;
  dues_try?: number | null;
  deed_status?: string | null;
  location_note?: string | null;
  proximity_note?: string | null;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  image_urls: string[];
  property_features: PropertyFeatures & ListingKeypoints;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  lead_source: string | null;
  interested_listing_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_locations: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  listing_id: string | null;
  customer_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: 'planned' | 'completed' | 'canceled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
