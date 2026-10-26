import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/format';
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/messages', '/saved', '/list', '/verify', '/api/'] }], sitemap: `${siteUrl()}/sitemap.xml` };
}
