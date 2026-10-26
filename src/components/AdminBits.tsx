'use client';
import { useTransition } from 'react';
import { adminResolveReport, adminReviewVerification, adminSetListing, adminSetUser } from '@/app/actions';

export function ListingActions({ kind, id, status, verified, featured }: { kind: 'property' | 'vehicle'; id: string; status: string; verified: boolean; featured: boolean }) {
  const [pending, start] = useTransition();
  const run = (f: () => Promise<void>) => start(async () => { await f(); });
  const b = 'rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50';
  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== 'published' && <button disabled={pending} className={`${b} border-green-600 text-green-700`} onClick={() => run(() => adminSetListing(kind, id, { status: 'published' }))}>Approve</button>}
      {status !== 'rejected' && <button disabled={pending} className={`${b} border-red-500 text-red-600`} onClick={() => { const reason = prompt('Reason for rejection (shown to the lister)') ?? ''; if (reason) run(() => adminSetListing(kind, id, { status: 'rejected', reason })); }}>Reject</button>}
      <button disabled={pending} className={b} onClick={() => run(() => adminSetListing(kind, id, { verified: !verified }))}>{verified ? 'Remove badge' : 'Verify'}</button>
      <button disabled={pending} className={b} onClick={() => run(() => adminSetListing(kind, id, { featureDays: featured ? 0 : 30 }))}>{featured ? 'Unfeature' : 'Feature 30d'}</button>
    </div>
  );
}
export function VerificationActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1.5">
      <button disabled={pending} className="rounded-md border border-green-600 px-2.5 py-1 text-xs font-medium text-green-700" onClick={() => start(() => adminReviewVerification(id, true))}>Approve</button>
      <button disabled={pending} className="rounded-md border border-red-500 px-2.5 py-1 text-xs font-medium text-red-600" onClick={() => { const n = prompt('Reason (sent to the user)') ?? ''; if (n) start(() => adminReviewVerification(id, false, n)); }}>Reject</button>
    </div>
  );
}
export function ReportActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1.5">
      <button disabled={pending} className="rounded-md border px-2.5 py-1 text-xs font-medium" onClick={() => start(() => adminResolveReport(id, 'resolved'))}>Resolve</button>
      <button disabled={pending} className="rounded-md border px-2.5 py-1 text-xs font-medium" onClick={() => start(() => adminResolveReport(id, 'dismissed'))}>Dismiss</button>
    </div>
  );
}
export function UserActions({ id, suspended, verified }: { id: string; suspended: boolean; verified: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1.5">
      <button disabled={pending} className="rounded-md border px-2.5 py-1 text-xs font-medium" onClick={() => start(() => adminSetUser(id, { agent_verified: !verified }))}>{verified ? 'Unverify' : 'Verify'}</button>
      <button disabled={pending} className="rounded-md border border-red-500 px-2.5 py-1 text-xs font-medium text-red-600" onClick={() => start(() => adminSetUser(id, { suspended: !suspended }))}>{suspended ? 'Reinstate' : 'Suspend'}</button>
    </div>
  );
}
