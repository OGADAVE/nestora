'use client';
import { useTransition } from 'react';
import { deleteListing, updateLeadStage } from '@/app/actions';

export function DeleteButton({ kind, id }: { kind: 'property' | 'vehicle'; id: string }) {
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => confirm('Delete this listing permanently?') && start(() => deleteListing(kind, id))} className="text-sm text-red-600 hover:underline">{pending ? 'Deleting...' : 'Delete'}</button>;
}
export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const [pending, start] = useTransition();
  return (
    <select aria-label="Lead stage" defaultValue={stage} disabled={pending} onChange={(e) => start(() => updateLeadStage(id, e.target.value))} className="field w-auto py-1.5">
      {['new', 'contacted', 'viewing', 'negotiating', 'won', 'lost'].map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
