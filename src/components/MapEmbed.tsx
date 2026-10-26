const CATEGORIES = ['schools', 'hospitals', 'banks', 'markets', 'police stations', 'gyms', 'shopping malls'];

/** Google Maps Embed API (free). Shows the property, plus a nearby-places view for the chosen category. */
export default function MapEmbed({ lat, lng, query }: { lat?: number | null; lng?: number | null; query: string }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return <div className="grid h-64 place-items-center rounded-2xl bg-neutral-100 text-sm text-neutral-500">Map unavailable. Add a Google Maps API key.</div>;
  const place = lat && lng ? `${lat},${lng}` : query;
  return (
    <div>
      <iframe title="Property location" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-72 w-full rounded-2xl border-0"
        src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(place)}&zoom=15`} />
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {CATEGORIES.map((c) => (
          <li key={c}><a className="rounded-full border px-3 py-1 hover:border-navy-900" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(c)}/@${lat && lng ? `${lat},${lng},15z` : ''}`}>Nearby {c}</a></li>
        ))}
      </ul>
    </div>
  );
}
