/**
 * Deterministic natural-language search parser. Turns
 *   "3-bedroom apartment under ₦4M in Lekki with parking"
 * into structured filters. No external API needed; swap in an LLM later if wanted.
 */
export type ParsedSearch = {
  bedrooms?: number; maxPrice?: number; minPrice?: number; propertyType?: string; listingType?: string;
  location?: string; amenities: string[]; furnished?: boolean; verifiedOnly?: boolean; text: string;
};

const TYPES: Record<string, string> = {
  apartment: 'Apartment', flat: 'Apartment', duplex: 'Duplex', bungalow: 'Bungalow', 'self-contain': 'Self-Contain',
  'self contain': 'Self-Contain', 'mini flat': 'Mini Flat', penthouse: 'Penthouse', office: 'Office Space', shop: 'Shop',
  land: 'Land', plot: 'Land', hostel: 'Hostel', warehouse: 'Warehouse', 'event center': 'Event Center', mansion: 'Mansion', villa: 'Villa',
};
const AMENITIES: Record<string, string> = {
  parking: 'Parking', pool: 'Swimming Pool', 'swimming pool': 'Swimming Pool', gym: 'Gym', security: 'Security', wifi: 'WiFi',
  elevator: 'Elevator', lift: 'Elevator', solar: 'Solar Power', balcony: 'Balcony', generator: 'Generator', borehole: 'Running Water',
};

function parseMoney(raw: string) {
  const m = raw.replace(/[₦,\s]/g, '').toLowerCase().match(/^(\d+(?:\.\d+)?)(k|m|b|million|billion|thousand)?$/);
  if (!m) return undefined;
  const mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 }[m[2] as string] ?? 1;
  return Number(m[1]) * mult;
}

export function parseSearch(input: string): ParsedSearch {
  const q = input.trim().toLowerCase();
  const out: ParsedSearch = { amenities: [], text: input.trim() };
  const money = '₦?\\s?[\\d.,]+\\s?(?:k|m|b|million|billion|thousand)?';

  const bed = q.match(/(\d+)\s*[- ]?\s*(?:bed(?:room)?s?|br)\b/);
  if (bed) out.bedrooms = Number(bed[1]);

  const under = q.match(new RegExp(`(?:under|below|less than|max(?:imum)?|up to|budget(?: of)?)\\s*(${money})`));
  if (under) out.maxPrice = parseMoney(under[1]);
  const over = q.match(new RegExp(`(?:above|over|more than|min(?:imum)?|from)\\s*(${money})`));
  if (over) out.minPrice = parseMoney(over[1]);
  const between = q.match(new RegExp(`between\\s*(${money})\\s*(?:and|-|to)\\s*(${money})`));
  if (between) { out.minPrice = parseMoney(between[1]); out.maxPrice = parseMoney(between[2]); }

  for (const key of Object.keys(TYPES).sort((a, b) => b.length - a.length)) {
    if (new RegExp(`\\b${key}s?\\b`).test(q)) { out.propertyType = TYPES[key]; break; }
  }
  if (/\b(for rent|to rent|rent|rental|lease)\b/.test(q)) out.listingType = /\blease\b/.test(q) ? 'Lease' : 'Rent';
  if (/\b(for sale|to buy|buy|purchase)\b/.test(q)) out.listingType = 'Sale';
  if (/\b(shortlet|short let|airbnb|per night)\b/.test(q)) out.listingType = 'Shortlet';
  for (const [k, v] of Object.entries(AMENITIES)) if (new RegExp(`\\b${k}\\b`).test(q) && !out.amenities.includes(v)) out.amenities.push(v);
  if (/\bunfurnished\b/.test(q)) out.furnished = false; else if (/\bfurnished\b/.test(q)) out.furnished = true;
  if (/\bverified\b/.test(q)) out.verifiedOnly = true;

  const loc = q.match(/\b(?:in|at|around|near)\s+([a-z][a-z0-9\s'-]{2,40}?)(?=\s+(?:with|under|below|above|over|for|that|and|budget|between|from|max|up)\b|[,.]|$)/);
  if (loc) out.location = loc[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return out;
}

export function toSearchParams(p: ParsedSearch): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.location) sp.set('q', p.location);
  if (p.bedrooms) sp.set('beds', String(p.bedrooms));
  if (p.maxPrice) sp.set('max', String(p.maxPrice));
  if (p.minPrice) sp.set('min', String(p.minPrice));
  if (p.propertyType) sp.set('type', p.propertyType);
  if (p.listingType) sp.set('mode', p.listingType);
  if (p.amenities.length) sp.set('amenities', p.amenities.join(','));
  if (p.furnished !== undefined) sp.set('furnished', String(p.furnished));
  if (p.verifiedOnly) sp.set('verified', '1');
  return sp;
}
