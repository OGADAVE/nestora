-- NESTORA schema. Run in the Supabase SQL editor or via `supabase db push`.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ENUMS
create type user_role as enum ('seeker','vehicle_seeker','agent','landlord','agency','investor','admin');
create type listing_status as enum ('draft','pending_review','published','rejected','expired','sold');
create type listing_kind as enum ('property','vehicle');
create type verification_status as enum ('none','pending','approved','rejected');
create type plan_tier as enum ('free','premium_agent','agency');

-- PROFILES (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  whatsapp text,
  role user_role not null default 'seeker',
  agency_name text,
  bio text,
  agent_verified boolean not null default false,
  plan plan_tier not null default 'free',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Users cannot escalate their own role, verification or plan.
create or replace function protect_profile_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.role() <> 'service_role' then
    new.agent_verified := old.agent_verified;
    new.plan := old.plan;
    new.suspended := old.suspended;
    if new.role = 'admin' then new.role := old.role; end if;
  end if;
  return new;
end $$;
create trigger protect_profile before update on profiles for each row execute function protect_profile_fields();

-- PROPERTIES
create table properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  property_type text not null,
  listing_type text not null check (listing_type in ('Rent','Sale','Shortlet','Sublet','Lease','Investment')),
  price numeric(16,2) not null check (price >= 0),
  price_period text,
  negotiable boolean default false,
  service_charge numeric(14,2), agency_fee numeric(14,2), legal_fee numeric(14,2), caution_fee numeric(14,2),
  country text default 'Nigeria', state text, city text, area text, address text, landmark text,
  lat double precision, lng double precision,
  bedrooms int default 0, bathrooms int default 0, toilets int default 0, parking_spaces int default 0,
  size_sqm numeric(12,2),
  furnished boolean default false,
  condition text,
  amenities text[] default '{}',
  video_url text, virtual_tour_url text, drone_url text, floor_plan_url text,
  contact_phone text, contact_whatsapp text, contact_email text,
  status listing_status not null default 'pending_review',
  verified boolean not null default false,
  premium_until timestamptz,
  rejection_reason text,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(title,'')||' '||coalesce(city,'')||' '||coalesce(area,'')||' '||coalesce(state,'')||' '||coalesce(property_type,''))
  ) stored
);
create index properties_fts_idx on properties using gin (fts);
create index properties_filter_idx on properties (status, listing_type, city, price);

-- VEHICLES
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  make text not null, model text not null, year int not null check (year between 1980 and 2100),
  price numeric(16,2) not null check (price >= 0),
  negotiable boolean default false,
  body_type text, mileage_km int, transmission text, fuel text, color text, condition text,
  features text[] default '{}',
  state text, city text, area text,
  contact_phone text, contact_whatsapp text,
  status listing_status not null default 'pending_review',
  verified boolean not null default false,
  premium_until timestamptz,
  rejection_reason text,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('simple', coalesce(title,'')||' '||coalesce(make,'')||' '||coalesce(model,'')||' '||coalesce(city,'')||' '||coalesce(body_type,''))
  ) stored
);
create index vehicles_fts_idx on vehicles using gin (fts);
create index vehicles_filter_idx on vehicles (status, make, city, price);

-- MEDIA (hosted on Cloudinary)
create table listing_media (
  id uuid primary key default gen_random_uuid(),
  kind listing_kind not null,
  listing_id uuid not null,
  url text not null,
  public_id text,
  media_type text not null default 'image' check (media_type in ('image','video','floorplan','tour','drone')),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index listing_media_idx on listing_media (kind, listing_id, position);

-- SAVED
create table saved_listings (
  user_id uuid not null references profiles(id) on delete cascade,
  kind listing_kind not null,
  listing_id uuid not null,
  collection text default 'Favorites',
  created_at timestamptz not null default now(),
  primary key (user_id, kind, listing_id)
);

-- VERIFICATION REQUESTS
create table verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null check (subject in ('agent','property','vehicle')),
  listing_id uuid,
  id_document_url text, selfie_url text, agency_document_url text, notes text,
  status verification_status not null default 'pending',
  reviewer_id uuid references profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- CHAT
create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind listing_kind,
  listing_id uuid,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique (kind, listing_id, buyer_id, seller_id),
  check (buyer_id <> seller_id)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text,
  attachment_url text,
  attachment_type text,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  check (body is not null or attachment_url is not null)
);
create index messages_conv_idx on messages (conversation_id, created_at);

-- LEADS / CRM
create table leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid references profiles(id) on delete set null,
  kind listing_kind, listing_id uuid,
  name text, phone text, email text, message text,
  stage text not null default 'new' check (stage in ('new','contacted','viewing','negotiating','won','lost')),
  notes text,
  created_at timestamptz not null default now()
);

-- SHORTLET BOOKINGS
create table bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  guest_id uuid not null references profiles(id) on delete cascade,
  check_in date not null, check_out date not null,
  guests int not null default 1,
  total numeric(14,2) not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index bookings_prop_idx on bookings (property_id, check_in, check_out);

create or replace function prevent_double_booking() returns trigger language plpgsql as $$
begin
  if new.status in ('pending','confirmed') and exists (
    select 1 from bookings b where b.property_id = new.property_id and b.id <> new.id
      and b.status in ('pending','confirmed')
      and daterange(b.check_in, b.check_out) && daterange(new.check_in, new.check_out)
  ) then raise exception 'Those dates are no longer available'; end if;
  return new;
end $$;
create trigger bookings_no_overlap before insert or update on bookings for each row execute function prevent_double_booking();

