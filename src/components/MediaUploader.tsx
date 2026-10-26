'use client';
import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';

export type UploadedMedia = { url: string; public_id: string; media_type: 'image' | 'video' };

/** Uploads straight to Cloudinary with a server-signed request. Emits JSON through a hidden input named `name`. */
export default function MediaUploader({ name = 'media', folder = 'listings', accept = 'image/*,video/*', max = 20, single = false, label = 'Add photos and video' }:
  { name?: string; folder?: string; accept?: string; max?: number; single?: boolean; label?: string }) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(''); setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, max - items.length)) {
        if (file.size > 50 * 1024 * 1024) { setError(`${file.name} is larger than 50 MB.`); continue; }
        const sig = await fetch('/api/cloudinary/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder }) });
        const s = await sig.json();
        if (!sig.ok) { setError(s.error ?? 'Upload failed.'); break; }
        const body = new FormData();
        body.append('file', file); body.append('api_key', s.apiKey); body.append('timestamp', String(s.timestamp)); body.append('signature', s.signature); body.append('folder', s.folder);
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloud}/${type}/upload`, { method: 'POST', body });
        const j = await res.json();
        if (!res.ok) { setError(j.error?.message ?? 'Upload failed.'); continue; }
        setItems((prev) => (single ? [{ url: j.secure_url, public_id: j.public_id, media_type: type }] : [...prev, { url: j.secure_url, public_id: j.public_id, media_type: type }]));
      }
    } catch { setError('Upload failed. Check your connection and try again.'); }
    setBusy(false);
  }
  const value = single ? (items[0]?.url ?? '') : JSON.stringify(items);
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 p-6 text-center text-sm hover:border-gold-500">
        <ImagePlus className="text-gold-600" /><span className="font-semibold">{busy ? 'Uploading...' : label}</span>
        <span className="text-xs text-neutral-500">Up to {max} files, 50 MB each</span>
        <input type="file" accept={accept} multiple={!single} className="sr-only" disabled={busy || items.length >= max} onChange={(e) => onFiles(e.target.files)} />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((m, i) => (
            <li key={m.public_id} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
              {m.media_type === 'image' ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" /> : <video src={m.url} className="h-full w-full object-cover" />}
              <button type="button" aria-label="Remove" onClick={() => setItems(items.filter((x) => x.public_id !== m.public_id))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
