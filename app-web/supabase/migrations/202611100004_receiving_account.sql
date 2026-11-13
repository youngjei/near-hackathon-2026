-- Store a normalized internal receiving account. Existing bills stay readable.
-- No browser grants or changes to payment execution.
begin;
alter table public.bills add column recipient_account text
 check (recipient_account is null or (
   char_length(recipient_account) between 2 and 64
   and (left(recipient_account,2) <> '0x' or recipient_account ~ '^0x[0-9a-f]{40}$')
   and recipient_account ~ '^(0x[0-9a-f]{40}|[a-z0-9]+([._-][a-z0-9]+)*)$'
 ));

create function public.sdb_keep_bill_recipient() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if new.recipient_account is distinct from old.recipient_account then
   raise exception 'The receiving account is fixed for this bill';
 end if;
 return new;
end $$;
revoke all on function public.sdb_keep_bill_recipient() from public, anon, authenticated;
create trigger sdb_bill_recipient_immutable
 before update of recipient_account on public.bills
 for each row execute function public.sdb_keep_bill_recipient();
create or replace function public.sdb_create_bill(p_bill jsonb, p_shares jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare b public.bills; s public.shares; new_id uuid; amount_sum bigint;
begin
 b := jsonb_populate_record(null::public.bills,p_bill);
 if jsonb_array_length(p_shares) <> b.diners-1 then raise exception 'Invalid share count'; end if;
 insert into public.bills select b.* on conflict(owner_hash,create_key) do nothing returning id into new_id;
 if new_id is null then
   select * into b from public.bills where owner_hash=b.owner_hash and create_key=b.create_key;
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

notify pgrst, 'reload schema';
commit;
