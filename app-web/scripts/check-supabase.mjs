// Run: node --env-file=.env.local scripts/check-supabase.mjs
// Only reports configuration/access status. No record contents or secrets.
import { createClient } from '@supabase/supabase-js';
const {SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY} = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase configuration missing');
const client = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let failed = false;
for (const table of ['bills','shares','payment_attempts','receipts','rate_limits']) {
  const {status,error} = await client.from(table).select('*').limit(0).abortSignal(AbortSignal.timeout(10000));
  console.log(`${table}: ${status}`); failed ||= !!error;
}
const rpc = await client.rpc('sdb_read',{p_kind:'shares',p_id:crypto.randomUUID(),p_key:null}).abortSignal(AbortSignal.timeout(10000));
console.log(`server functions: ${rpc.status}`); failed ||= !!rpc.error;
const bucket = await client.storage.getBucket('receipts');
const isPrivate = !bucket.error && bucket.data.public === false;
console.log(`receipt bucket private: ${isPrivate}`); failed ||= !isPrivate;
process.exitCode = failed ? 1 : 0;
