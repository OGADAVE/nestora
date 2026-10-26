'use client';
import { useActionState, useState } from 'react';
import { createProperty, createVehicle, type ActionResult } from '@/app/actions';
import MediaUploader from './MediaUploader';
import { AMENITIES, BODY_TYPES, MAKES, PROPERTY_TYPES, STATES } from '@/lib/constants';

const Err = ({ s }: { s: ActionResult | null }) => (s && !s.ok ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{s.error}</p> : null);
const F = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => <div><label className="label" htmlFor={id}>{label}</label>{children}</div>;

export function PropertyForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createProperty, null);
  const [amen, setAmen] = useState<string[]>([]);
  return (
    <form action={action} className="grid gap-8">
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-display text-lg font-semibold sm:col-span-2">Basics</h2>
        <div className="sm:col-span-2"><F id="title" label="Title *"><input id="title" name="title" className="field" required minLength={8} placeholder="e.g. Luxury 4 bedroom terrace duplex" /></F></div>
        <F id="property_type" label="Property type *"><select id="property_type" name="property_type" className="field">{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
        <F id="listing_type" label="Listing type *"><select id="listing_type" name="listing_type" className="field">{['Rent', 'Sale', 'Shortlet', 'Sublet', 'Lease', 'Investment'].map((t) => <option key={t}>{t}</option>)}</select></F>
        <div className="sm:col-span-2"><F id="description" label="Description"><textarea id="description" name="description" rows={5} maxLength={5000} className="field" /></F></div>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="font-display text-lg font-semibold sm:col-span-2 lg:col-span-4">Pricing (₦)</h2>
        <F id="price" label="Price *"><input id="price" name="price" type="number" min="1" required className="field" /></F>
        <F id="service_charge" label="Service charge"><input id="service_charge" name="service_charge" type="number" min="0" className="field" /></F>
        <F id="agency_fee" label="Agency fee"><input id="agency_fee" name="agency_fee" type="number" min="0" className="field" /></F>
        <F id="legal_fee" label="Legal fee"><input id="legal_fee" name="legal_fee" type="number" min="0" className="field" /></F>
        <F id="caution_fee" label="Caution fee"><input id="caution_fee" name="caution_fee" type="number" min="0" className="field" /></F>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="negotiable" />Price is negotiable</label>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-display text-lg font-semibold sm:col-span-2 lg:col-span-3">Location</h2>
        <F id="state" label="State *"><select id="state" name="state" className="field" defaultValue="Lagos">{STATES.map((s) => <option key={s}>{s}</option>)}</select></F>
        <F id="city" label="City *"><input id="city" name="city" className="field" required /></F>
        <F id="area" label="Area"><input id="area" name="area" className="field" placeholder="e.g. Lekki Phase 1" /></F>
        <div className="sm:col-span-2"><F id="address" label="Street address"><input id="address" name="address" className="field" /></F></div>
        <F id="landmark" label="Landmark"><input id="landmark" name="landmark" className="field" /></F>
        <F id="lat" label="Latitude"><input id="lat" name="lat" type="number" step="any" className="field" /></F>
        <F id="lng" label="Longitude"><input id="lng" name="lng" type="number" step="any" className="field" /></F>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
        <h2 className="font-display text-lg font-semibold sm:col-span-3 lg:col-span-6">Details</h2>
        {(['bedrooms', 'bathrooms', 'toilets', 'parking_spaces', 'size_sqm'] as const).map((k) => <F key={k} id={k} label={k === 'size_sqm' ? 'Size (sqm)' : k.replace('_', ' ').replace(/^./, (c) => c.toUpperCase())}><input id={k} name={k} type="number" min="0" className="field" /></F>)}
        <F id="condition" label="Condition"><select id="condition" name="condition" className="field"><option>New</option><option>Renovated</option><option>Good</option><option>Needs work</option></select></F>
        <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" name="furnished" />Furnished</label>
        <fieldset className="sm:col-span-3 lg:col-span-6"><legend className="label">Amenities</legend>
          <input type="hidden" name="amenities" value={amen.join(',')} />
          <div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <button type="button" key={a} aria-pressed={amen.includes(a)} onClick={() => setAmen(amen.includes(a) ? amen.filter((x) => x !== a) : [...amen, a])} className={`rounded-full border px-3 py-1 text-sm ${amen.includes(a) ? 'border-navy-900 bg-navy-900 text-white' : 'border-neutral-300'}`}>{a}</button>)}</div></fieldset>
      </section>
      <section className="card grid gap-4 p-5">
        <h2 className="font-display text-lg font-semibold">Media</h2>
        <MediaUploader folder="listings" />
        <div className="grid gap-4 sm:grid-cols-2">
          <F id="video_url" label="Video link (optional)"><input id="video_url" name="video_url" type="url" className="field" placeholder="https://" /></F>
          <F id="virtual_tour_url" label="360° tour link (optional)"><input id="virtual_tour_url" name="virtual_tour_url" type="url" className="field" placeholder="https://" /></F>
        </div>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <h2 className="font-display text-lg font-semibold sm:col-span-3">Contact</h2>
        <F id="contact_phone" label="Phone"><input id="contact_phone" name="contact_phone" type="tel" className="field" /></F>
        <F id="contact_whatsapp" label="WhatsApp"><input id="contact_whatsapp" name="contact_whatsapp" type="tel" className="field" /></F>
        <F id="contact_email" label="Email"><input id="contact_email" name="contact_email" type="email" className="field" /></F>
      </section>
      <Err s={state} />
      <button disabled={pending} className="btn-gold py-3">{pending ? 'Submitting...' : 'Submit for review'}</button>
    </form>
  );
}

