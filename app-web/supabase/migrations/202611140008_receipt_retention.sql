-- Service-only retention operations. Delete the object before metadata so
-- failures leave the record available for retry. Bill and payment data survive.
create function public.sdb_expired_receipts(p_cutoff timestamptz, p_limit integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) from (
    select id, object_key from public.receipts where created_at <= p_cutoff
    order by created_at, id limit greatest(1, least(100, p_limit))
  ) r;
$$;
create function public.sdb_delete_expired_receipt(p_id uuid, p_key text, p_cutoff timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.receipts where id=p_id and object_key=p_key and created_at<=p_cutoff for update;
  if found then
    update public.bills set receipt_id=null where receipt_id=p_id;
    delete from public.receipts where id=p_id and object_key=p_key and created_at<=p_cutoff;
  end if;
end;
$$;
revoke execute on function public.sdb_expired_receipts(timestamptz,integer), public.sdb_delete_expired_receipt(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.sdb_expired_receipts(timestamptz,integer), public.sdb_delete_expired_receipt(uuid,text,timestamptz) to service_role;
