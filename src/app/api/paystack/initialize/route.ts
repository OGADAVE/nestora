import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdmin } from '@/lib/supabase/server';

// Prices live on the server so clients can't tamper with them (amounts in kobo).
const PRICES = { boost_listing: 5_000_00, premium_agent: 15_000_00, agency: 50_000_00 } as const;
const schema = z.object({
  purpose: z.enum(['boost_listing', 'premium_agent', 'agency']),
  kind: z.enum(['property', 'vehicle']).optional(),
  listingId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { purpose, kind, listingId } = parsed.data;

  if (purpose === 'boost_listing') {
    if (!kind || !listingId) return NextResponse.json({ error: 'Choose a listing to boost.' }, { status: 400 });
    const table = kind === 'property' ? 'properties' : 'vehicles';
    const { data } = await supabase.from(table).select('id').eq('id', listingId).eq('owner_id', user.id).maybeSingle();
    if (!data) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }
  const reference = `nst_${randomUUID()}`;
  const amount = PRICES[purpose];
  const admin = createAdmin();
  await admin.from('payments').insert({ user_id: user.id, reference, purpose, kind: kind ?? null, listing_id: listingId ?? null, amount_kobo: amount });

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, amount, reference, currency: 'NGN', callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=${reference}` }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) return NextResponse.json({ error: 'Could not start payment.' }, { status: 502 });
  return NextResponse.json({ url: json.data.authorization_url, reference });
}
