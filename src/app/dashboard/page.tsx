import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { currentProfile } from '@/lib/queries';
import { isPremium } from '@/lib/types';
import { formatNaira } from '@/lib/format';
import { DeleteButton } from '@/components/DashboardBits';
import PricingActions from '@/components/PricingActions';
import { PremiumBadge, VerifiedAgent, VerifiedProperty } from '@/components/Badges';

export const metadata = { title: 'My Nestora', robots: { index: false } };
const STATUS: Record<string, string> = { pending_review: 'Under review', published: 'Live', rejected: 'Needs changes', draft: 'Draft', expired: 'Expired', sold: 'Closed' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ submitted?: string; payment?: string }> }) {
  const sp = await searchParams;
  const me = (await currentProfile())!;
  const supabase = await createClient();
  const uid = me.user.id;
  const [props, cars, stats, notes, bookings, savedCount] = await Promise.all([
    supabase.from('properties').select('id,slug,title,status,verified,premium_until,price,views,rejection_reason').eq('owner_id', uid).order('created_at', { ascending: false }),
    supabase.from('vehicles').select('id,slug,title,status,verified,premium_until,price,views,rejection_reason').eq('owner_id', uid).order('created_at', { ascending: false }),
    supabase.from('owner_listing_stats').select('*').eq('owner_id', uid),
    supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(8),
    supabase.from('bookings').select('id,check_in,check_out,status,total,properties(title)').order('created_at', { ascending: false }).limit(6),
    supabase.from('saved_listings').select('listing_id', { count: 'exact', head: true }).eq('user_id', uid),
  ]);
  const s = stats.data ?? [];
  const sum = (k: 'views' | 'clicks' | 'inquiries') => s.reduce((a, r) => a + Number(r[k] ?? 0), 0);
  const views = sum('views'), inquiries = sum('inquiries');
  const mine = [...(props.data ?? []).map((x) => ({ ...x, kind: 'property' as const })), ...(cars.data ?? []).map((x) => ({ ...x, kind: 'vehicle' as const }))];
  const isLister = ['agent', 'landlord', 'agency', 'admin'].includes(me.profile.role) || mine.length > 0;

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="font-display text-3xl font-bold">Hello, {me.profile.full_name?.split(' ')[0] ?? 'there'}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">{me.profile.agent_verified && <VerifiedAgent />}<span className="capitalize">{me.profile.plan.replace('_', ' ')} plan</span></p></div>
        <div className="flex gap-2"><Link href="/list" className="btn-gold">List something</Link>{me.profile.role === 'admin' && <Link href="/admin" className="btn-outline">Admin</Link>}</div>
      </div>
      {sp.submitted && <p role="status" className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">Your {sp.submitted} is under review. We will notify you when it is live.</p>}
      {sp.payment && <p role="status" className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">Payment received. Your boost or plan updates in a few seconds.</p>}

      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['My listings', mine.length], ['Saved', savedCount.count ?? 0], ['Listing views', views], ['Enquiries', inquiries]].map(([k, v]) => (
          <div key={k as string} className="card p-5"><dt className="text-sm text-neutral-500">{k}</dt><dd className="mt-1 text-3xl font-bold text-navy-900">{v}</dd></div>
        ))}
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="font-display text-xl font-semibold">My listings</h2>
          {mine.length === 0 ? <p className="mt-4 rounded-xl border border-dashed p-8 text-center text-neutral-500">You have not listed anything yet.</p> : (
            <ul className="mt-4 grid gap-3">
              {mine.map((l) => {
                const st = s.find((r) => r.listing_id === l.id);
                return (
                  <li key={l.id} className="card flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/${l.kind === 'property' ? 'properties' : 'vehicles'}/${l.slug}`} className="line-clamp-1 font-semibold hover:underline">{l.title}</Link>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500"><span>{formatNaira(Number(l.price))}</span><span className="rounded bg-neutral-100 px-2 py-0.5">{STATUS[l.status] ?? l.status}</span>{l.verified && <VerifiedProperty />}{isPremium(l) && <PremiumBadge />}{st && <span>{st.views} views · {st.inquiries} enquiries</span>}</p>
                      {l.status === 'rejected' && l.rejection_reason && <p className="mt-1 text-xs text-red-600">{l.rejection_reason}</p>}
                    </div>
                    {l.status === 'published' && !isPremium(l) && <div className="w-36"><PricingActions purpose="boost_listing" kind={l.kind} listingId={l.id} label="Boost ₦5,000" /></div>}
                    <DeleteButton kind={l.kind} id={l.id} />
                  </li>
                );
              })}
            </ul>
          )}
          {isLister && <p className="mt-4 text-sm"><Link href="/dashboard/crm" className="font-semibold underline">Open lead manager</Link></p>}
          {(bookings.data?.length ?? 0) > 0 && (
            <div className="mt-10"><h2 className="font-display text-xl font-semibold">Shortlet bookings</h2>
              <ul className="mt-4 grid gap-2 text-sm">{bookings.data!.map((b) => <li key={b.id} className="card flex justify-between p-3"><span>{(b.properties as unknown as { title: string } | null)?.title}: {b.check_in} to {b.check_out}</span><span className="capitalize">{b.status}</span></li>)}</ul></div>
          )}
        </section>
        <aside className="space-y-6">
          <section className="card p-5"><h2 className="font-display text-lg font-semibold">Notifications</h2>
            {(notes.data?.length ?? 0) === 0 ? <p className="mt-3 text-sm text-neutral-500">You are all caught up.</p> : (
              <ul className="mt-3 grid gap-3 text-sm">{notes.data!.map((n) => <li key={n.id}><Link href={n.link ?? '#'} className="block hover:underline"><span className="font-semibold">{n.title}</span>{n.body && <span className="block text-neutral-500">{n.body}</span>}</Link></li>)}</ul>)}
          </section>
          {!me.profile.agent_verified && ['agent', 'agency', 'landlord'].includes(me.profile.role) && (
            <section className="card p-5"><h2 className="font-display text-lg font-semibold">Get verified</h2><p className="mt-2 text-sm text-neutral-600">Verified agents get the gold badge and rank higher in trust.</p><Link href="/verify" className="btn-primary mt-4 w-full">Start verification</Link></section>
          )}
        </aside>
      </div>
    </div>
  );
}
