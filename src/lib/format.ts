export function formatNaira(n: number) {
  if (n >= 1_000_000_000) return `₦${trim(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `₦${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `₦${trim(n / 1_000)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
}
const trim = (x: number) => String(Math.round(x * 100) / 100);

export function priceLabel(price: number, period?: string | null) {
  return period ? `${formatNaira(price)} / ${period}` : formatNaira(price);
}

export function slugify(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 70);
}
export function uniqueSlug(title: string) {
  return `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
}
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
