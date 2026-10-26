import { createClient } from '@/lib/supabase/server';
import { StageSelect } from '@/components/DashboardBits';

export const metadata = { title: 'Lead manager', robots: { index: false } };
export default async function Crm() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: leads } = await supabase.from('leads').select('*').eq('agent_id', user!.id).order('created_at', { ascending: false }).limit(200);
  const counts = ['new', 'contacted', 'viewing', 'negotiating', 'won', 'lost'].map((s) => [s, (leads ?? []).filter((l) => l.stage === s).length] as const);
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold">Lead manager</h1>
      <dl className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">{counts.map(([s, n]) => <div key={s} className="card p-3"><dt className="text-xs capitalize text-neutral-500">{s}</dt><dd className="text-2xl font-bold">{n}</dd></div>)}</dl>
      {(leads?.length ?? 0) === 0 ? <p className="mt-8 rounded-xl border border-dashed p-10 text-center text-neutral-500">New enquiries from seekers will appear here.</p> : (
        <div className="card mt-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-neutral-50 text-xs text-neutral-500"><tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Received</th><th className="p-3">Stage</th></tr></thead>
          <tbody>{leads!.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="p-3 font-medium">{l.name ?? 'Nestora user'}</td><td className="p-3 text-neutral-600">{l.phone ?? l.email ?? 'Via chat'}</td><td className="p-3 text-neutral-600">{new Date(l.created_at).toLocaleDateString('en-NG')}</td><td className="p-3"><StageSelect id={l.id} stage={l.stage} /></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
