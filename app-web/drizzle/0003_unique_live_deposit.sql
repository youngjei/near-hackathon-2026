-- Refuse ambiguous fundable instructions, including historical attempts.
-- Migration fails if existing saved quotes collide; investigate before applying.
CREATE UNIQUE INDEX live_deposit_identity ON live_payment_attempts (
 json_extract(quote_json, '$.quote.depositAddress'),
 COALESCE(json_extract(quote_json, '$.quote.depositMemo'), '')
) WHERE quote_json IS NOT NULL AND json_extract(quote_json, '$.quote.depositAddress') IS NOT NULL;