-- REPORTS
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  kind listing_kind, listing_id uuid,
  reason text not null check (reason in ('scam','fake_listing','abuse','duplicate','other')),
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, title text not null, body text, link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- PAYMENTS (Paystack) – written only by the server with the service role
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reference text unique not null,
  purpose text not null check (purpose in ('boost_listing','premium_agent','agency','booking')),
  kind listing_kind, listing_id uuid,
  amount_kobo bigint not null,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ANALYTICS EVENTS
create table listing_events (
  id bigint generated always as identity primary key,
  kind listing_kind not null, listing_id uuid not null,
  event text not null check (event in ('view','click','inquiry','save','share','whatsapp','call')),
  user_id uuid, source text,
  created_at timestamptz not null default now()
);
create index listing_events_idx on listing_events (kind, listing_id, event, created_at);

create or replace view owner_listing_stats with (security_invoker = true) as
select p.owner_id, 'property'::listing_kind as kind, p.id as listing_id, p.title,
  count(*) filter (where e.event = 'view') as views,
  count(*) filter (where e.event = 'click') as clicks,
  count(*) filter (where e.event in ('inquiry','whatsapp','call')) as inquiries
from properties p left join listing_events e on e.kind = 'property' and e.listing_id = p.id group by p.id
union all
select v.owner_id, 'vehicle'::listing_kind, v.id, v.title,
  count(*) filter (where e.event = 'view'),
  count(*) filter (where e.event = 'click'),
  count(*) filter (where e.event in ('inquiry','whatsapp','call'))
from vehicles v left join listing_events e on e.kind = 'vehicle' and e.listing_id = v.id group by v.id;

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table properties enable row level security;
alter table vehicles enable row level security;
alter table listing_media enable row level security;
alter table saved_listings enable row level security;
alter table verification_requests enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;
alter table payments enable row level security;
alter table listing_events enable row level security;

create policy profiles_read on profiles for select using (true);
create policy profiles_update_own on profiles for update using (id = auth.uid() or is_admin());

create policy properties_read on properties for select using (status = 'published' or owner_id = auth.uid() or is_admin());
create policy properties_insert on properties for insert with check (owner_id = auth.uid());
create policy properties_update on properties for update using (owner_id = auth.uid() or is_admin());
create policy properties_delete on properties for delete using (owner_id = auth.uid() or is_admin());

create policy vehicles_read on vehicles for select using (status = 'published' or owner_id = auth.uid() or is_admin());
create policy vehicles_insert on vehicles for insert with check (owner_id = auth.uid());
create policy vehicles_update on vehicles for update using (owner_id = auth.uid() or is_admin());
create policy vehicles_delete on vehicles for delete using (owner_id = auth.uid() or is_admin());

-- Owners cannot self-publish, self-verify or self-promote.
create or replace function protect_listing_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.status := 'pending_review'; new.verified := false; new.premium_until := null;
    else
      new.verified := old.verified;
      new.premium_until := old.premium_until;
      new.rejection_reason := old.rejection_reason;
      if new.status is distinct from old.status and new.status not in ('draft','pending_review','sold') then
        new.status := old.status;
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger properties_protect before insert or update on properties for each row execute function protect_listing_fields();
create trigger vehicles_protect before insert or update on vehicles for each row execute function protect_listing_fields();

create policy media_read on listing_media for select using (true);
create policy media_write on listing_media for all using (
  is_admin()
  or exists (select 1 from properties p where kind = 'property' and p.id = listing_id and p.owner_id = auth.uid())
  or exists (select 1 from vehicles v where kind = 'vehicle' and v.id = listing_id and v.owner_id = auth.uid())
) with check (
  is_admin()
  or exists (select 1 from properties p where kind = 'property' and p.id = listing_id and p.owner_id = auth.uid())
  or exists (select 1 from vehicles v where kind = 'vehicle' and v.id = listing_id and v.owner_id = auth.uid())
);

create policy saved_own on saved_listings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy verif_insert on verification_requests for insert with check (user_id = auth.uid());
create policy verif_read on verification_requests for select using (user_id = auth.uid() or is_admin());
create policy verif_admin_update on verification_requests for update using (is_admin());

create policy conv_read on conversations for select using (auth.uid() in (buyer_id, seller_id));
create policy conv_insert on conversations for insert with check (buyer_id = auth.uid());
create policy msg_read on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy msg_insert on messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));
create policy msg_seen on messages for update using (
  sender_id <> auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.buyer_id, c.seller_id)));

create policy leads_agent on leads for all using (agent_id = auth.uid() or is_admin()) with check (agent_id = auth.uid() or is_admin());
create policy leads_insert_any on leads for insert with check (seeker_id = auth.uid() or seeker_id is null);

create policy bookings_read on bookings for select using (
  guest_id = auth.uid() or is_admin()
  or exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()));
create policy bookings_insert on bookings for insert with check (guest_id = auth.uid());
create policy bookings_update on bookings for update using (
  guest_id = auth.uid() or is_admin()
  or exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()));

create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_admin on reports for select using (is_admin());
create policy reports_admin_update on reports for update using (is_admin());

create policy notif_own on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy payments_read on payments for select using (user_id = auth.uid() or is_admin());

create policy events_insert on listing_events for insert with check (true);
create policy events_owner_read on listing_events for select using (
  is_admin()
  or exists (select 1 from properties p where kind = 'property' and p.id = listing_id and p.owner_id = auth.uid())
  or exists (select 1 from vehicles v where kind = 'vehicle' and v.id = listing_id and v.owner_id = auth.uid()));

-- Realtime for chat and notifications
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;

-- Atomic view counter (public pages call this)
create or replace function increment_views(p_kind listing_kind, p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'property' then update properties set views = views + 1 where id = p_id and status = 'published';
  else update vehicles set views = views + 1 where id = p_id and status = 'published'; end if;
  insert into listing_events (kind, listing_id, event) values (p_kind, p_id, 'view');
end $$;
