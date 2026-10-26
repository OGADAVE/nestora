import Link from 'next/link';

const cols: [string, [string, string][]][] = [
  ['Marketplace', [['Properties', '/properties'], ['Vehicles', '/vehicles'], ['Shortlets', '/properties?mode=Shortlet'], ['Invest', '/invest']]],
  ['For listers', [['List a property', '/list'], ['List a vehicle', '/list?kind=vehicle'], ['Get verified', '/verify'], ['Pricing', '/pricing']]],
  ['Company', [['About', '/about'], ['Safety tips', '/safety'], ['Privacy', '/privacy'], ['Terms', '/terms']]],
];
export default function Footer() {
  return (
    <footer className="mt-24 bg-navy-950 text-neutral-300">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-lg font-bold tracking-[0.14em] text-white">NESTORA</p>
          <p className="mt-1 text-sm text-gold-400">Buy. Rent. Invest.</p>
          <p className="mt-4 max-w-xs text-sm text-neutral-400">Verified property and vehicle listings across Nigeria.</p>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="text-sm font-semibold text-white">{title}</p>
            <ul className="mt-3 grid gap-2 text-sm">{links.map(([l, h]) => <li key={l}><Link href={h} className="text-neutral-400 hover:text-white">{l}</Link></li>)}</ul>
          </nav>
        ))}
        <form className="grid content-start gap-2" action="/api/newsletter" method="post">
          <label htmlFor="nl" className="text-sm font-semibold text-white">Weekly new listings</label>
          <div className="flex gap-2">
            <input id="nl" name="email" type="email" required placeholder="you@email.com" className="min-w-0 flex-1 rounded-lg bg-navy-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-gold-400" />
            <button className="btn-gold">Join</button>
          </div>
        </form>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-neutral-500">© {new Date().getFullYear()} Nestora. All rights reserved.</div>
    </footer>
  );
}
