'use client';
import { useActionState, useState } from 'react';
import { bookShortlet, type ActionResult } from '@/app/actions';
import { formatNaira } from '@/lib/format';

export default function BookingForm({ propertyId, nightly, booked }: { propertyId: string; nightly: number; booked: { check_in: string; check_out: string }[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(bookShortlet, null);
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const nights = a && b ? Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 864e5)) : 0;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="font-display text-lg font-semibold">Book this shortlet</h2>
      <input type="hidden" name="property_id" value={propertyId} />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="ci">Check-in</label><input id="ci" name="check_in" type="date" min={today} value={a} onChange={(e) => setA(e.target.value)} className="field" required /></div>
        <div><label className="label" htmlFor="co">Check-out</label><input id="co" name="check_out" type="date" min={a || today} value={b} onChange={(e) => setB(e.target.value)} className="field" required /></div>
      </div>
      <div><label className="label" htmlFor="g">Guests</label><input id="g" name="guests" type="number" min={1} max={30} defaultValue={1} className="field" /></div>
      {nights > 0 && <p className="text-sm">{nights} night{nights > 1 && 's'} · <strong>{formatNaira(nights * nightly)}</strong></p>}
      {booked.length > 0 && <p className="text-xs text-neutral-500">Already booked: {booked.map((x) => `${x.check_in} to ${x.check_out}`).join('; ')}</p>}
      <button disabled={pending} className="btn-primary">{pending ? 'Requesting...' : 'Request booking'}</button>
      {state && <p role="status" className={state.ok ? 'text-sm text-green-700' : 'text-sm text-red-600'}>{state.ok ? state.message : state.error}</p>}
    </form>
  );
}
