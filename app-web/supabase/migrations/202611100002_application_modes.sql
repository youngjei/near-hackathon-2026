-- Support real application records and isolated test records.
-- Existing test data stays test data. The server must explicitly select a mode.
-- Wallet authorization and provider-verified settlement are application requirements.
alter table public.bills drop constraint bills_mode_check;
alter table public.bills alter column mode drop default;
alter table public.bills add constraint bills_mode_check check (mode in ('live', 'demo'));

alter table public.payment_attempts drop constraint payment_attempts_mode_check;
alter table public.payment_attempts alter column mode drop default;
alter table public.payment_attempts add constraint payment_attempts_mode_check check (mode in ('live', 'demo'));
