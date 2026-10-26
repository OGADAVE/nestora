'use client';
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[50vh] place-items-center py-16 text-center">
      <div><h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-neutral-600">Try again. If it keeps happening, check your connection.</p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button></div>
    </div>
  );
}
