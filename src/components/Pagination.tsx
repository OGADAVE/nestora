import Link from 'next/link';
import { PAGE_SIZE } from '@/lib/queries';

export default function Pagination({ base, params, page, total }: { base: string; params: Record<string, string | undefined>; page: number; total: number }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const href = (p: number) => { const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]); sp.set('page', String(p)); return `${base}?${sp}`; };
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
      {page > 1 && <Link className="btn-outline" href={href(page - 1)}>Previous</Link>}
      <span className="text-neutral-500">Page {page} of {pages}</span>
      {page < pages && <Link className="btn-outline" href={href(page + 1)}>Next</Link>}
    </nav>
  );
}
