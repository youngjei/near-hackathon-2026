-- Extend the payment method allowlist only.
-- Existing quotes, capabilities, transactions, RLS and grants are preserved.
-- D1 stores method as unconstrained text and needs no corresponding migration.
begin;
alter table public.payment_attempts drop constraint payment_attempts_method_check;
alter table public.payment_attempts add constraint payment_attempts_method_check
 check(method in ('zcash','confidential','solana'));
commit;
