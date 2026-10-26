'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient, createAdmin } from '@/lib/supabase/server';
import { uniqueSlug } from '@/lib/format';

export type ActionResult = { ok: boolean; error?: string; message?: string };

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}
async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') redirect('/');
  return { supabase, user, admin: createAdmin() };
}

/* ---------- AUTH ---------- */
const authSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(8, 'Password must be at least 8 characters.') });

export async function signIn(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = authSchema.safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: 'Email or password is incorrect.' };
  const next = String(fd.get('next') ?? '/dashboard');
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
}

const ROLES = ['seeker', 'vehicle_seeker', 'agent', 'landlord', 'agency', 'investor'] as const;
export async function signUp(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = authSchema.extend({ name: z.string().min(2, 'Enter your full name.'), role: z.enum(ROLES) })
    .safeParse({ email: fd.get('email'), password: fd.get('password'), name: fd.get('name'), role: fd.get('role') });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email, password: parsed.data.password,
    options: { data: { full_name: parsed.data.name }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  if (data.user) await createAdmin().from('profiles').update({ role: parsed.data.role }).eq('id', data.user.id);
  return { ok: true, message: 'Check your email to confirm your account, then sign in.' };
}

export async function forgotPassword(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const email = z.string().email().safeParse(fd.get('email'));
  if (!email.success) return { ok: false, error: 'Enter a valid email address.' };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password` });
  return { ok: true, message: 'If that email has an account, a reset link is on its way.' };
}

export async function resetPassword(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const pw = z.string().min(8).safeParse(fd.get('password'));
  if (!pw.success) return { ok: false, error: 'Password must be at least 8 characters.' };
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { ok: false, error: error.message };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/* ---------- LISTINGS ---------- */
const num = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().nonnegative().optional());
const phone = z.string().trim().max(20).optional().or(z.literal(''));
const mediaField = z.preprocess((v) => { try { return JSON.parse(String(v || '[]')); } catch { return []; } },
  z.array(z.object({ url: z.string().url().startsWith('https://res.cloudinary.com/'), public_id: z.string().optional(), media_type: z.enum(['image', 'video', 'floorplan', 'tour', 'drone']).default('image') })).max(30));

const propertySchema = z.object({
  title: z.string().trim().min(8, 'Add a title of at least 8 characters.').max(120),
  description: z.string().trim().max(5000).optional(),
  property_type: z.string().min(2), listing_type: z.enum(['Rent', 'Sale', 'Shortlet', 'Sublet', 'Lease', 'Investment']),
  price: z.coerce.number().positive('Enter a price greater than zero.'),
  negotiable: z.preprocess((v) => v === 'on', z.boolean()),
  service_charge: num, agency_fee: num, legal_fee: num, caution_fee: num,
  state: z.string().trim().min(2, 'Choose a state.'), city: z.string().trim().min(2, 'Enter the city.'),
  area: z.string().trim().optional(), address: z.string().trim().optional(), landmark: z.string().trim().optional(),
  lat: num, lng: num,
  bedrooms: num, bathrooms: num, toilets: num, parking_spaces: num, size_sqm: num,
  furnished: z.preprocess((v) => v === 'on', z.boolean()), condition: z.string().optional(),
  amenities: z.preprocess((v) => (typeof v === 'string' && v ? v.split(',') : []), z.array(z.string())),
  video_url: z.string().url().optional().or(z.literal('')), virtual_tour_url: z.string().url().optional().or(z.literal('')),
  contact_phone: phone, contact_whatsapp: phone, contact_email: z.string().email().optional().or(z.literal('')),
  media: mediaField,
});

const periodFor = (t: string) => (t === 'Rent' || t === 'Lease' ? 'year' : t === 'Shortlet' ? 'night' : null);

export async function createProperty(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = propertySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { media, ...row } = parsed.data;
  const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]));
  const { data, error } = await supabase.from('properties').insert({
    ...clean, owner_id: user.id, slug: uniqueSlug(row.title), price_period: periodFor(row.listing_type),
  }).select('id').single();
  if (error || !data) return { ok: false, error: 'We could not save the listing. Please try again.' };
  if (media.length) await supabase.from('listing_media').insert(media.map((m, i) => ({ ...m, kind: 'property', listing_id: data.id, position: i })));
  revalidatePath('/dashboard');
  redirect('/dashboard?submitted=property');
}

const vehicleSchema = z.object({
  title: z.string().trim().min(8, 'Add a title of at least 8 characters.').max(120),
  description: z.string().trim().max(5000).optional(),
  make: z.string().trim().min(2, 'Enter the make.'), model: z.string().trim().min(1, 'Enter the model.'),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive('Enter a price greater than zero.'),
  negotiable: z.preprocess((v) => v === 'on', z.boolean()),
  body_type: z.string().optional(), mileage_km: num, transmission: z.string().optional(), fuel: z.string().optional(),
  color: z.string().optional(), condition: z.string().optional(),
  features: z.preprocess((v) => (typeof v === 'string' && v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []), z.array(z.string())),
  state: z.string().trim().min(2, 'Choose a state.'), city: z.string().trim().min(2, 'Enter the city.'), area: z.string().optional(),
  contact_phone: phone, contact_whatsapp: phone, media: mediaField,
});

export async function createVehicle(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const parsed = vehicleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { media, ...row } = parsed.data;
  const clean = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v === '' ? null : v]));
  const { data, error } = await supabase.from('vehicles').insert({ ...clean, owner_id: user.id, slug: uniqueSlug(row.title) }).select('id').single();
  if (error || !data) return { ok: false, error: 'We could not save the vehicle. Please try again.' };
  if (media.length) await supabase.from('listing_media').insert(media.map((m, i) => ({ ...m, kind: 'vehicle', listing_id: data.id, position: i })));
  revalidatePath('/dashboard');
  redirect('/dashboard?submitted=vehicle');
}

export async function deleteListing(kind: 'property' | 'vehicle', id: string) {
  const { supabase } = await requireUser();
  await supabase.from(kind === 'property' ? 'properties' : 'vehicles').delete().eq('id', id);
  revalidatePath('/dashboard');
}

/* ---------- SAVED ---------- */
export async function toggleSave(kind: 'property' | 'vehicle', listingId: string): Promise<{ saved: boolean; needsAuth?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, needsAuth: true };
  const key = { user_id: user.id, kind, listing_id: listingId };
  const { data: existing } = await supabase.from('saved_listings').select('listing_id').match(key).maybeSingle();
  if (existing) { await supabase.from('saved_listings').delete().match(key); revalidatePath('/saved'); return { saved: false }; }
  await supabase.from('saved_listings').insert(key);
  await supabase.from('listing_events').insert({ kind, listing_id: listingId, event: 'save', user_id: user.id });
  revalidatePath('/saved');
  return { saved: true };
}

/* ---------- ENQUIRIES, CHAT, REPORTS ---------- */
export async function startConversation(kind: 'property' | 'vehicle', listingId: string, sellerId: string) {
  const { supabase, user } = await requireUser();
  if (user.id === sellerId) redirect('/dashboard');
  const { data: existing } = await supabase.from('conversations').select('id').match({ kind, listing_id: listingId, buyer_id: user.id, seller_id: sellerId }).maybeSingle();
  let id = existing?.id as string | undefined;
  if (!id) {
    const { data } = await supabase.from('conversations').insert({ kind, listing_id: listingId, buyer_id: user.id, seller_id: sellerId }).select('id').single();
    id = data?.id;
    await supabase.from('listing_events').insert({ kind, listing_id: listingId, event: 'inquiry', user_id: user.id });
    const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    await createAdmin().from('notifications').insert({ user_id: sellerId, type: 'message', title: 'New enquiry', body: `${me?.full_name ?? 'Someone'} is interested in your listing.`, link: `/messages/${id}` });
    await createAdmin().from('leads').insert({ agent_id: sellerId, seeker_id: user.id, kind, listing_id: listingId, name: me?.full_name });
  }
  redirect(`/messages/${id}`);
}

export async function reportListing(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = z.object({ kind: z.enum(['property', 'vehicle']), listing_id: z.string().uuid(), reason: z.enum(['scam', 'fake_listing', 'abuse', 'duplicate', 'other']), details: z.string().max(1000).optional() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: 'Choose a reason for your report.' };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('reports').insert({ ...parsed.data, reporter_id: user.id });
  return error ? { ok: false, error: 'Could not send the report.' } : { ok: true, message: 'Thanks. Our team will review this listing.' };
}

export async function trackEvent(kind: 'property' | 'vehicle', listingId: string, event: 'click' | 'whatsapp' | 'call' | 'share') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('listing_events').insert({ kind, listing_id: listingId, event, user_id: user?.id ?? null });
}

/* ---------- SHORTLET BOOKING ---------- */
export async function bookShortlet(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = z.object({ property_id: z.string().uuid(), check_in: z.string(), check_out: z.string(), guests: z.coerce.number().int().min(1).max(30) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: 'Choose your check-in and check-out dates.' };
  const { check_in, check_out, guests, property_id } = parsed.data;
  const nights = Math.round((+new Date(check_out) - +new Date(check_in)) / 864e5);
  if (!(nights > 0)) return { ok: false, error: 'Check-out must be after check-in.' };
  if (new Date(check_in) < new Date(new Date().toDateString())) return { ok: false, error: 'Check-in cannot be in the past.' };
  const { supabase, user } = await requireUser();
  const { data: p } = await supabase.from('properties').select('price, owner_id, listing_type').eq('id', property_id).eq('status', 'published').single();
  if (!p || p.listing_type !== 'Shortlet') return { ok: false, error: 'This property is not available for booking.' };
  const { error } = await supabase.from('bookings').insert({ property_id, guest_id: user.id, check_in, check_out, guests, total: Number(p.price) * nights });
  if (error) return { ok: false, error: error.message.includes('no longer available') ? 'Those dates are no longer available.' : 'Could not complete the booking.' };
  await createAdmin().from('notifications').insert({ user_id: p.owner_id, type: 'booking', title: 'New booking request', body: `${nights} night(s) requested.`, link: '/dashboard' });
  revalidatePath('/dashboard');
  return { ok: true, message: `Booking requested for ${nights} night(s). The host will confirm shortly.` };
}

/* ---------- VERIFICATION ---------- */
export async function requestAgentVerification(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const idUrl = String(fd.get('id_document_url') ?? ''), selfie = String(fd.get('selfie_url') ?? '');
  if (!idUrl.startsWith('https://res.cloudinary.com/') || !selfie.startsWith('https://res.cloudinary.com/')) return { ok: false, error: 'Upload a government ID and a selfie.' };
  const agency = String(fd.get('agency_document_url') ?? '');
  const { error } = await supabase.from('verification_requests').insert({
    user_id: user.id, subject: 'agent', id_document_url: idUrl, selfie_url: selfie,
    agency_document_url: agency.startsWith('https://res.cloudinary.com/') ? agency : null, notes: String(fd.get('notes') ?? '').slice(0, 500),
  });
  return error ? { ok: false, error: 'Could not submit your request.' } : { ok: true, message: 'Submitted. We usually review within two business days.' };
}

/* ---------- LEAD CRM ---------- */
export async function updateLeadStage(id: string, stage: string) {
  const { supabase } = await requireUser();
  if (!['new', 'contacted', 'viewing', 'negotiating', 'won', 'lost'].includes(stage)) return;
  await supabase.from('leads').update({ stage }).eq('id', id);
  revalidatePath('/dashboard/crm');
}

/* ---------- ADMIN ---------- */
export async function adminSetListing(kind: 'property' | 'vehicle', id: string, patch: { status?: 'published' | 'rejected' | 'pending_review'; verified?: boolean; featureDays?: number; reason?: string }) {
  const { admin } = await requireAdmin();
  const table = kind === 'property' ? 'properties' : 'vehicles';
  const update: Record<string, unknown> = {};
  if (patch.status) { update.status = patch.status; update.rejection_reason = patch.status === 'rejected' ? (patch.reason ?? 'Did not meet listing standards.') : null; }
  if (patch.verified !== undefined) update.verified = patch.verified;
  if (patch.featureDays !== undefined) update.premium_until = patch.featureDays > 0 ? new Date(Date.now() + patch.featureDays * 864e5).toISOString() : null;
  const { data } = await admin.from(table).update(update).eq('id', id).select('owner_id, title').single();
  if (data && (patch.status || patch.verified)) {
    await admin.from('notifications').insert({ user_id: data.owner_id, type: 'approval', link: '/dashboard',
      title: patch.status === 'published' ? 'Listing approved' : patch.status === 'rejected' ? 'Listing needs changes' : 'Listing verified',
      body: patch.status === 'rejected' ? (patch.reason ?? 'Did not meet listing standards.') : data.title });
  }
  revalidatePath('/admin');
}

export async function adminReviewVerification(id: string, approve: boolean, note?: string) {
  const { admin, user } = await requireAdmin();
  const { data } = await admin.from('verification_requests').update({ status: approve ? 'approved' : 'rejected', reviewer_id: user.id, review_note: note ?? null, reviewed_at: new Date().toISOString() }).eq('id', id).select('user_id, subject').single();
  if (data && approve && data.subject === 'agent') await admin.from('profiles').update({ agent_verified: true }).eq('id', data.user_id);
  if (data) await admin.from('notifications').insert({ user_id: data.user_id, type: 'verification', title: approve ? 'You are verified' : 'Verification not approved', body: note ?? null, link: '/dashboard' });
  revalidatePath('/admin');
}

export async function adminResolveReport(id: string, status: 'resolved' | 'dismissed') {
  const { admin } = await requireAdmin();
  await admin.from('reports').update({ status }).eq('id', id);
  revalidatePath('/admin');
}

export async function adminSetUser(id: string, patch: { suspended?: boolean; agent_verified?: boolean }) {
  const { admin } = await requireAdmin();
  await admin.from('profiles').update(patch).eq('id', id);
  revalidatePath('/admin');
}
