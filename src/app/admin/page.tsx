import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdmin, createClient } from '@/lib/supabase/server';
import { ListingActions, ReportActions, UserActions, VerificationActions } from '@/components/AdminBits';
import { formatNaira } from '@/lib/format';
import { isPremium } from '@/lib/types';

export const metadata = { title: 'Admin', robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user!.id).single();
  if (me?.role !== 'admin') redirect('/');
  const tab = (await searchParams).tab ?? 'listings';
  const admin = createAdmin();
  const count = (t: string, f?: (q: any) => any) => { const q = admin.from(t).select('*', { count: 'exact', head: true }); return (f ? f(q) : q).then((r: { count: number | null }) => r.count ?? 0); };
  const [users, props, cars, activeP, activeV, pendingP, pendingV, openReports, pendingVer, revenue] = await Promise.all([
    count('profiles'), count('properties'), count('vehicles'), count('properties', (q) => q.eq('status', 'published')), count('vehicles', (q) => q.eq('status', 'published')),
    count('properties', (q) => q.eq('status', 'pending_review')), count('vehicles', (q) => q.eq('status', 'pending_review')),
    count('reports', (q) => q.eq('status', 'open')), count('verification_requests', (q) => q.eq('status', 'pending')),
    admin.from('payments').select('amount_kobo').eq('status', 'success'),
  ]);
  const revenueNgn = (revenue.data ?? []).reduce((a, r) => a + Number(r.amount_kobo), 0) / 100;

  const tabs = [['listings', `Listings (${pendingP + pendingV} pending)`], ['verifications', `Verifications (${pendingVer})`], ['reports', `Reports (${openReports})`], ['users', 'Users']];
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold">Admin</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[['Users', users], ['Total listings', props + cars], ['Active listings', activeP + activeV], ['Revenue', formatNaira(revenueNgn)], ['Open reports', openReports]].map(([k, v]) => <div key={k as string} className="card p-4"><dt className="text-xs text-neutral-500">{k}</dt><dd className="mt-1 text-2xl font-bold">{v}</dd></div>)}
      </dl>
      <nav aria-label="Admin sections" className="mt-8 flex flex-wrap gap-2 border-b">{tabs.map(([k, l]) => <Link key={k} href={`/admin?tab=${k}`} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? 'border-gold-500 text-navy-900' : 'border-transparent text-neutral-500'}`}>{l}</Link>)}</nav>
      <div className="mt-6">
        {tab === 'listings' && <Listings />}
        {tab === 'verifications' && <Verifications />}
        {tab === 'reports' && <Reports />}
        {tab === 'users' && <Users />}
      </div>
    </div>
  );

  async function Listings() {
    const [p, v] = await Promise.all([
      admin.from('properties').select('id,slug,title,status,verified,premium_until,price,created_at').order('created_at', { ascending: false }).limit(60),
      admin.from('vehicles').select('id,slug,title,status,verified,premium_until,price,created_at').order('created_at', { ascending: false }).limit(60),
    ]);
    const rows = [...(p.data ?? []).map((x) => ({ ...x, kind: 'property' as const })), ...(v.data ?? []).map((x) => ({ ...x, kind: 'vehicle' as const }))]
      .sort((a, b) => (a.status === 'pending_review' ? -1 : 0) - (b.status === 'pending_review' ? -1 : 0) || +new Date(b.created_at) - +new Date(a.created_at));
    return (
      <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-neutral-50 text-xs text-neutral-500"><tr><th className="p-3">Listing</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id} className="border-b last:border-0 align-top"><td className="p-3"><Link className="font-medium hover:underline" href={`/${r.kind === 'property' ? 'properties' : 'vehicles'}/${r.slug}`}>{r.title}</Link><p className="text-xs text-neutral-500">{r.kind} · {formatNaira(Number(r.price))}</p></td><td className="p-3 capitalize">{r.status.replace('_', ' ')}{r.verified && ' · verified'}</td><td className="p-3"><ListingActions kind={r.kind} id={r.id} status={r.status} verified={r.verified} featured={isPremium(r)} /></td></tr>)}</tbody></table></div>
    );
  }
  async function Verifications() {
    const { data } = await admin.from('verification_requests').select('*, profiles(full_name)').eq('status', 'pending').order('created_at');
    if (!data?.length) return <p className="rounded-xl border border-dashed p-10 text-center text-neutral-500">No pending verification requests.</p>;
    return <ul className="grid gap-3">{data.map((r) => <li key={r.id} className="card flex flex-wrap items-center gap-4 p-4"><div className="flex-1"><p className="font-semibold">{(r.profiles as { full_name: string } | null)?.full_name ?? r.user_id}</p><p className="text-xs text-neutral-500">{r.subject} verification</p>
      <p className="mt-1 flex gap-3 text-sm">{r.id_document_url && <a className="underline" target="_blank" rel="noopener noreferrer" href={r.id_document_url}>ID document</a>}{r.selfie_url && <a className="underline" target="_blank" rel="noopener noreferrer" href={r.selfie_url}>Selfie</a>}{r.agency_document_url && <a className="underline" target="_blank" rel="noopener noreferrer" href={r.agency_document_url}>Agency document</a>}</p></div><VerificationActions id={r.id} /></li>)}</ul>;
  }
  async function Reports() {
    const { data } = await admin.from('reports').select('*').in('status', ['open', 'reviewing']).order('created_at', { ascending: false });
    if (!data?.length) return <p className="rounded-xl border border-dashed p-10 text-center text-neutral-500">No open reports.</p>;
    return <ul className="grid gap-3">{data.map((r) => <li key={r.id} className="card flex flex-wrap items-center gap-4 p-4"><div className="flex-1"><p className="font-semibold capitalize">{r.reason.replace('_', ' ')}</p><p className="text-sm text-neutral-600">{r.details ?? 'No details given'}</p><p className="text-xs text-neutral-500">{r.kind} · {r.listing_id}</p></div><ReportActions id={r.id} /></li>)}</ul>;
  }
  async function Users() {
    const { data } = await admin.from('profiles').select('id,full_name,role,agent_verified,suspended,created_at').order('created_at', { ascending: false }).limit(100);
    return <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-neutral-50 text-xs text-neutral-500"><tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
      <tbody>{(data ?? []).map((u) => <tr key={u.id} className="border-b last:border-0"><td className="p-3 font-medium">{u.full_name ?? 'Unnamed'}</td><td className="p-3 capitalize">{u.role.replace('_', ' ')}</td><td className="p-3">{u.suspended ? 'Suspended' : u.agent_verified ? 'Verified' : 'Active'}</td><td className="p-3"><UserActions id={u.id} suspended={u.suspended} verified={u.agent_verified} /></td></tr>)}</tbody></table></div>;
  }
}
