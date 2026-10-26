# Nestora: Buy. Rent. Invest.

Property and vehicle marketplace for Nigeria. Next.js 15 (App Router) + Supabase + Cloudinary + Paystack.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in.
3. **Supabase**: create a project, then run `supabase/migrations/0001_init.sql` and `0002_newsletter.sql` in the SQL editor.
   - Authentication > Providers: enable Email and Google. Add `http://localhost:3000/auth/callback` and your production URL to Redirect URLs.
   - Make yourself admin after signing up: see `supabase/seed.sql`.
4. **Cloudinary**: copy cloud name, API key and secret into `.env.local`.
5. **Paystack**: add the secret key, then set the webhook URL to `https://YOUR_DOMAIN/api/paystack/webhook`.
6. **Google Maps**: enable the *Maps Embed API* and add the key. Restrict it to your domain.
7. `npm run dev`

Deploy to Vercel: import the repo and add the same environment variables.

## What is built

Auth (email, Google, reset), roles, property and vehicle listings with Cloudinary media, filters, plain-English search,
detail pages with SEO (metadata, Open Graph, JSON-LD, sitemap), mortgage calculator, ROI calculator, saved listings,
realtime chat (typing, seen, online, file sharing), verified property/agent/premium badges, agent verification flow,
lead manager, shortlet booking with double-booking protection, reports, notifications, analytics counters,
admin panel (approve/reject, verify, feature, users, reports), Paystack boosts and plans, row-level security on every table.

## Not built yet

- Native Android/iOS apps (the site is mobile-first; wrap it later with Capacitor or build React Native on the same Supabase backend).
- Firebase push notifications (in-app notifications work; add FCM when the mobile app exists).
- Behaviour-based "Recommended for you" and an LLM search (current search is a rule-based parser).
- Email notifications, subscription renewals/expiry, the optional badges (Fast Responder, Top Seller), charts in analytics.
- Privacy policy and terms are placeholders. Plan prices in `api/paystack/initialize` are placeholders.

## Migrating from the AppDeploy version

The old Vite app and `@appdeploy` backend are replaced entirely. Demo listings are not carried over; list real ones through `/list`.
