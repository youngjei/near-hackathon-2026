-- Server-only operations. No grants to browser roles, no dynamic SQL.
-- Each RPC runs as a single PostgreSQL transaction. Existing rows are preserved.
begin;
create table public.rate_limits (
 key text primary key, count integer not null check(count > 0), expires_at timestamptz not null
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.bills, public.shares, public.payment_attempts, public.receipts, public.rate_limits to service_role;
alter table public.payment_attempts add column sequence bigint generated always as identity;
grant usage, select on sequence public.payment_attempts_sequence_seq to service_role;

create function public.sdb_bill_json(b public.bills) returns jsonb
language sql immutable security invoker set search_path = '' as $$
 select to_jsonb(b) || jsonb_build_object('total_units',b.total_units::text,'original_total',b.original_total::text,'extra',b.extra::text,'fx_rate',b.fx_rate::text)
$$;
create function public.sdb_share_json(s public.shares) returns jsonb
language sql immutable security invoker set search_path = '' as $$
 select to_jsonb(s) || jsonb_build_object('amount_units',s.amount_units::text)
$$;
create function public.sdb_read(p_kind text, p_id text, p_key text default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
 case p_kind
 when 'bill' then select public.sdb_bill_json(b) into result from public.bills b where id=p_id::uuid;
 when 'bill_request' then select public.sdb_bill_json(b) into result from public.bills b where owner_hash=p_id and create_key=p_key::uuid;
 when 'share' then select public.sdb_share_json(s) into result from public.shares s where id=p_id::uuid;
 when 'shares' then select coalesce(jsonb_agg(public.sdb_share_json(s) order by position),'[]'::jsonb) into result from public.shares s where bill_id=p_id::uuid;
 when 'attempts' then select coalesce(jsonb_agg(to_jsonb(a) order by created_at desc,sequence desc),'[]'::jsonb) into result from public.payment_attempts a where share_id=p_id::uuid;
 when 'receipt' then select to_jsonb(r) into result from public.receipts r where id=p_id::uuid;
 else raise exception 'Unsupported read';
 end case;
 return result;
end $$;

create function public.sdb_save_receipt(p_receipt jsonb) returns void
language sql security invoker set search_path = '' as $$
 insert into public.receipts select * from jsonb_populate_record(null::public.receipts,p_receipt)
$$;

create function public.sdb_create_bill(p_bill jsonb, p_shares jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare b public.bills; s public.shares; new_id uuid; amount_sum bigint;
begin
 b := jsonb_populate_record(null::public.bills,p_bill);
 if jsonb_array_length(p_shares) <> b.diners-1 then raise exception 'Invalid share count'; end if;
 insert into public.bills select b.* on conflict(owner_hash,create_key) do nothing returning id into new_id;
 if new_id is null then
   select * into b from public.bills where owner_hash=b.owner_hash and create_key=b.create_key;
   return public.sdb_bill_json(b);
 end if;
 for s in select * from jsonb_populate_recordset(null::public.shares,p_shares) loop
   if s.bill_id <> b.id or s.position >= b.diners then raise exception 'Invalid share'; end if;
   insert into public.shares select s.*;
 end loop;
 select sum(amount_units) into amount_sum from public.shares where bill_id=b.id;
 if amount_sum >= b.total_units then raise exception 'Organizer share missing'; end if;
 return public.sdb_bill_json(b);
end $$;

create function public.sdb_create_demo_attempt(p_attempt jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare a public.payment_attempts; prior public.payment_attempts; bill_mode text;
begin
 a := jsonb_populate_record(null::public.payment_attempts,p_attempt);
 -- All creation/settlement operations lock the same share before reading state.
 perform 1 from public.shares where id=a.share_id for update;
 select b.mode into bill_mode from public.bills b join public.shares s on s.bill_id=b.id where s.id=a.share_id;
 if bill_mode is distinct from 'demo' or a.mode is distinct from 'demo' or a.status is distinct from 'pending' then raise exception 'Simulation requires demo records'; end if;
 select * into prior from public.payment_attempts where share_id=a.share_id and request_key=a.request_key;
 if found then
   if prior.method <> a.method then raise sqlstate 'PT409' using message='Request key reused'; end if;
   return;
 end if;
 if exists(select 1 from public.payment_attempts where share_id=a.share_id and status='paid') then raise sqlstate 'PT409' using message='Already paid'; end if;
 update public.payment_attempts set status='expired' where share_id=a.share_id and mode='demo' and status='pending';
 insert into public.payment_attempts (id,share_id,request_key,method,status,created_at,expires_at,mode)
 values (a.id,a.share_id,a.request_key,a.method,'pending',a.created_at,a.expires_at,'demo');
end $$;

create function public.sdb_update_demo_attempt(p_id uuid,p_share uuid,p_previous text,p_next text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 perform 1 from public.shares where id=p_share for update;
 if not exists(select 1 from public.shares s join public.bills b on b.id=s.bill_id where s.id=p_share and b.mode='demo') then raise exception 'Simulation requires a demo bill'; end if;
 if not (p_previous=p_next or (p_previous='pending' and p_next in ('paid','expired','failed','refunded')) or (p_previous in ('expired','failed') and p_next in ('paid','refunded')) or (p_previous='paid' and p_next='refunded')) then raise exception 'Invalid transition'; end if;
 update public.payment_attempts set status=p_next where id=p_id and share_id=p_share and status=p_previous and mode='demo';
end $$;

create function public.sdb_increment_limit(p_key text,p_expires timestamptz) returns integer
language sql security invoker set search_path = '' as $$
 insert into public.rate_limits (key,count,expires_at) values (p_key,1,p_expires)
 on conflict (key) do update set count=public.rate_limits.count+1 returning count
$$;
create function public.sdb_expire_demo(p_now timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 update public.payment_attempts set status='expired' where mode='demo' and status='pending' and expires_at<=p_now;
 delete from public.rate_limits where expires_at<p_now-interval '1 hour';
end $$;

revoke execute on function public.sdb_bill_json(public.bills), public.sdb_share_json(public.shares), public.sdb_read(text,text,text), public.sdb_save_receipt(jsonb), public.sdb_create_bill(jsonb,jsonb), public.sdb_create_demo_attempt(jsonb), public.sdb_update_demo_attempt(uuid,uuid,text,text), public.sdb_increment_limit(text,timestamptz), public.sdb_expire_demo(timestamptz) from public, anon, authenticated;
grant execute on function public.sdb_bill_json(public.bills), public.sdb_share_json(public.shares), public.sdb_read(text,text,text), public.sdb_save_receipt(jsonb), public.sdb_create_bill(jsonb,jsonb), public.sdb_create_demo_attempt(jsonb), public.sdb_update_demo_attempt(uuid,uuid,text,text), public.sdb_increment_limit(text,timestamptz), public.sdb_expire_demo(timestamptz) to service_role;
notify pgrst, 'reload schema';
commit;
