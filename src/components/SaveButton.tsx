'use client';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';
import { toggleSave } from '@/app/actions';

export default function SaveButton({ kind, id, saved }: { kind: 'property' | 'vehicle'; id: string; saved: boolean }) {
  const router = useRouter();
  const [isSaved, setOptimistic] = useOptimistic(saved, (_: boolean, next: boolean) => next);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
      aria-pressed={isSaved}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        start(async () => {
          setOptimistic(!isSaved);
          const r = await toggleSave(kind, id);
          if (r.needsAuth) router.push('/login?next=' + encodeURIComponent(window.location.pathname));
          else router.refresh();
        });
      }}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow transition-colors ${isSaved ? 'text-red-500' : 'text-neutral-700 hover:text-red-500'}`}
    >
      <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  );
}
