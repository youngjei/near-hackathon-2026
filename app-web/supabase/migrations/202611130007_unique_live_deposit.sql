-- Refuse ambiguous fundable instructions, including historical attempts.
-- Migration fails if existing saved quotes collide; investigate before applying.
CREATE UNIQUE INDEX live_deposit_identity ON public.live_payment_attempts (
 (quote->'quote'->>'depositAddress'),
 (COALESCE(quote->'quote'->>'depositMemo', ''))
) WHERE quote IS NOT NULL AND quote->'quote'->>'depositAddress' IS NOT NULL;
