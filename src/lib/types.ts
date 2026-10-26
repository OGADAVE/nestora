export type Media = { id: string; url: string; media_type: string; position: number };
export type Property = {
  id: string; slug: string; owner_id: string; title: string; description: string | null; property_type: string; listing_type: string;
  price: number; price_period: string | null; negotiable: boolean | null; service_charge: number | null; agency_fee: number | null;
  legal_fee: number | null; caution_fee: number | null; state: string | null; city: string | null; area: string | null;
  address: string | null; landmark: string | null; lat: number | null; lng: number | null; bedrooms: number | null;
  bathrooms: number | null; toilets: number | null; parking_spaces: number | null; size_sqm: number | null; furnished: boolean | null;
  condition: string | null; amenities: string[] | null; video_url: string | null; virtual_tour_url: string | null;
  contact_phone: string | null; contact_whatsapp: string | null; contact_email: string | null; status: string; verified: boolean;
  premium_until: string | null; views: number; created_at: string; listing_media?: Media[]; profiles?: Profile | null;
};
export type Vehicle = {
  id: string; slug: string; owner_id: string; title: string; description: string | null; make: string; model: string; year: number;
  price: number; negotiable: boolean | null; body_type: string | null; mileage_km: number | null; transmission: string | null;
  fuel: string | null; color: string | null; condition: string | null; features: string[] | null; state: string | null;
  city: string | null; area: string | null; contact_phone: string | null; contact_whatsapp: string | null; status: string;
  verified: boolean; premium_until: string | null; views: number; created_at: string; listing_media?: Media[]; profiles?: Profile | null;
};
export type Profile = {
  id: string; full_name: string | null; avatar_url: string | null; phone: string | null; whatsapp: string | null; role: string;
  agency_name: string | null; agent_verified: boolean; plan: string; suspended: boolean;
};
export const isPremium = (x: { premium_until: string | null }) => !!x.premium_until && new Date(x.premium_until) > new Date();
