import type { Metadata } from 'next';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { PropertyCard } from '@/components/ListingCards';
import { searchProperties, type PropertyFilters } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Properties for sale and rent in Nigeria', description: 'Search verified apartments, houses, land, offices and shortlets across Nigeria.' };

export default async function Properties({ searchParams }: { searchParams: Promise<PropertyFilters> }) {
  const f = await searchParams;
  const { items, total, page } = await searchProperties(f);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const saved = new Set<string>();
  if (user) (await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id).eq('kind', 'property')).data?.forEach((s) => saved.add(s.listing_id));
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold">Properties</h1>
      <div className="mt-6"><FilterBar f={f} /></div>
      <p className="mt-6 text-sm text-neutral-500" aria-live="polite">{total} {total === 1 ? 'property' : 'properties'} found</p>
      {items.length ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PropertyCard key={p.id} p={p} saved={saved.has(p.id)} />)}</div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center"><p className="font-semibold">No properties match these filters</p><p className="mt-1 text-sm text-neutral-500">Widen the price range or remove a filter.</p></div>
      )}
      <Pagination base="/properties" params={{ ...f }} page={page} total={total} />
    </div>
  );
}
