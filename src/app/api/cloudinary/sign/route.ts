import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Returns a signed upload payload so the browser uploads straight to Cloudinary without exposing the secret.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to upload media.' }, { status: 401 });

  const { folder = 'listings' } = await req.json().catch(() => ({}));
  const safeFolder = ['listings', 'vehicles', 'verification', 'chat', 'avatars'].includes(folder) ? folder : 'listings';
  const secret = process.env.CLOUDINARY_API_SECRET, apiKey = process.env.CLOUDINARY_API_KEY, cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!secret || !apiKey || !cloud) return NextResponse.json({ error: 'Media uploads are not configured.' }, { status: 500 });

  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = `nestora/${safeFolder}/${user.id}`;
  const toSign = `folder=${folderPath}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(toSign + secret).digest('hex');
  return NextResponse.json({ cloud, apiKey, timestamp, signature, folder: folderPath });
}
