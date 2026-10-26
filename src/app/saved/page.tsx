import Link from 'next/link';
import { PropertyCard, VehicleCard } from '@/components/ListingCards';
import { createClient } from '@/lib/supabase/server';
import type { Property, Vehicle } from '@/lib/types';

export const metadata = { title: 'Saved listings', robots: { index: false } };
const SEL = '*, listing_media(id,url,media_type,position), profiles(id,full_name,avatar_url,phone,whatsapp,role,agency_name,agent_verified,plan,suspended)';

export default async function Saved() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: rows } = await supabase.from('saved_listings').select('kind, listing_id').eq('user_id', user!.id).order('created_at', { ascending: false });
  const pid = (rows ?? []).filter((r) => r.kind === 'property').map((r) => r.listing_id);
  const vid = (rows ?? []).filter((r) => r.kind === 'vehicle').map((r) => r.listing_id);
  const [p, v] = await Promise.all([
    pid.length ? supabase.from('properties').select(SEL).in('id', pid) : { data: [] },
    vid.length ? supabase.from('vehicles').select(SEL).in('id', vid) : { data: [] },
  ]);
  const props = (p.data ?? []) as unknown as Property[], cars = (v.data ?? []) as unknown as Vehicle[];
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold">Saved listings</h1>
      {props.length + cars.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-12 text-center"><p className="font-semibold">Nothing saved yet</p><p className="mt-1 text-sm text-neutral-500">Tap the heart on any listing to keep it here.</p><Link href="/properties" className="btn-primary mt-5">Browse properties</Link></div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {props.map((x) => <PropertyCard key={x.id} p={x} saved />)}{cars.map((x) => <VehicleCard key={x.id} v={x} saved />)}
        </div>
      )}
    </div>
  );
}
