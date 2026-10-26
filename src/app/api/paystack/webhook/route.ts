import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/supabase/server';

const BOOST_DAYS = 30;

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-paystack-signature') ?? '';
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY ?? '').update(raw).digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  const event = JSON.parse(raw);
  if (event.event !== 'charge.success') return NextResponse.json({ ok: true });
  const reference: string = event.data.reference;
  const admin = createAdmin();

  const { data: payment } = await admin.from('payments').select('*').eq('reference', reference).maybeSingle();
  if (!payment || payment.status === 'success') return NextResponse.json({ ok: true });
  // Never trust the webhook body alone: the paid amount must match what we charged.
  if (Number(event.data.amount) !== Number(payment.amount_kobo)) {
    await admin.from('payments').update({ status: 'failed' }).eq('reference', reference);
    return NextResponse.json({ error: 'amount mismatch' }, { status: 400 });
  }
  await admin.from('payments').update({ status: 'success', paid_at: new Date().toISOString() }).eq('reference', reference);

  const until = (days: number) => new Date(Date.now() + days * 864e5).toISOString();
  if (payment.purpose === 'boost_listing' && payment.listing_id) {
    const table = payment.kind === 'property' ? 'properties' : 'vehicles';
    await admin.from(table).update({ premium_until: until(BOOST_DAYS) }).eq('id', payment.listing_id);
  } else if (payment.purpose === 'premium_agent' || payment.purpose === 'agency') {
    await admin.from('profiles').update({ plan: payment.purpose }).eq('id', payment.user_id);
  }
  await admin.from('notifications').insert({ user_id: payment.user_id, type: 'payment', title: 'Payment received', body: 'Your Nestora payment was successful.', link: '/dashboard' });
  return NextResponse.json({ ok: true });
}
