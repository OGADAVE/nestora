'use client';
import { MessageCircle, Phone, Share2 } from 'lucide-react';
import { trackEvent } from '@/app/actions';

const digits = (s?: string | null) => (s ?? '').replace(/\D/g, '').replace(/^0/, '234');

export default function ContactPanel({ kind, id, title, phone, whatsapp }: { kind: 'property' | 'vehicle'; id: string; title: string; phone?: string | null; whatsapp?: string | null }) {
  const wa = digits(whatsapp ?? phone);
  const share = async () => {
    void trackEvent(kind, id, 'share');
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* cancelled */ } }
    else { await navigator.clipboard.writeText(url); alert('Link copied'); }
  };
  return (
    <div className="grid gap-2">
      {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I'm interested in "${title}" on Nestora.`)}`} target="_blank" rel="noopener noreferrer" onClick={() => void trackEvent(kind, id, 'whatsapp')} className="btn bg-green-600 text-white hover:bg-green-700"><MessageCircle size={17} />WhatsApp</a>}
      {phone && <a href={`tel:${phone}`} onClick={() => void trackEvent(kind, id, 'call')} className="btn-outline"><Phone size={17} />Call</a>}
      <button type="button" onClick={share} className="btn-outline"><Share2 size={17} />Share</button>
    </div>
  );
}