export function VehicleForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createVehicle, null);
  return (
    <form action={action} className="grid gap-8">
      <section className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-display text-lg font-semibold sm:col-span-2 lg:col-span-3">Vehicle</h2>
        <div className="sm:col-span-2 lg:col-span-3"><F id="vtitle" label="Title *"><input id="vtitle" name="title" className="field" required minLength={8} placeholder="e.g. 2022 Toyota Land Cruiser Prado" /></F></div>
        <F id="make" label="Make *"><select id="make" name="make" className="field">{MAKES.map((m) => <option key={m}>{m}</option>)}</select></F>
        <F id="model" label="Model *"><input id="model" name="model" className="field" required /></F>
        <F id="year" label="Year *"><input id="year" name="year" type="number" min="1980" max={new Date().getFullYear() + 1} defaultValue={new Date().getFullYear() - 2} className="field" required /></F>
        <F id="vprice" label="Price (₦) *"><input id="vprice" name="price" type="number" min="1" required className="field" /></F>
        <F id="body_type" label="Body type"><select id="body_type" name="body_type" className="field">{BODY_TYPES.map((m) => <option key={m}>{m}</option>)}</select></F>
        <F id="mileage_km" label="Mileage (km)"><input id="mileage_km" name="mileage_km" type="number" min="0" className="field" /></F>
        <F id="transmission" label="Transmission"><select id="transmission" name="transmission" className="field"><option>Automatic</option><option>Manual</option></select></F>
        <F id="fuel" label="Fuel"><select id="fuel" name="fuel" className="field"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select></F>
        <F id="condition" label="Condition"><select id="condition" name="condition" className="field"><option>Foreign used</option><option>Nigerian used</option><option>Brand new</option></select></F>
        <F id="color" label="Colour"><input id="color" name="color" className="field" /></F>
        <div className="sm:col-span-2"><F id="features" label="Features (comma separated)"><input id="features" name="features" className="field" placeholder="Sunroof, Leather seats, Reverse camera" /></F></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="negotiable" />Price is negotiable</label>
        <div className="sm:col-span-2 lg:col-span-3"><F id="vdesc" label="Description"><textarea id="vdesc" name="description" rows={4} className="field" /></F></div>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <h2 className="font-display text-lg font-semibold sm:col-span-3">Location and contact</h2>
        <F id="vstate" label="State *"><select id="vstate" name="state" className="field" defaultValue="Lagos">{STATES.map((s) => <option key={s}>{s}</option>)}</select></F>
        <F id="vcity" label="City *"><input id="vcity" name="city" className="field" required /></F>
        <F id="varea" label="Area"><input id="varea" name="area" className="field" /></F>
        <F id="vphone" label="Phone"><input id="vphone" name="contact_phone" type="tel" className="field" /></F>
        <F id="vwa" label="WhatsApp"><input id="vwa" name="contact_whatsapp" type="tel" className="field" /></F>
      </section>
      <section className="card p-5"><h2 className="mb-3 font-display text-lg font-semibold">Photos</h2><MediaUploader folder="vehicles" accept="image/*,video/*" /></section>
      <Err s={state} />
      <button disabled={pending} className="btn-gold py-3">{pending ? 'Submitting...' : 'Submit for review'}</button>
    </form>
  );
}
