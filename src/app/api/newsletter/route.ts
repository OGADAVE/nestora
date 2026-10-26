import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const fd = await req.formData();
  const email = z.string().email().safeParse(fd.get('email'));
  if (email.success) await createAdmin().from('newsletter_subscribers').upsert({ email: email.data.toLowerCase() }, { onConflict: 'email' });
  return NextResponse.redirect(new URL('/?subscribed=1', req.url), 303);
}
