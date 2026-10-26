import { BadgeCheck, Crown, ShieldCheck } from 'lucide-react';

const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold';
export function VerifiedProperty({ label = 'Verified' }: { label?: string }) {
  return <span title="This listing has been verified by Nestora." className={`${base} bg-blue-600 text-white`}><ShieldCheck size={12} />{label}</span>;
}
export function VerifiedAgent() {
  return <span title="This agent has been verified by Nestora." className={`${base} bg-gold-500 text-navy-950`}><BadgeCheck size={12} />Verified agent</span>;
}
export function PremiumBadge() {
  return <span title="This listing is currently promoted." className={`${base} bg-navy-900 text-gold-300 ring-1 ring-gold-500`}><Crown size={12} />Premium</span>;
}
