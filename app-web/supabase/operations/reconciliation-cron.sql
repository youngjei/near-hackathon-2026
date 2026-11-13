-- Run once in the project's SQL editor after verifying the Vercel deployment.
-- First store the existing Vercel CRON_SECRET in Vault using the dashboard:
-- name: splitdbill_reconcile_token. Never paste the value into this SQL.
-- This schedules status reads, not wallet transfers or signatures.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'splitdbill_reconcile_token') then
    raise exception 'Store the reconciliation token in Vault first';
  end if;
end $$;

select cron.schedule(
  'splitdbill-reconcile',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://split-d-bill.vercel.app/api/reconcile',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'splitdbill_reconcile_token')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);

select jobid, jobname, schedule, active from cron.job where jobname = 'splitdbill-reconcile';
-- Pause when owner testing is finished:
-- select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'splitdbill-reconcile'), active := false);
