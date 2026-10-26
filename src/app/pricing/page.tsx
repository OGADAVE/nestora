import PricingActions from '@/components/PricingActions';
export const metadata = { title: 'Pricing for agents and agencies', description: 'Free, Premium Agent and Agency plans, plus listing boosts.' };
const PLANS = [
  { id: null, name: 'Free', price: '₦0', items: ['Limited uploads', 'Basic listing page', 'Chat with seekers'] },
  { id: 'premium_agent', name: 'Premium Agent', price: '₦15,000 / month', items: ['Unlimited listings', 'Verified badge after ID check', 'Advanced analytics'] },
  { id: 'agency', name: 'Agency', price: '₦50,000 / month', items: ['Team management', 'Multiple agent accounts', 'CRM access', 'Premium exposure'] },
] as const;
export default function Pricing() {
  return (
    <div className="container-x py-12">
      <h1 className="font-display text-3xl font-bold">Plans for every lister</h1>
      <p className="mt-2 max-w-xl text-neutral-600">Boost a single listing for 30 days from your dashboard for ₦5,000.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name} className="card flex flex-col p-6">
            <h2 className="font-display text-xl font-semibold">{p.name}</h2><p className="mt-1 text-2xl font-bold text-navy-900">{p.price}</p>
            <ul className="mt-4 grid flex-1 gap-2 text-sm text-neutral-700">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
            {p.id ? <PricingActions purpose={p.id} /> : <span className="mt-6 text-sm text-neutral-500">Included with every account</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
