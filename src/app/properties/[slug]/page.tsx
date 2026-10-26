import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bath, BedDouble, Car, MapPin, Ruler } from 'lucide-react';
import Gallery from '@/components/Gallery';
import MortgageCalculator from '@/components/MortgageCalculator';
import ContactPanel from '@/components/ContactPanel';
import ReportForm from '@/components/ReportForm';
import BookingForm from '@/components/BookingForm';
import MapEmbed from '@/components/MapEmbed';
import SaveButton from '@/components/SaveButton';
import { PropertyCard, coverOf } from '@/components/ListingCards';
import { PremiumBadge, VerifiedAgent, VerifiedProperty } from '@/components/Badges';
import { getProperty, similarProperties } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { priceLabel, siteUrl } from '@/lib/format';
import { isPremium } from '@/lib/types';
import { startConversation } from '@/app/actions';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProperty((await params).slug);
  if (!p || p.status !== 'published') return { title: 'Property not found' };
  const desc = `${p.property_type} ${p.listing_type === 'Sale' ? 'for sale' : 'for ' + p.listing_type.toLowerCase()} in ${[p.area, p.city].filter(Boolean).join(', ')}. ${priceLabel(p.price, p.price_period)}.`;
  const img = coverOf(p.listing_media);
  return { title: p.title, description: desc, alternates: { canonical: `/properties/${p.slug}` }, openGraph: { title: p.title, description: desc, images: [img], type: 'website' }, twitter: { card: 'summary_large_image', title: p.title, description: desc, images: [img] } };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (p.status !== 'published' && p.owner_id !== user?.id) notFound();
  if (p.status === 'published') void supabase.rpc('increment_views', { p_kind: 'property', p_id: p.id });

  const [similar, saved, booked] = await Promise.all([
    similarProperties(p),
    user ? supabase.from('saved_listings').select('listing_id').match({ user_id: user.id, kind: 'property', listing_id: p.id }).maybeSingle() : Promise.resolve({ data: null }),
    p.listing_type === 'Shortlet' ? supabase.from('bookings').select('check_in,check_out').eq('property_id', p.id).in('status', ['pending', 'confirmed']).gte('check_out', new Date().toISOString().slice(0, 10)) : Promise.resolve({ data: [] }),
  ]);
  const images = [...(p.listing_media ?? [])].filter((m) => m.media_type === 'image').sort((a, b) => a.position - b.position).map((m) => m.url);
  const video = p.video_url ?? p.listing_media?.find((m) => m.media_type === 'video')?.url;
  const seller = p.profiles;
  const loc = [p.area, p.city, p.state].filter(Boolean).join(', ');

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'RealEstateListing', name: p.title, description: p.description ?? undefined, url: `${siteUrl()}/properties/${p.slug}`,
    image: images, datePosted: p.created_at,
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'NGN', availability: 'https://schema.org/InStock' },
    about: { '@type': 'Residence', address: { '@type': 'PostalAddress', addressLocality: p.city, addressRegion: p.state, addressCountry: 'NG', streetAddress: p.address ?? undefined },
      numberOfRooms: p.bedrooms ?? undefined, floorSize: p.size_sqm ? { '@type': 'QuantitativeValue', value: p.size_sqm, unitCode: 'MTK' } : undefined },
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {p.status !== 'published' && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This listing is {p.status.replace('_', ' ')} and only visible to you.</p>}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <Gallery images={images} title={p.title} />
          <div>
            <div className="flex flex-wrap items-center gap-2">{p.verified && <VerifiedProperty />}{isPremium(p) && <PremiumBadge />}{seller?.agent_verified && <VerifiedAgent />}</div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{p.title}</h1>
              <SaveButton kind="property" id={p.id} saved={!!saved.data} />
            </div>
            <p className="mt-2 flex items-center gap-1 text-neutral-600"><MapPin size={16} />{loc}</p>
            <p className="mt-4 text-3xl font-bold text-navy-900">{priceLabel(p.price, p.price_period)}{p.negotiable && <span className="ml-2 text-sm font-medium text-neutral-500">Negotiable</span>}</p>
            <ul className="mt-5 flex flex-wrap gap-5 text-neutral-700">
              {!!p.bedrooms && <li className="flex items-center gap-1.5"><BedDouble size={18} />{p.bedrooms} bed</li>}
              {!!p.bathrooms && <li className="flex items-center gap-1.5"><Bath size={18} />{p.bathrooms} bath</li>}
              {!!p.parking_spaces && <li className="flex items-center gap-1.5"><Car size={18} />{p.parking_spaces} parking</li>}
              {!!p.size_sqm && <li className="flex items-center gap-1.5"><Ruler size={18} />{p.size_sqm} sqm</li>}
            </ul>
          </div>
          {p.description && <section><h2 className="font-display text-lg font-semibold">About this property</h2><p className="mt-2 whitespace-pre-line leading-relaxed text-neutral-700">{p.description}</p></section>}
          {(p.service_charge || p.agency_fee || p.legal_fee || p.caution_fee) && (
            <section><h2 className="font-display text-lg font-semibold">Additional fees</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {([['Service charge', p.service_charge], ['Agency fee', p.agency_fee], ['Legal fee', p.legal_fee], ['Caution fee', p.caution_fee]] as const).filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex justify-between rounded-lg bg-neutral-50 px-3 py-2"><dt>{k}</dt><dd className="font-semibold">{priceLabel(Number(v))}</dd></div>)}
              </dl></section>
          )}
          {!!p.amenities?.length && <section><h2 className="font-display text-lg font-semibold">Features and amenities</h2><ul className="mt-3 flex flex-wrap gap-2">{p.amenities.map((a) => <li key={a} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">{a}</li>)}</ul></section>}
          {video && <section><h2 className="font-display text-lg font-semibold">Video</h2><video src={video} controls preload="none" className="mt-3 w-full rounded-2xl" /></section>}
          {p.virtual_tour_url && <section><h2 className="font-display text-lg font-semibold">360° virtual tour</h2><iframe title="360° virtual tour" src={p.virtual_tour_url} loading="lazy" allowFullScreen className="mt-3 h-[420px] w-full rounded-2xl border-0" /></section>}
          <section><h2 className="mb-3 font-display text-lg font-semibold">Location and nearby places</h2><MapEmbed lat={p.lat} lng={p.lng} query={`${p.address ?? ''} ${loc}`} /></section>
          {p.listing_type === 'Sale' && <MortgageCalculator price={Number(p.price)} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-navy-900 font-semibold text-white">{(seller?.full_name ?? 'N').charAt(0)}</div>
              <div><p className="font-semibold">{seller?.full_name ?? 'Nestora lister'}</p><p className="text-xs text-neutral-500">{seller?.agency_name ?? (seller?.role ?? '').replace('_', ' ')}</p></div>
            </div>
            <div className="mt-4">
              <ContactPanel kind="property" id={p.id} title={p.title} phone={p.contact_phone ?? seller?.phone} whatsapp={p.contact_whatsapp ?? seller?.whatsapp} />
              {user?.id !== p.owner_id && <form action={startConversation.bind(null, 'property', p.id, p.owner_id)} className="mt-2"><button className="btn-primary w-full">Message on Nestora</button></form>}
            </div>
          </div>
          {p.listing_type === 'Shortlet' && <BookingForm propertyId={p.id} nightly={Number(p.price)} booked={(booked.data ?? []) as { check_in: string; check_out: string }[]} />}
          <div className="card p-4"><ReportForm kind="property" id={p.id} /></div>
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="mt-16"><h2 className="font-display text-2xl font-semibold">Similar properties</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map((s) => <PropertyCard key={s.id} p={s} saved={false} />)}</div>
          <Link href="/properties" className="mt-6 inline-block text-sm font-semibold underline">Browse all properties</Link></section>
      )}
    </div>
  );
}
