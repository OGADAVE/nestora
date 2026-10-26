'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-neutral-100 text-neutral-400">No photos yet</div>;
  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100">
        <Image src={images[i]} alt={`${title}, photo ${i + 1} of ${images.length}`} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, n) => (
            <li key={src}>
              <button onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`} aria-current={n === i} className={`relative block h-16 w-24 overflow-hidden rounded-lg ring-2 ${n === i ? 'ring-gold-500' : 'ring-transparent'}`}>
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
