create table newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
-- No policies: only the server (service role) reads or writes this table.
