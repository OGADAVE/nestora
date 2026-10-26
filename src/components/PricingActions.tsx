'use client';
import { useState } from 'react';

export default function PricingActions({ purpose, kind, listingId, label }: { purpose: 'premium_agent' | 'agency' | 'boost_listing'; kind?: 'property' | 'vehicle'; listingId?: string; label?: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function pay() {
    setBusy(true); setErr('');
    const res = await fetch('/api/paystack/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose, kind, listingId }) });
    const j = await res.json();
    if (res.status === 401) { window.location.href = '/login?next=/pricing'; return; }
    if (!res.ok) { setErr(j.error ?? 'Payment could not start.'); setBusy(false); return; }
    window.location.href = j.url;
  }
  return <div className="mt-4"><button onClick={pay} disabled={busy} className="btn-gold w-full">{busy ? 'Redirecting...' : (label ?? 'Choose plan')}</button>{err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}</div>;
}
