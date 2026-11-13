import type { LiveAttempt, LiveStore } from './store';
import { HttpError } from './security';

type Row = Omit<LiveAttempt, 'quote' | 'signed_intent'> & { quote_json: string | null; signed_intent_json: string | null };
const select = `SELECT a.*,l.route_fingerprint,l.allocation_state,l.quote_json,l.settlement_updated_at,l.last_checked_at,l.provider_status,l.deposit_observed,l.settlement_state,l.signer_account,l.signed_intent_json,l.submission_state,l.submission_hash FROM payment_attempts a JOIN live_payment_attempts l ON l.attempt_id=a.id`;
function normalize(row: Row): LiveAttempt {
  const { quote_json, signed_intent_json, ...rest } = row;
  return { ...rest, deposit_observed:!!rest.deposit_observed, quote: quote_json ? JSON.parse(quote_json) : null, signed_intent: signed_intent_json ? JSON.parse(signed_intent_json) : null };
}
export function d1LiveStore(db: D1Database): LiveStore {
  const stmt = (sql: string, args: unknown[] = []) => db.prepare(sql).bind(...args);
  async function read(id: string) {
    const row = await stmt(select + ' WHERE a.id=?', [id]).first<Row>();
    return row ? normalize(row) : null;
  }
  return {
    liveAttempt: read,
    async reserveLiveAttempt({ attempt: a, route_fingerprint }) {
      // A D1 batch is one atomic transaction. Only the winning insertion owns allocation.
      await db.batch([
        stmt(`INSERT OR IGNORE INTO payment_attempts(id,share_id,request_key,method,status,created_at,expires_at,mode)
          SELECT ?,?,?,?,'pending',?,?,'live'
          WHERE EXISTS(SELECT 1 FROM shares s JOIN bills b ON b.id=s.bill_id WHERE s.id=? AND b.mode='live' AND b.recipient_account IS NOT NULL)
          AND NOT EXISTS(SELECT 1 FROM payment_attempts WHERE share_id=? AND status IN ('paid','pending'))
          AND NOT EXISTS(SELECT 1 FROM live_payment_attempts WHERE share_id=? AND (quote_json IS NOT NULL OR allocation_state IN ('allocating','ready','unknown','review')))`,
          [a.id,a.share_id,a.request_key,a.method,a.created_at,a.expires_at,a.share_id,a.share_id,a.share_id]),
        stmt(`INSERT OR IGNORE INTO live_payment_attempts(attempt_id,share_id,route_fingerprint,allocation_state)
          SELECT id,share_id,?,'allocating' FROM payment_attempts WHERE id=? AND mode='live'`, [route_fingerprint,a.id]),
      ]);
      const row = await stmt(select + ' WHERE a.share_id=? AND a.request_key=?', [a.share_id,a.request_key]).first<Row>();
      if (!row || row.method!==a.method || row.route_fingerprint!==route_fingerprint)
        throw new HttpError(409, 'A payment request already exists or its details changed. Refresh this page.');
      return { attempt: normalize(row), acquired: row.id===a.id };
    },
    async saveLiveQuote(id, quote) {
      const expires = Math.min(Date.parse(String(quote.quoteRequest.deadline)),Date.parse(quote.quote.deadline!),Date.parse(quote.quote.timeWhenInactive!));
      await db.batch([
        stmt(`UPDATE payment_attempts SET expires_at=? WHERE id=? AND mode='live' AND EXISTS(SELECT 1 FROM live_payment_attempts WHERE attempt_id=? AND allocation_state='allocating')`,[expires,id,id]),
        stmt(`UPDATE live_payment_attempts SET quote_json=?,allocation_state='ready' WHERE attempt_id=? AND allocation_state='allocating'`,[JSON.stringify(quote),id]),
      ]);
    },
    async markLiveAllocationUnknown(id) {
      await stmt(`UPDATE live_payment_attempts SET allocation_state='unknown' WHERE attempt_id=? AND allocation_state='allocating'`,[id]).run();
    },
    async reconcilableLiveAttempts(limit, shareId) {
      const rows = await stmt(select + ` WHERE l.quote_json IS NOT NULL${shareId ? ' AND a.share_id=?' : ''} ORDER BY l.last_checked_at,a.id LIMIT ?`, [...(shareId ? [shareId] : []), Math.max(1,Math.min(100,limit))]).all<Row>();
      return rows.results.map(normalize);
    },
    async recordLiveSettlement(id, settlement, checkedAt) {
      if (!settlement) {
        await stmt('UPDATE live_payment_attempts SET last_checked_at=MAX(last_checked_at,?) WHERE attempt_id=?',[checkedAt,id]).run();
        return;
      }
      const state = settlement.state;
      const observed = Date.parse(settlement.updatedAt);
      if (!Number.isFinite(observed) || !['pending','paid','refunded','failed','review'].includes(state)) throw new Error('Invalid settlement');
      const next = state==='pending' ? null : state;
      await db.batch([
        stmt(`UPDATE payment_attempts SET status=CASE WHEN ?='review' THEN status WHEN ?='pending' THEN CASE WHEN expires_at<=? AND (SELECT deposit_observed FROM live_payment_attempts WHERE attempt_id=payment_attempts.id)=0 AND ? NOT IN ('KNOWN_DEPOSIT_TX','INCOMPLETE_DEPOSIT','PROCESSING') THEN 'expired' ELSE 'pending' END ELSE ? END
          WHERE id=? AND mode='live' AND NOT(status IN ('paid','refunded') AND ? IN ('pending','failed')) AND NOT(status='refunded' AND ?='paid')
          AND EXISTS(SELECT 1 FROM live_payment_attempts WHERE attempt_id=? AND quote_json IS NOT NULL AND (settlement_updated_at IS NULL OR settlement_updated_at<?))`,[state,state,checkedAt,settlement.providerStatus,next,id,state,state,id,observed]),
        stmt(`UPDATE live_payment_attempts SET settlement_updated_at=?,provider_status=?,settlement_state=?,last_checked_at=MAX(last_checked_at,?),deposit_observed=deposit_observed OR ? IN ('KNOWN_DEPOSIT_TX','INCOMPLETE_DEPOSIT','PROCESSING','SUCCESS'),allocation_state=CASE
          WHEN ?='review' OR EXISTS(SELECT 1 FROM payment_attempts WHERE id=? AND ((status IN ('paid','refunded') AND ? IN ('pending','failed')) OR (status='refunded' AND ?='paid'))) THEN CASE WHEN allocation_state='terminal' THEN 'terminal' ELSE 'review' END
          WHEN ? IN ('paid','refunded','failed') OR allocation_state='terminal' THEN 'terminal' ELSE 'ready' END
          WHERE attempt_id=? AND quote_json IS NOT NULL AND (settlement_updated_at IS NULL OR settlement_updated_at<?)`,[observed,settlement.providerStatus,state,checkedAt,settlement.providerStatus,state,id,state,state,state,id,observed]),
        stmt('UPDATE live_payment_attempts SET last_checked_at=MAX(last_checked_at,?) WHERE attempt_id=?',[checkedAt,id]),
      ]);
    },
    async prepareConfidentialIntent(id, signer, intent) {
      await stmt(`UPDATE live_payment_attempts SET signer_account=?,signed_intent_json=?,submission_state='prepared' WHERE attempt_id=? AND signer_account IS NULL AND quote_json IS NOT NULL
        AND EXISTS(SELECT 1 FROM payment_attempts WHERE id=? AND mode='live' AND method='confidential' AND status='pending')`,[signer,JSON.stringify(intent),id,id]).run();
      const a=await read(id);
      if (!a || a.signer_account!==signer || !a.signed_intent) throw new HttpError(409,'This payment cannot be signed or its signer changed.');
      return a;
    },
    async reserveConfidentialSubmit(id, now) {
      const result=await stmt(`UPDATE live_payment_attempts SET submission_state='submitting' WHERE attempt_id=? AND submission_state='prepared' AND signed_intent_json IS NOT NULL
        AND allocation_state='ready' AND deposit_observed=0 AND (provider_status IS NULL OR provider_status='PENDING_DEPOSIT')
        AND EXISTS(SELECT 1 FROM payment_attempts WHERE id=? AND method='confidential' AND mode='live' AND status='pending' AND expires_at>?)
        AND NOT EXISTS(SELECT 1 FROM payment_attempts a JOIN live_payment_attempts l ON a.share_id=l.share_id WHERE l.attempt_id=? AND (a.status='paid' OR (a.id<>l.attempt_id AND a.status='pending'))) RETURNING attempt_id`,[id,id,now,id]).first<{attempt_id:string}>();
      const a=await read(id);
      if (!a) throw new HttpError(409,'Payment not found.');
      return {attempt:a,acquired:!!result};
    },
    async finishConfidentialSubmit(id, state, intentHash) {
      await stmt(`UPDATE live_payment_attempts SET submission_state=?,submission_hash=? WHERE attempt_id=? AND submission_state='submitting'`,[state,intentHash??null,id]).run();
    },
  };
}
