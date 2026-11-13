-- Payment storage only: applying this migration does not authorize funded execution.
begin;
create or replace function public.sdb_create_bill(p_bill jsonb, p_shares jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare b public.bills; s public.shares; new_id uuid; amount_sum bigint;
begin
 b := jsonb_populate_record(null::public.bills,p_bill);
 if jsonb_array_length(p_shares) <> b.diners-1 then raise exception 'Invalid share count'; end if;
 insert into public.bills select b.* on conflict(owner_hash,create_key) do nothing returning id into new_id;
 if new_id is null then
   select * into b from public.bills where owner_hash=b.owner_hash and create_key=b.create_key;
   if b.mode is distinct from p_bill->>'mode' then raise sqlstate 'PT409' using message='Payment mode changed'; end if;
   if b.recipient_account is distinct from p_bill->>'recipient_account' then
     raise sqlstate 'PT409' using message='Recipient differs from saved bill';
   end if;
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

create table public.live_payment_attempts (
 attempt_id uuid primary key references public.payment_attempts(id),
 share_id uuid not null references public.shares(id),
 route_fingerprint text not null,
 allocation_state text not null check(allocation_state in ('allocating','ready','unknown','review','terminal')),
 quote jsonb,
 settlement_updated_at timestamptz,
 signer_account text,
 signed_intent jsonb,
 submission_state text check(submission_state is null or submission_state in ('prepared','submitting','accepted','unknown')),
 submission_hash text,
 provider_status text,
 deposit_observed boolean not null default false,
 settlement_state text,
 last_checked_at timestamptz not null default to_timestamp(0)
);
create unique index live_active_share on public.live_payment_attempts(share_id)
 where allocation_state in ('allocating','ready','unknown','review');
create index live_reconcile_order on public.live_payment_attempts(last_checked_at);
alter table public.live_payment_attempts enable row level security;
revoke all on public.live_payment_attempts from public,anon,authenticated;
grant select,insert,update on public.live_payment_attempts to service_role;

create function public.sdb_live_json(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select to_jsonb(a) || (to_jsonb(l)-'attempt_id'-'share_id')
 from public.payment_attempts a join public.live_payment_attempts l on l.attempt_id=a.id where a.id=p_id
$$;
create function public.sdb_live_read(p_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$ select public.sdb_live_json(p_id) $$;

create function public.sdb_reserve_live(p_attempt jsonb,p_fingerprint text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a public.payment_attempts; prior public.payment_attempts;
begin
 a:=jsonb_populate_record(null::public.payment_attempts,p_attempt);
 perform 1 from public.shares where id=a.share_id for update;
 if not exists(select 1 from public.shares s join public.bills b on b.id=s.bill_id where s.id=a.share_id and b.mode='live' and b.recipient_account is not null)
 or a.mode is distinct from 'live' or a.status is distinct from 'pending' then raise exception 'Live bill required'; end if;
 select * into prior from public.payment_attempts where share_id=a.share_id and request_key=a.request_key;
 if found then
  if prior.method<>a.method or not exists(select 1 from public.live_payment_attempts where attempt_id=prior.id and route_fingerprint=p_fingerprint)
  then raise sqlstate 'PT409' using message='Request key reused'; end if;
  return jsonb_build_object('attempt',public.sdb_live_json(prior.id),'acquired',false);
 end if;
 if exists(select 1 from public.payment_attempts where share_id=a.share_id and status in ('paid','pending'))
 or exists(select 1 from public.live_payment_attempts where share_id=a.share_id and (quote is not null or allocation_state in ('allocating','ready','unknown','review')))
 then raise sqlstate 'PT409' using message='An attempt already exists'; end if;
 insert into public.payment_attempts(id,share_id,request_key,method,status,created_at,expires_at,mode)
 values(a.id,a.share_id,a.request_key,a.method,a.status,a.created_at,a.expires_at,a.mode);
 insert into public.live_payment_attempts(attempt_id,share_id,route_fingerprint,allocation_state)
 values(a.id,a.share_id,p_fingerprint,'allocating');
 return jsonb_build_object('attempt',public.sdb_live_json(a.id),'acquired',true);
end $$;

create function public.sdb_save_live_quote(p_id uuid,p_quote jsonb,p_expires timestamptz) returns void
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.shares where id=(select share_id from public.payment_attempts where id=p_id) for update;
 update public.live_payment_attempts set quote=p_quote,allocation_state='ready' where attempt_id=p_id and allocation_state='allocating';
 if found then update public.payment_attempts set expires_at=p_expires where id=p_id and mode='live'; end if;
end $$;
create function public.sdb_live_unknown(p_id uuid) returns void
language sql security invoker set search_path='' as $$
 update public.live_payment_attempts set allocation_state='unknown' where attempt_id=p_id and allocation_state='allocating'
$$;
create function public.sdb_live_reconcilable(p_limit integer,p_share uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(public.sdb_live_json(attempt_id) order by last_checked_at,attempt_id),'[]'::jsonb)
 from (select attempt_id,last_checked_at from public.live_payment_attempts where quote is not null and (p_share is null or share_id=p_share) order by last_checked_at,attempt_id limit greatest(1,least(p_limit,100))) l
$$;
create function public.sdb_record_live_settlement(p_id uuid,p_settlement jsonb,p_checked timestamptz) returns void
language plpgsql security invoker set search_path='' as $$
declare l public.live_payment_attempts; a public.payment_attempts; observed timestamptz; next_status text; next_state text;
begin
 perform 1 from public.shares where id=(select share_id from public.payment_attempts where id=p_id) for update;
 select * into l from public.live_payment_attempts where attempt_id=p_id for update;
 if not found or l.quote is null then return; end if;
 update public.live_payment_attempts set last_checked_at=greatest(last_checked_at,p_checked) where attempt_id=p_id;
 if p_settlement is null then return; end if;
 observed:=(p_settlement->>'updatedAt')::timestamptz;
 if observed is null or (l.settlement_updated_at is not null and observed<=l.settlement_updated_at) then return; end if;
 select * into a from public.payment_attempts where id=p_id and mode='live';
 next_state:=p_settlement->>'state';
 if next_state not in ('pending','paid','refunded','failed','review') then raise exception 'Invalid state'; end if;
 next_status:=case when next_state='review' then a.status when next_state='pending' then case when a.expires_at<=p_checked and not l.deposit_observed and p_settlement->>'providerStatus' not in ('KNOWN_DEPOSIT_TX','INCOMPLETE_DEPOSIT','PROCESSING') then 'expired' else 'pending' end else next_state end;
 -- Terminal results cannot be overwritten by older/in-flight states. Refunds can reverse paid, and late delivery can follow failure/expiry.
 if (a.status in ('paid','refunded') and next_status in ('pending','expired','failed'))
 or (a.status='refunded' and next_status='paid') then next_status:=a.status; next_state:='review'; end if;
 update public.payment_attempts set status=next_status where id=p_id;
 update public.live_payment_attempts set settlement_updated_at=observed,provider_status=p_settlement->>'providerStatus',settlement_state=p_settlement->>'state',
 deposit_observed=deposit_observed or p_settlement->>'providerStatus' in ('KNOWN_DEPOSIT_TX','INCOMPLETE_DEPOSIT','PROCESSING','SUCCESS'),
 allocation_state=case when next_state='review' then case when l.allocation_state='terminal' then 'terminal' else 'review' end when next_state in ('paid','refunded','failed') or l.allocation_state='terminal' then 'terminal' else 'ready' end
 where attempt_id=p_id;
end $$;
create function public.sdb_prepare_confidential(p_id uuid,p_signer text,p_intent jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare l public.live_payment_attempts;
begin
 perform 1 from public.shares where id=(select share_id from public.payment_attempts where id=p_id) for update;
 select * into l from public.live_payment_attempts where attempt_id=p_id for update;
 if not found or l.quote is null or not exists(select 1 from public.payment_attempts where id=p_id and mode='live' and method='confidential' and status='pending') then raise sqlstate 'PT409' using message='No signable payment'; end if;
 if l.signer_account is not null then
  if l.signer_account<>p_signer then raise sqlstate 'PT409' using message='Signer changed'; end if;
  return public.sdb_live_json(p_id);
 end if;
 update public.live_payment_attempts set signer_account=p_signer,signed_intent=p_intent,submission_state='prepared' where attempt_id=p_id;
 return public.sdb_live_json(p_id);
end $$;
create function public.sdb_reserve_confidential_submit(p_id uuid,p_now timestamptz) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare acquired boolean:=false;
begin
 perform 1 from public.shares where id=(select share_id from public.payment_attempts where id=p_id) for update;
 update public.live_payment_attempts set submission_state='submitting' where attempt_id=p_id and submission_state='prepared' and signed_intent is not null
 and allocation_state='ready' and not deposit_observed and (provider_status is null or provider_status='PENDING_DEPOSIT')
 and exists(select 1 from public.payment_attempts where id=p_id and method='confidential' and mode='live' and status='pending' and expires_at>p_now)
 and not exists(select 1 from public.payment_attempts a join public.live_payment_attempts l on a.share_id=l.share_id where l.attempt_id=p_id and (a.status='paid' or (a.id<>l.attempt_id and a.status='pending')));
 acquired:=found;
 if public.sdb_live_json(p_id) is null then raise sqlstate 'PT409' using message='No payment'; end if;
 return jsonb_build_object('attempt',public.sdb_live_json(p_id),'acquired',acquired);
end $$;
create function public.sdb_finish_confidential_submit(p_id uuid,p_state text,p_hash text default null) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if p_state not in ('accepted','unknown') then raise exception 'Invalid submit state'; end if;
 update public.live_payment_attempts set submission_state=p_state,submission_hash=p_hash where attempt_id=p_id and submission_state='submitting';
end $$;
revoke all on function public.sdb_prepare_confidential(uuid,text,jsonb),public.sdb_reserve_confidential_submit(uuid,timestamptz),public.sdb_finish_confidential_submit(uuid,text,text) from public,anon,authenticated;
grant execute on function public.sdb_prepare_confidential(uuid,text,jsonb),public.sdb_reserve_confidential_submit(uuid,timestamptz),public.sdb_finish_confidential_submit(uuid,text,text) to service_role;
revoke all on function public.sdb_live_json(uuid),public.sdb_live_read(uuid),public.sdb_reserve_live(jsonb,text),public.sdb_save_live_quote(uuid,jsonb,timestamptz),public.sdb_live_unknown(uuid),public.sdb_live_reconcilable(integer,uuid),public.sdb_record_live_settlement(uuid,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.sdb_live_json(uuid),public.sdb_live_read(uuid),public.sdb_reserve_live(jsonb,text),public.sdb_save_live_quote(uuid,jsonb,timestamptz),public.sdb_live_unknown(uuid),public.sdb_live_reconcilable(integer,uuid),public.sdb_record_live_settlement(uuid,jsonb,timestamptz) to service_role;
notify pgrst,'reload schema';
commit;
