import { PROPERTY_TYPES } from '@/lib/constants';
import type { PropertyFilters } from '@/lib/queries';

export default function FilterBar({ f }: { f: PropertyFilters }) {
  return (
    <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2"><label className="label" htmlFor="q">Location or keyword</label><input id="q" name="q" defaultValue={f.q} className="field" placeholder="Lekki, Wuse 2, duplex..." /></div>
      <div><label className="label" htmlFor="mode">Listing</label>
        <select id="mode" name="mode" defaultValue={f.mode ?? 'All'} className="field">{['All', 'Buy', 'Rent', 'Shortlet', 'Sublet', 'Lease', 'Investment'].map((x) => <option key={x}>{x}</option>)}</select></div>
      <div><label className="label" htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={f.type ?? 'Any'} className="field"><option>Any</option>{PROPERTY_TYPES.map((x) => <option key={x}>{x}</option>)}</select></div>
      <div><label className="label" htmlFor="beds">Bedrooms</label>
        <select id="beds" name="beds" defaultValue={f.beds ?? ''} className="field"><option value="">Any</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
      <div><label className="label" htmlFor="sort">Sort</label>
        <select id="sort" name="sort" defaultValue={f.sort ?? ''} className="field"><option value="">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div>
      <div><label className="label" htmlFor="min">Min price (₦)</label><input id="min" name="min" type="number" min="0" defaultValue={f.min} className="field" /></div>
      <div><label className="label" htmlFor="max">Max price (₦)</label><input id="max" name="max" type="number" min="0" defaultValue={f.max} className="field" /></div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="verified" value="1" defaultChecked={f.verified === '1'} />Verified only</label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="premium" value="1" defaultChecked={f.premium === '1'} />Premium only</label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="furnished" value="true" defaultChecked={f.furnished === 'true'} />Furnished</label>
      <input type="hidden" name="amenities" value={f.amenities ?? ''} />
      <button className="btn-primary self-end lg:col-span-1">Search</button>
    </form>
  );
}
