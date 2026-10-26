'use client';
import { useMemo, useState } from 'react';
import { roi } from '@/lib/finance';

const fmt = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');
export default function RoiCalculator() {
  const [v, setV] = useState({ price: 80_000_000, rent: 6_000_000, costs: 600_000, growth: 10, years: 5 });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Math.max(0, +e.target.value) });
  const r = useMemo(() => roi({ price: v.price, annualRent: v.rent, annualCosts: v.costs, appreciationPct: v.growth, years: v.years }), [v]);
  const Field = ({ k, label }: { k: keyof typeof v; label: string }) => <div><label className="label" htmlFor={k}>{label}</label><input id={k} type="number" min={0} value={v[k]} onChange={set(k)} className="field" /></div>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <Field k="price" label="Purchase price (₦)" /><Field k="rent" label="Expected rent per year (₦)" /><Field k="costs" label="Yearly costs (₦)" />
        <Field k="growth" label="Yearly appreciation (%)" /><Field k="years" label="Holding period (years)" />
      </div>
      <dl className="grid content-start gap-3 rounded-2xl bg-navy-900 p-5 text-white sm:grid-cols-2" aria-live="polite">
        <div><dt className="text-xs text-neutral-300">Gross yield</dt><dd className="text-2xl font-bold text-gold-300">{r.grossYield.toFixed(1)}%</dd></div>
        <div><dt className="text-xs text-neutral-300">Net yield</dt><dd className="text-2xl font-bold text-gold-300">{r.netYield.toFixed(1)}%</dd></div>
        <div><dt className="text-xs text-neutral-300">Net income per year</dt><dd className="text-lg font-semibold">{fmt(r.netIncome)}</dd></div>
        <div><dt className="text-xs text-neutral-300">Value in {v.years} years</dt><dd className="text-lg font-semibold">{fmt(r.futureValue)}</dd></div>
        <div><dt className="text-xs text-neutral-300">Total return</dt><dd className="text-lg font-semibold">{fmt(r.totalReturn)}</dd></div>
        <div><dt className="text-xs text-neutral-300">Return on investment</dt><dd className="text-lg font-semibold">{r.roiPct.toFixed(0)}%</dd></div>
      </dl>
    </div>
  );
}
