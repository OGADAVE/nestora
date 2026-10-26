import type { Metadata } from 'next';
import Pagination from '@/components/Pagination';
import { VehicleCard } from '@/components/ListingCards';
import { searchVehicles, type VehicleFilters } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { BODY_TYPES, MAKES } from '@/lib/constants';

export const metadata: Metadata = { title: 'Cars and vehicles for sale in Nigeria', description: 'Browse verified cars from trusted dealers and private sellers across Nigeria.' };

export default async function Vehicles({ searchParams }: { searchParams: Promise<VehicleFilters> }) {
  const f = await searchParams;
  const { items, total, page } = await searchVehicles(f);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const saved = new Set<string>();
  if (user) (await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id).eq('kind', 'vehicle')).data?.forEach((s) => saved.add(s.listing_id));
  const Sel = ({ name, label, opts }: { name: keyof VehicleFilters; label: string; opts: string[] }) => (
    <div><label className="label" htmlFor={name}>{label}</label><select id={name} name={name} defaultValue={f[name] ?? 'All'} className="field"><option>All</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
  );
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold">Vehicles</h1>
      <form method="get" className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2"><label className="label" htmlFor="q">Make, model or city</label><input id="q" name="q" defaultValue={f.q} className="field" /></div>
        <Sel name="make" label="Make" opts={MAKES} /><Sel name="body" label="Body type" opts={BODY_TYPES} />
        <Sel name="transmission" label="Transmission" opts={['Automatic', 'Manual']} /><Sel name="fuel" label="Fuel" opts={['Petrol', 'Diesel', 'Hybrid', 'Electric']} />
        <div><label className="label" htmlFor="min">Min price (₦)</label><input id="min" name="min" type="number" defaultValue={f.min} className="field" /></div>
        <div><label className="label" htmlFor="max">Max price (₦)</label><input id="max" name="max" type="number" defaultValue={f.max} className="field" /></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="verified" value="1" defaultChecked={f.verified === '1'} />Verified only</label>
        <button className="btn-primary self-end">Search</button>
      </form>
      <p className="mt-6 text-sm text-neutral-500" aria-live="polite">{total} {total === 1 ? 'vehicle' : 'vehicles'} found</p>
      {items.length ? <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((v) => <VehicleCard key={v.id} v={v} saved={saved.has(v.id)} />)}</div>
        : <div className="mt-10 rounded-2xl border border-dashed p-12 text-center"><p className="font-semibold">No vehicles match these filters</p></div>}
      <Pagination base="/vehicles" params={{ ...f }} page={page} total={total} />
    </div>
  );
}
