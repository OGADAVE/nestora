import Image from 'next/image';
import Link from 'next/link';
import { Bath, BedDouble, Gauge, MapPin, Ruler, Settings2 } from 'lucide-react';
import { isPremium, type Property, type Vehicle } from '@/lib/types';
import { priceLabel, formatNaira } from '@/lib/format';
import { PremiumBadge, VerifiedProperty } from './Badges';
import SaveButton from './SaveButton';

const FALLBACK = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
export const coverOf = (m?: { url: string; media_type: string; position: number }[]) =>
  [...(m ?? [])].filter((x) => x.media_type === 'image').sort((a, b) => a.position - b.position)[0]?.url ?? FALLBACK;

export function PropertyCard({ p, saved }: { p: Property; saved: boolean }) {
  return (
    <article className="group card overflow-hidden transition-shadow hover:shadow-xl">
      <Link href={`/properties/${p.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image src={coverOf(p.listing_media)} alt={p.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {p.verified && <VerifiedProperty />}
            {isPremium(p) && <PremiumBadge />}
          </div>
          <div className="absolute right-3 top-3"><SaveButton kind="property" id={p.id} saved={saved} /></div>
          <span className="absolute bottom-3 left-3 rounded-md bg-navy-900/90 px-2 py-1 text-xs font-semibold text-white">{p.listing_type === 'Sale' ? 'For sale' : p.listing_type === 'Rent' ? 'For rent' : p.listing_type}</span>
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-navy-900">{priceLabel(p.price, p.price_period)}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold">{p.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500"><MapPin size={14} />{[p.area, p.city].filter(Boolean).join(', ')}</p>
          <div className="mt-3 flex gap-4 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
            {!!p.bedrooms && <span className="flex items-center gap-1"><BedDouble size={15} />{p.bedrooms}</span>}
            {!!p.bathrooms && <span className="flex items-center gap-1"><Bath size={15} />{p.bathrooms}</span>}
            {!!p.size_sqm && <span className="flex items-center gap-1"><Ruler size={15} />{p.size_sqm} sqm</span>}
            <span className="ml-auto text-neutral-400">{p.property_type}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function VehicleCard({ v, saved }: { v: Vehicle; saved: boolean }) {
  return (
    <article className="group card overflow-hidden transition-shadow hover:shadow-xl">
      <Link href={`/vehicles/${v.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <Image src={coverOf(v.listing_media)} alt={v.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {v.verified && <VerifiedProperty label="Verified vehicle" />}
            {isPremium(v) && <PremiumBadge />}
          </div>
          <div className="absolute right-3 top-3"><SaveButton kind="vehicle" id={v.id} saved={saved} /></div>
        </div>
        <div className="p-4">
          <p className="text-lg font-bold text-navy-900">{formatNaira(v.price)}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold">{v.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500"><MapPin size={14} />{[v.area, v.city].filter(Boolean).join(', ')}</p>
          <div className="mt-3 flex gap-4 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
            {v.mileage_km != null && <span className="flex items-center gap-1"><Gauge size={15} />{v.mileage_km.toLocaleString()} km</span>}
            {v.transmission && <span className="flex items-center gap-1"><Settings2 size={15} />{v.transmission}</span>}
            <span className="ml-auto text-neutral-400">{v.year}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
