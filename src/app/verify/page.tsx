'use client';
import { useActionState } from 'react';
import MediaUploader from '@/components/MediaUploader';
import { requestAgentVerification, type ActionResult } from '@/app/actions';

export default function Verify() {
  const [s, action, pending] = useActionState<ActionResult | null, FormData>(requestAgentVerification, null);
  return (
    <div className="container-x max-w-2xl py-10">
      <h1 className="font-display text-3xl font-bold">Get your verified agent badge</h1>
      <p className="mt-2 text-neutral-600">We check your identity once. Documents are only visible to Nestora reviewers.</p>
      <form action={action} className="mt-8 grid gap-6">
        <div className="card p-5"><h2 className="font-semibold">Government-issued ID</h2><p className="mb-3 text-sm text-neutral-500">National ID, driver&apos;s licence, passport or voter&apos;s card.</p><MediaUploader name="id_document_url" folder="verification" accept="image/*" single label="Upload your ID" /></div>
        <div className="card p-5"><h2 className="font-semibold">Selfie holding your ID</h2><p className="mb-3 text-sm text-neutral-500">Your face and the ID must both be clearly visible.</p><MediaUploader name="selfie_url" folder="verification" accept="image/*" single label="Upload a selfie" /></div>
        <div className="card p-5"><h2 className="font-semibold">Agency documents <span className="text-sm font-normal text-neutral-500">(optional)</span></h2><p className="mb-3 text-sm text-neutral-500">CAC certificate or similar.</p><MediaUploader name="agency_document_url" folder="verification" accept="image/*" single label="Upload a document" /></div>
        <div><label className="label" htmlFor="notes">Anything else we should know?</label><textarea id="notes" name="notes" rows={3} maxLength={500} className="field" /></div>
        {s && <p role={s.ok ? 'status' : 'alert'} className={`rounded-lg p-3 text-sm ${s.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{s.ok ? s.message : s.error}</p>}
        <button disabled={pending} className="btn-gold py-3">{pending ? 'Submitting...' : 'Submit for review'}</button>
      </form>
    </div>
  );
}
