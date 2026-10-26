import type { MetadataRoute } from 'next';
import { createAdmin } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/format';

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const admin = createAdmin();
  const [p, v] = await Promise.all([
    admin.from('properties').select('slug, updated_at').eq('status', 'published').limit(5000),
    admin.from('vehicles').select('slug, updated_at').eq('status', 'published').limit(5000),
  ]);
  return [
    ...['', '/properties', '/vehicles', '/invest', '/pricing', '/about', '/safety'].map((path) => ({ url: `${base}${path}`, changeFrequency: 'daily' as const })),
    ...(p.data ?? []).map((x) => ({ url: `${base}/properties/${x.slug}`, lastModified: x.updated_at })),
    ...(v.data ?? []).map((x) => ({ url: `${base}/vehicles/${x.slug}`, lastModified: x.updated_at })),
  ];
}
