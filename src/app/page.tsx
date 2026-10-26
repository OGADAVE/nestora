import Link from 'next/link';
import { BadgeCheck, Building2, LandPlot, ShieldCheck, Sparkles, Store, Zap } from 'lucide-react';
import SmartSearch from '@/components/SmartSearch';
import { PropertyCard, VehicleCard } from '@/components/ListingCards';
import { featured } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

const CATEGORIES = [
  { label: 'Apartments', href: '/properties?type=Apartment', icon: Building2 }, { label: 'Land', href: '/properties?type=Land', icon: LandPlot },
  { label: 'Offices', href: '/properties?type=Office+Space', icon: Store }, { label: 'Shortlets', href: '/properties?mode=Shortlet', icon: Sparkles },
  { label: 'Hostels', href: '/properties?type=Hostel', icon: Building2 },
];
const CITIES = [['Lagos', 'Lagos'], ['Abuja', 'Abuja'], ['Port Harcourt', 'Port Harcourt'], ['Ibadan', 'Ibadan'], ['Enugu', 'Enugu']];

export default async function Home() {
  const { properties, vehicles } = await featured();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const savedSet = new Set<string>();
  if (user) (await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)).data?.forEach((s) => savedSet.add(s.listing_id));
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" fetchPriority="high" />
        <div className="container-x py-24 md:py-32">
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">Find a home you can trust, anywhere in Nigeria.</h1>
          <p className="mt-5 max-w-xl text-lg text-neutral-200">Every verified listing is checked by our team. Search in plain English and talk to verified agents directly.</p>
          <div className="mt-8"><SmartSearch /></div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/properties" className="btn-gold">Browse properties</Link>
            <Link href="/list" className="btn border border-white/40 text-white hover:bg-white/10">List yours</Link>
          </div>
        </div>
      </section>

      <section className="container-x mt-16">
        <h2 className="font-display text-2xl font-semibold">Browse by category</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {CATEGORIES.map(({ label, href, icon: Icon }) => (
            <li key={label}><Link href={href} className="card flex flex-col items-start gap-3 p-5 hover:border-gold-500"><Icon className="text-gold-600" /><span className="font-semibold">{label}</span></Link></li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-16">
        <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-semibold">Featured properties</h2><Link href="/properties" className="text-sm font-semibold text-navy-900 underline">View all</Link></div>
        {properties.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{properties.slice(0, 6).map((p) => <PropertyCard key={p.id} p={p} saved={savedSet.has(p.id)} />)}</div>
        ) : <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-neutral-500">No listings are published yet. <Link href="/list" className="font-semibold underline">Be the first to list.</Link></p>}
      </section>

      <section className="container-x mt-16">
        <h2 className="font-display text-2xl font-semibold">Popular locations</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {CITIES.map(([label, q]) => <li key={label}><Link href={`/properties?q=${encodeURIComponent(q)}`} className="card block p-5 text-center font-semibold hover:border-gold-500">{label}</Link></li>)}
        </ul>
      </section>

      {vehicles.length > 0 && (
        <section className="container-x mt-16">
          <div className="flex items-end justify-between"><h2 className="font-display text-2xl font-semibold">Latest vehicles</h2><Link href="/vehicles" className="text-sm font-semibold underline">View all</Link></div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map((v) => <VehicleCard key={v.id} v={v} saved={savedSet.has(v.id)} />)}</div>
        </section>
      )}

      <section className="mt-20 bg-navy-900 py-16 text-white">
        <div className="container-x grid gap-8 md:grid-cols-4">
          {[[ShieldCheck, 'Verified listings', 'Our team checks the address, media and ownership before the blue badge appears.'],
            [BadgeCheck, 'Verified agents', 'Government ID, selfie and phone checks for every gold-badge agent.'],
            [Sparkles, 'Plain-English search', 'Type what you want. We turn it into filters.'],
            [Zap, 'Fast on any phone', 'Optimised images and a light interface that works on slow networks.']].map(([Icon, t, d]) => {
            const I = Icon as typeof ShieldCheck;
            return <div key={t as string}><I className="text-gold-400" /><h3 className="mt-3 font-semibold">{t as string}</h3><p className="mt-1 text-sm text-neutral-300">{d as string}</p></div>;
          })}
        </div>
      </section>
    </>
  );
}
