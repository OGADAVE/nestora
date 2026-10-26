'use client';
import { Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { parseSearch, toSearchParams } from '@/lib/smart-search';

const EXAMPLES = ['3 bedroom apartment under ₦4M in Lekki with parking', 'Land for sale in Guzape under ₦40M', 'Furnished shortlet in Victoria Island'];

export default function SmartSearch({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [market, setMarket] = useState<'properties' | 'vehicles'>('properties');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = q.trim();
    if (market === 'vehicles') return router.push(text ? `/vehicles?q=${encodeURIComponent(text)}` : '/vehicles');
    const parsed = parseSearch(text);
    const sp = toSearchParams(parsed);
    if (!sp.get('q') && !parsed.propertyType && !parsed.bedrooms && !parsed.maxPrice && text) sp.set('q', text);
    router.push(`/properties?${sp.toString()}`);
  };
  return (
    <div className="w-full max-w-3xl">
      <div role="tablist" aria-label="Search type" className="mb-2 inline-flex rounded-lg bg-white/10 p-1 text-sm text-white backdrop-blur">
        {(['properties', 'vehicles'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={market === m} onClick={() => setMarket(m)} className={`rounded-md px-4 py-1.5 font-medium capitalize ${market === m ? 'bg-white text-navy-900' : 'text-white/80'}`}>{m}</button>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
        <Sparkles className="ml-3 shrink-0 text-gold-500" size={20} aria-hidden />
        <label htmlFor="smart-q" className="sr-only">Describe what you are looking for</label>
        <input id="smart-q" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none sm:text-base"
          placeholder={market === 'vehicles' ? 'Try “Toyota Prado in Abuja”' : 'Try “3 bedroom apartment under ₦4M in Lekki with parking”'} />
        <button className="btn-gold px-5 py-3"><Search size={18} /><span className="hidden sm:inline">Search</span></button>
      </form>
      {market === 'properties' && (
        <p className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
          {EXAMPLES.map((ex) => <button key={ex} type="button" onClick={() => setQ(ex)} className="rounded-full border border-white/25 px-3 py-1 hover:bg-white/10">{ex}</button>)}
        </p>
      )}
    </div>
  );
}
