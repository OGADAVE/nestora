import type { Metadata } from 'next';
import Link from 'next/link';
import { PropertyForm, VehicleForm } from '@/components/ListForms';

export const metadata: Metadata = { title: 'List a property or vehicle', robots: { index: false } };

export default async function ListPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind === 'vehicle' ? 'vehicle' : 'property';
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold">List on Nestora</h1>
      <p className="mt-2 text-neutral-600">Every new listing is reviewed by our team before it goes live.</p>
      <div className="mt-6 inline-flex rounded-lg bg-neutral-100 p-1 text-sm font-medium">
        <Link href="/list" className={`rounded-md px-4 py-1.5 ${kind === 'property' ? 'bg-white shadow' : 'text-neutral-600'}`}>Property</Link>
        <Link href="/list?kind=vehicle" className={`rounded-md px-4 py-1.5 ${kind === 'vehicle' ? 'bg-white shadow' : 'text-neutral-600'}`}>Vehicle</Link>
      </div>
      <div className="mt-8">{kind === 'property' ? <PropertyForm /> : <VehicleForm />}</div>
    </div>
  );
}
