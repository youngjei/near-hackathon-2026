-- Planned PostgreSQL deployment. Current hosted demo uses Sites D1/R2.
-- No browser role may read these tables; a server adapter must verify capability
-- hashes before returning a deliberately limited view.
create table public.bills (
 id uuid primary key, owner_hash text not null, create_key uuid not null,
 merchant text not null, currency text not null, original_total numeric(16,2) not null check(original_total>0),
 extra numeric(16,2) not null default 0 check(extra>=0), diners integer not null check(diners between 2 and 20),
 total_units bigint not null check(total_units>0), fx_rate numeric not null check(fx_rate>0), fx_date date not null, fx_source text not null,
 mode text not null default 'demo' check(mode='demo'), receipt_id uuid, created_at timestamptz not null default now(), unique(owner_hash,create_key)
);
create table public.shares (
 id uuid primary key, bill_id uuid not null references public.bills(id), position integer not null check(position>0),
 amount_units bigint not null check(amount_units>0), token_hash text not null, unique(bill_id,position)
);
create table public.payment_attempts (
 id uuid primary key, share_id uuid not null references public.shares(id), request_key uuid not null,
 method text not null check(method in ('zcash','confidential')),
 status text not null check(status in ('pending','paid','expired','failed','refunded')),
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 mode text not null default 'demo' check(mode='demo'), unique(share_id,request_key)
);
create table public.receipts (
 id uuid primary key, owner_hash text not null, object_key text not null unique, mime text not null,
 created_at timestamptz not null default now()
);
alter table public.bills add constraint bill_receipt foreign key(receipt_id) references public.receipts(id);
create index attempts_share on public.payment_attempts(share_id,created_at desc);
alter table public.bills enable row level security;
alter table public.shares enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.receipts enable row level security;
revoke all on public.bills,public.shares,public.payment_attempts,public.receipts from anon, authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('receipts','receipts',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- There are deliberately no public storage policies.
-- Do not enable live payments by changing this constraint alone.
