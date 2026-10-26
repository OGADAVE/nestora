import { createClient } from '@/lib/supabase/server';
import { isPremium, type Property, type Vehicle } from '@/lib/types';

const clean = (s: string) => s.replace(/[,()%*\\]/g, ' ').trim();
const PROPERTY_SELECT = '*, listing_media(id,url,media_type,position), profiles(id,full_name,avatar_url,phone,whatsapp,role,agency_name,agent_verified,plan,suspended)';
const VEHICLE_SELECT = '*, listing_media(id,url,media_type,position), profiles(id,full_name,avatar_url,phone,whatsapp,role,agency_name,agent_verified,plan,suspended)';

export type PropertyFilters = {
  q?: string; mode?: string; type?: string; beds?: string; baths?: string; min?: string; max?: string;
  furnished?: string; verified?: string; premium?: string; amenities?: string; sort?: string; page?: string;
};
export const PAGE_SIZE = 24;

const byPremium = <T extends { premium_until: string | null }>(rows: T[]) =>
  [...rows].sort((a, b) => Number(isPremium(b)) - Number(isPremium(a)));

export async function searchProperties(f: PropertyFilters) {
  const supabase = await createClient();
  let q = supabase.from('properties').select(PROPERTY_SELECT, { count: 'exact' }).eq('status', 'published');
  if (f.q) {
    const t = clean(f.q);
    if (t) q = q.or(`title.ilike.%${t}%,city.ilike.%${t}%,area.ilike.%${t}%,state.ilike.%${t}%,address.ilike.%${t}%,landmark.ilike.%${t}%`);
  }
  if (f.mode && f.mode !== 'All') {
    if (f.mode === 'Buy') q = q.eq('listing_type', 'Sale'); else q = q.eq('listing_type', f.mode);
  }
  if (f.type && f.type !== 'Any') q = q.eq('property_type', f.type);
  if (f.beds) q = q.gte('bedrooms', Number(f.beds));
  if (f.baths) q = q.gte('bathrooms', Number(f.baths));
  if (f.min) q = q.gte('price', Number(f.min));
  if (f.max) q = q.lte('price', Number(f.max));
  if (f.furnished === 'true' || f.furnished === 'false') q = q.eq('furnished', f.furnished === 'true');
  if (f.verified === '1') q = q.eq('verified', true);
  if (f.premium === '1') q = q.gt('premium_until', new Date().toISOString());
  if (f.amenities) q = q.contains('amenities', f.amenities.split(',').map((a) => a.trim()).filter(Boolean));
  if (f.sort === 'price_asc') q = q.order('price', { ascending: true });
  else if (f.sort === 'price_desc') q = q.order('price', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  const page = Math.max(1, Number(f.page) || 1);
  q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await q;
  if (error) console.error('searchProperties', error.message);
  return { items: byPremium((data ?? []) as unknown as Property[]), total: count ?? 0, page };
}

export type VehicleFilters = { q?: string; make?: string; body?: string; transmission?: string; fuel?: string; min?: string; max?: string; verified?: string; sort?: string; page?: string };

export async function searchVehicles(f: VehicleFilters) {
  const supabase = await createClient();
  let q = supabase.from('vehicles').select(VEHICLE_SELECT, { count: 'exact' }).eq('status', 'published');
  if (f.q) {
    const t = clean(f.q);
    if (t) q = q.or(`title.ilike.%${t}%,make.ilike.%${t}%,model.ilike.%${t}%,city.ilike.%${t}%`);
  }
  if (f.make && f.make !== 'All') q = q.eq('make', f.make);
  if (f.body && f.body !== 'All') q = q.eq('body_type', f.body);
  if (f.transmission && f.transmission !== 'All') q = q.eq('transmission', f.transmission);
  if (f.fuel && f.fuel !== 'All') q = q.eq('fuel', f.fuel);
  if (f.min) q = q.gte('price', Number(f.min));
  if (f.max) q = q.lte('price', Number(f.max));
  if (f.verified === '1') q = q.eq('verified', true);
  if (f.sort === 'price_asc') q = q.order('price', { ascending: true });
  else if (f.sort === 'price_desc') q = q.order('price', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  const page = Math.max(1, Number(f.page) || 1);
  q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await q;
  if (error) console.error('searchVehicles', error.message);
  return { items: byPremium((data ?? []) as unknown as Vehicle[]), total: count ?? 0, page };
}

export async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select(PROPERTY_SELECT).eq('slug', slug).maybeSingle();
  return data as unknown as Property | null;
}
export async function getVehicle(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('vehicles').select(VEHICLE_SELECT).eq('slug', slug).maybeSingle();
  return data as unknown as Vehicle | null;
}
export async function similarProperties(p: Property) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select(PROPERTY_SELECT).eq('status', 'published').eq('listing_type', p.listing_type)
    .eq('city', p.city ?? '').neq('id', p.id).limit(3);
  return (data ?? []) as unknown as Property[];
}
export async function featured() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [p, v] = await Promise.all([
    supabase.from('properties').select(PROPERTY_SELECT).eq('status', 'published').gt('premium_until', now).order('created_at', { ascending: false }).limit(6),
    supabase.from('vehicles').select(VEHICLE_SELECT).eq('status', 'published').order('created_at', { ascending: false }).limit(3),
  ]);
  let props = (p.data ?? []) as unknown as Property[];
  if (props.length < 3) {
    const more = await supabase.from('properties').select(PROPERTY_SELECT).eq('status', 'published').order('created_at', { ascending: false }).limit(6);
    props = [...props, ...((more.data ?? []) as unknown as Property[]).filter((x) => !props.some((y) => y.id === x.id))].slice(0, 6);
  }
  return { properties: props, vehicles: (v.data ?? []) as unknown as Vehicle[] };
}
export async function currentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data ? { user, profile: data as import('@/lib/types').Profile } : null;
}
