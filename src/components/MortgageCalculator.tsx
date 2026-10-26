'use client';
import { useMemo, useState } from 'react';
import { mortgage } from '@/lib/finance';

const fmt = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG');

export default function MortgageCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(18);
  const [years, setYears] = useState(15);
  const principal = price * (1 - down / 100);
  const r = useMemo(() => mortgage(principal, rate, years), [principal, rate, years]);
  return (
    <section aria-labelledby="mc" className="card p-5">
      <h2 id="mc" className="font-display text-lg font-semibold">Mortgage calculator</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div><label className="label" htmlFor="down">Down payment (%)</label><input id="down" type="number" min={0} max={90} value={down} onChange={(e) => setDown(Math.min(90, Math.max(0, +e.target.value)))} className="field" /></div>
        <div><label className="label" htmlFor="rate">Interest rate (% / year)</label><input id="rate" type="number" min={0} max={60} step="0.1" value={rate} onChange={(e) => setRate(Math.max(0, +e.target.value))} className="field" /></div>
        <div><label className="label" htmlFor="yrs">Duration (years)</label><input id="yrs" type="number" min={1} max={30} value={years} onChange={(e) => setYears(Math.min(30, Math.max(1, +e.target.value)))} className="field" /></div>
      </div>
      <dl className="mt-5 grid gap-3 rounded-xl bg-navy-900 p-4 text-white sm:grid-cols-3" aria-live="polite">
        <div><dt className="text-xs text-neutral-300">Monthly payment</dt><dd className="text-xl font-bold text-gold-300">{fmt(r.monthly)}</dd></div>
        <div><dt className="text-xs text-neutral-300">Total interest</dt><dd className="text-lg font-semibold">{fmt(r.interest)}</dd></div>
        <div><dt className="text-xs text-neutral-300">Amount financed</dt><dd className="text-lg font-semibold">{fmt(principal)}</dd></div>
      </dl>
      <p className="mt-2 text-xs text-neutral-500">Estimate only. Your lender&apos;s rate and fees will differ.</p>
    </section>
  );
}
