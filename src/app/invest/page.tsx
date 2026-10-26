import Link from 'next/link';
import RoiCalculator from '@/components/RoiCalculator';
import { PropertyCard } from '@/components/ListingCards';
import { searchProperties } from '@/lib/queries';

export const metadata = { title: 'Property investment tools', description: 'Estimate rental yield, ROI and appreciation before you buy.' };

export default async function Invest() {
  const { items } = await searchProperties({ mode: 'Investment' });
  return (
    <div className="container-x py-12">
      <h1 className="font-display text-3xl font-bold">Invest with numbers, not guesses</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">Enter a price, the rent you expect and your growth assumptions to see yield and total return.</p>
      <div className="mt-8"><RoiCalculator /></div>
      <h2 className="mt-14 font-display text-2xl font-semibold">Investment opportunities</h2>
      {items.length ? <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PropertyCard key={p.id} p={p} saved={false} />)}</div>
        : <p className="mt-4 text-neutral-600">No investment listings yet. <Link href="/properties?mode=Buy" className="font-semibold underline">Browse properties for sale</Link>.</p>}
    </div>
  );
}
