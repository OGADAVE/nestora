import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container-x grid min-h-[50vh] place-items-center py-16 text-center">
      <div><h1 className="font-display text-3xl font-bold">We could not find that page</h1>
        <p className="mt-2 text-neutral-600">The listing may have been removed or the link is wrong.</p>
        <Link href="/properties" className="btn-primary mt-6">Browse properties</Link></div>
    </div>
  );
}
