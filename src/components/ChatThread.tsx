'use client';
import { Paperclip, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Msg = { id: string; sender_id: string; body: string | null; attachment_url: string | null; attachment_type: string | null; seen_at: string | null; created_at: string };

export default function ChatThread({ conversationId, me, otherName, initial }: { conversationId: string; me: string; otherName: string; initial: Msg[] }) {
  const supabase = useRef(createClient()).current;
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>(undefined);

  useEffect(() => {
    const ch = supabase.channel(`chat:${conversationId}`, { config: { presence: { key: me } } });
    channelRef.current = ch;
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p) => {
      const m = p.new as Msg;
      setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      if (m.sender_id !== me) void supabase.from('messages').update({ seen_at: new Date().toISOString() }).eq('id', m.id);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p) => {
      const m = p.new as Msg; setMsgs((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.user !== me) { setTyping(true); clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setTyping(false), 2000); }
    })
    .on('presence', { event: 'sync' }, () => setOnline(Object.keys(ch.presenceState()).some((k) => k !== me)))
    .subscribe(async (status) => { if (status === 'SUBSCRIBED') await ch.track({ at: Date.now() }); });
    // mark existing unseen incoming messages as seen
    void supabase.from('messages').update({ seen_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', me).is('seen_at', null);
    return () => { void supabase.removeChannel(ch); };
  }, [conversationId, me, supabase]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  async function send(body: string | null, attachment?: { url: string; type: string }) {
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: me, body, attachment_url: attachment?.url ?? null, attachment_type: attachment?.type ?? null });
    if (!error) await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
  }
  async function attach(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('Files must be under 20 MB.'); return; }
    setUploading(true);
    try {
      const s = await (await fetch('/api/cloudinary/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'chat' }) })).json();
      const fd = new FormData(); fd.append('file', file); fd.append('api_key', s.apiKey); fd.append('timestamp', String(s.timestamp)); fd.append('signature', s.signature); fd.append('folder', s.folder);
      const j = await (await fetch(`https://api.cloudinary.com/v1_1/${s.cloud}/auto/upload`, { method: 'POST', body: fd })).json();
      if (j.secure_url) await send(null, { url: j.secure_url, type: file.type.startsWith('image') ? 'image' : 'file' });
    } finally { setUploading(false); }
  }
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === me);

  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b px-4 py-3"><p className="font-semibold">{otherName}</p><p className="flex items-center gap-1.5 text-xs text-neutral-500"><span className={`h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-neutral-300'}`} />{online ? 'Online' : 'Offline'}</p></header>
      <div className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === me ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === me ? 'bg-navy-900 text-white' : 'bg-neutral-100'}`}>
              {m.attachment_url && (m.attachment_type === 'image' ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.attachment_url} alt="Shared image" className="mb-1 max-h-60 rounded-lg" /> : <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="underline">Open file</a>)}
              {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
              <p className="mt-0.5 text-right text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}{m.id === lastMine?.id && m.seen_at ? ' · Seen' : ''}</p>
            </div>
          </div>
        ))}
        {typing && <p className="text-xs text-neutral-500">{otherName} is typing...</p>}
        <div ref={bottom} />
      </div>
      <form className="flex items-center gap-2 border-t p-3" onSubmit={async (e) => { e.preventDefault(); const t = text.trim(); if (!t) return; setText(''); await send(t); }}>
        <label className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border" aria-label="Attach a file"><Paperclip size={17} /><input type="file" className="sr-only" disabled={uploading} onChange={(e) => attach(e.target.files?.[0])} /></label>
        <input value={text} onChange={(e) => { setText(e.target.value); void channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user: me } }); }} className="field flex-1" placeholder="Write a message" aria-label="Message" maxLength={2000} />
        <button className="btn-primary h-10 w-10 p-0" aria-label="Send"><Send size={17} /></button>
      </form>
    </div>
  );
}
