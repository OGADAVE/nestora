'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const LINKS = [
  ['/properties?mode=Buy', 'Buy'], ['/properties?mode=Rent', 'Rent'], ['/properties?mode=Shortlet', 'Shortlets'],
  ['/properties?type=Land', 'Land'], ['/invest', 'Invest'], ['/vehicles', 'Vehicles'],
];
export default function MobileNav({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const items = signedIn
    ? [...LINKS, ['/list', 'List a property or vehicle'], ['/saved', 'Saved'], ['/messages', 'Messages'], ['/dashboard', 'Dashboard'], ...(isAdmin ? [['/admin', 'Admin']] : [])]
    : LINKS;
  return (
    <div className="lg:hidden">
      <button aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200">
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <nav aria-label="Mobile" className="absolute inset-x-0 top-16 border-b border-neutral-200 bg-white p-4 shadow-lg">
          <ul className="grid gap-1">
            {items.map(([href, label]) => (
              <li key={href}><Link href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-neutral-100">{label}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
