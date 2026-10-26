import Link from 'next/link';
import { Bell, Heart, MessageCircle, Plus } from 'lucide-react';
import { currentProfile } from '@/lib/queries';
import { signOut } from '@/app/actions';
import MobileNav from './MobileNav';

export const NAV = [
  { href: '/properties?mode=Buy', label: 'Buy' }, { href: '/properties?mode=Rent', label: 'Rent' },
  { href: '/properties?mode=Shortlet', label: 'Shortlets' }, { href: '/properties?type=Land', label: 'Land' },
  { href: '/invest', label: 'Invest' }, { href: '/vehicles', label: 'Vehicles' },
];

export default async function Header() {
  const me = await currentProfile();
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-[0.14em] text-navy-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-gold-400">N</span>NESTORA
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-6 text-sm text-neutral-600 lg:flex">
          {NAV.map((n) => <Link key={n.label} href={n.href} className="hover:text-navy-900">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {me ? (
            <>
              <Link href="/saved" aria-label="Saved listings" className="hidden h-9 w-9 place-items-center rounded-full border border-neutral-200 sm:grid"><Heart size={17} /></Link>
              <Link href="/messages" aria-label="Messages" className="hidden h-9 w-9 place-items-center rounded-full border border-neutral-200 sm:grid"><MessageCircle size={17} /></Link>
              <Link href="/dashboard" aria-label="Notifications and dashboard" className="hidden h-9 w-9 place-items-center rounded-full border border-neutral-200 sm:grid"><Bell size={17} /></Link>
              <Link href="/list" className="btn-gold hidden sm:inline-flex"><Plus size={16} />List</Link>
              <Link href="/dashboard" className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-sm font-semibold text-white" aria-label="My Nestora">
                {(me.profile.full_name ?? me.user.email ?? 'N').charAt(0).toUpperCase()}
              </Link>
              <form action={signOut} className="hidden sm:block"><button className="text-sm text-neutral-500 hover:text-navy-900">Sign out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-neutral-700 hover:text-navy-900">Sign in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
          <MobileNav signedIn={!!me} isAdmin={me?.profile.role === 'admin'} />
        </div>
      </div>
    </header>
  );
}
