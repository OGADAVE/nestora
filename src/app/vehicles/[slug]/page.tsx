import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Fuel, Gauge, MapPin, Settings2 } from 'lucide-react';
import Gallery from '@/components/Gallery';
import ContactPanel from '@/components/ContactPanel';
import ReportForm from '@/components/ReportForm';
import SaveButton from '@/components/SaveButton';
import { coverOf } from '@/components/ListingCards';
import { PremiumBadge, VerifiedAgent, VerifiedProperty } from '@/components/Badges';
import { getVehicle } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { formatNaira, siteUrl } from '@/lib/format';
import { isPremium } from '@/lib/types';
import { startConversation } from '@/app/actions';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getVehicle((await params).slug);
  if (!v || v.status !== 'published') return { title: 'Vehicle not found' };
  const desc = `${v.year} ${v.make} ${v.model} in ${v.city}. ${formatNaira(v.price)}.`;
  return { title: v.title, description: desc, alternates: { canonical: `/vehicles/${v.slug}` }, openGraph: { title: v.title, description: desc, images: [coverOf(v.listing_media)] } };
}

export default async function VehiclePage({ params }: Props) {
  const v = await getVehicle((await params).slug);
  if (!v) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (v.status !== 'published' && v.owner_id !== user?.id) notFound();
  if (v.status === 'published') void supabase.rpc('increment_views', { p_kind: 'vehicle', p_id: v.id });
  const saved = user ? (await supabase.from('saved_listings').select('listing_id').match({ user_id: user.id, kind: 'vehicle', listing_id: v.id }).maybeSingle()).data : null;
  const images = [...(v.listing_media ?? [])].filter((m) => m.media_type === 'image').sort((a, b) => a.position - b.position).map((m) => m.url);
  const seller = v.profiles;
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Vehicle', name: v.title, brand: v.make, model: v.model, vehicleModelDate: String(v.year), image: images, url: `${siteUrl()}/vehicles/${v.slug}`,
    mileageFromOdometer: v.mileage_km ? { '@type': 'QuantitativeValue', value: v.mileage_km, unitCode: 'KMT' } : undefined, offers: { '@type': 'Offer', price: v.price, priceCurrency: 'NGN' } };
  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <Gallery images={images} title={v.title} />
          <div>
            <div className="flex flex-wrap gap-2">{v.verified && <VerifiedProperty label="Verified vehicle" />}{isPremium(v) && <PremiumBadge />}{seller?.agent_verified && <VerifiedAgent />}</div>
            <div className="mt-3 flex items-start justify-between gap-4"><h1 className="font-display text-2xl font-bold md:text-3xl">{v.title}</h1><SaveButton kind="vehicle" id={v.id} saved={!!saved} /></div>
            <p className="mt-2 flex items-center gap-1 text-neutral-600"><MapPin size={16} />{[v.area, v.city, v.state].filter(Boolean).join(', ')}</p>
            <p className="mt-4 text-3xl font-bold text-navy-900">{formatNaira(v.price)}{v.negotiable && <span className="ml-2 text-sm font-medium text-neutral-500">Negotiable</span>}</p>
            <ul className="mt-5 flex flex-wrap gap-5 text-neutral-700">
              {v.mileage_km != null && <li className="flex items-center gap-1.5"><Gauge size={18} />{v.mileage_km.toLocaleString()} km</li>}
              {v.transmission && <li className="flex items-center gap-1.5"><Settings2 size={18} />{v.transmission}</li>}
              {v.fuel && <li className="flex items-center gap-1.5"><Fuel size={18} />{v.fuel}</li>}
              <li>{v.year}</li>{v.condition && <li>{v.condition}</li>}{v.color && <li>{v.color}</li>}
            </ul>
          </div>
          {v.description && <section><h2 className="font-display text-lg font-semibold">About this vehicle</h2><p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">{v.description}</p></section>}
          {!!v.features?.length && <section><h2 className="font-display text-lg font-semibold">Features</h2><ul className="mt-3 flex flex-wrap gap-2">{v.features.map((f) => <li key={f} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">{f}</li>)}</ul></section>}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="font-semibold">{seller?.full_name ?? 'Nestora seller'}</p><p className="text-xs text-neutral-500">{seller?.agency_name ?? ''}</p>
            <div className="mt-4"><ContactPanel kind="vehicle" id={v.id} title={v.title} phone={v.contact_phone ?? seller?.phone} whatsapp={v.contact_whatsapp ?? seller?.whatsapp} />
              {user?.id !== v.owner_id && <form action={startConversation.bind(null, 'vehicle', v.id, v.owner_id)} className="mt-2"><button className="btn-primary w-full">Message on Nestora</button></form>}</div>
          </div>
          <div className="card p-4"><ReportForm kind="vehicle" id={v.id} /></div>
        </aside>
      </div>
    </div>
  );
}
