-- Private provider payloads are kept outside browser-safe attempt rows.
CREATE TABLE live_payment_attempts (
 attempt_id text PRIMARY KEY NOT NULL REFERENCES payment_attempts(id),
 share_id text NOT NULL REFERENCES shares(id),
 route_fingerprint text NOT NULL,
 allocation_state text NOT NULL CHECK(allocation_state IN ('allocating','ready','unknown','review','terminal')),
 quote_json text,
 settlement_updated_at integer,
 signer_account text,
 signed_intent_json text,
 submission_state text CHECK(submission_state IS NULL OR submission_state IN ('prepared','submitting','accepted','unknown')),
 submission_hash text,
 provider_status text,
 deposit_observed integer NOT NULL DEFAULT 0,
 settlement_state text,
 last_checked_at integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX live_active_share ON live_payment_attempts(share_id)
 WHERE allocation_state IN ('allocating','ready','unknown','review');
CREATE INDEX live_reconcile_order ON live_payment_attempts(last_checked_at);
