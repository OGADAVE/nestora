import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Messages', robots: { index: false } };
export default async function Messages() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: convs } = await supabase.from('conversations').select('id, kind, listing_id, buyer_id, seller_id, last_message_at').order('last_message_at', { ascending: false });
  const ids = [...new Set((convs ?? []).flatMap((c) => [c.buyer_id, c.seller_id]).filter((x) => x !== user!.id))];
  const { data: people } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] };
  const name = (id: string) => people?.find((p) => p.id === id)?.full_name ?? 'Nestora user';
  return (
    <div className="container-x max-w-2xl py-10">
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      {(convs?.length ?? 0) === 0 ? <p className="mt-8 rounded-xl border border-dashed p-10 text-center text-neutral-500">Message a lister from any listing page to start a conversation.</p> : (
        <ul className="mt-6 grid gap-2">{convs!.map((c) => (
          <li key={c.id}><Link href={`/messages/${c.id}`} className="card flex items-center justify-between p-4 hover:border-gold-500"><span className="font-semibold">{name(c.buyer_id === user!.id ? c.seller_id : c.buyer_id)}</span><span className="text-xs text-neutral-500">{new Date(c.last_message_at ?? Date.now()).toLocaleDateString('en-NG')}</span></Link></li>
        ))}</ul>
      )}
    </div>
  );
}
