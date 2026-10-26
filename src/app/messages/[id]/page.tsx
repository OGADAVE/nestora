import { notFound } from 'next/navigation';
import ChatThread from '@/components/ChatThread';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Conversation', robots: { index: false } };
export default async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: conv } = await supabase.from('conversations').select('id, buyer_id, seller_id').eq('id', id).maybeSingle();
  if (!conv) notFound();
  const otherId = conv.buyer_id === user!.id ? conv.seller_id : conv.buyer_id;
  const [{ data: other }, { data: msgs }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', otherId).single(),
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').limit(300),
  ]);
  return <div className="container-x max-w-2xl py-8"><ChatThread conversationId={id} me={user!.id} otherName={other?.full_name ?? 'Nestora user'} initial={msgs ?? []} /></div>;
}
