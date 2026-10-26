'use client';
import { Flag } from 'lucide-react';
import { useActionState } from 'react';
import { reportListing, type ActionResult } from '@/app/actions';

export default function ReportForm({ kind, id }: { kind: 'property' | 'vehicle'; id: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(reportListing, null);
  return (
    <details className="text-sm">
      <summary className="flex cursor-pointer items-center gap-1 text-neutral-500 hover:text-red-600"><Flag size={14} />Report this listing</summary>
      <form action={action} className="mt-3 grid gap-2">
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="listing_id" value={id} />
        <label className="label" htmlFor="reason">Reason</label>
        <select id="reason" name="reason" className="field" required defaultValue=""><option value="" disabled>Choose a reason</option><option value="scam">Scam</option><option value="fake_listing">Fake listing</option><option value="duplicate">Duplicate</option><option value="abuse">Abusive content</option><option value="other">Other</option></select>
        <textarea name="details" maxLength={1000} rows={3} className="field" placeholder="What should we look at?" aria-label="Details" />
        <button disabled={pending} className="btn-outline">{pending ? 'Sending...' : 'Send report'}</button>
        {state && <p role="status" className={state.ok ? 'text-green-700' : 'text-red-600'}>{state.ok ? state.message : state.error}</p>}
      </form>
    </details>
  );
}
