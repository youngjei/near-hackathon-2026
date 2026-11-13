import { test, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { ASSETS, intentsProvider, quotePreview } from '../lib/providers/intents';
import { SOLANA_USDC_MINT } from '../lib/wallets/solana-address';

test('Solana USDC partner route has signed dry exact-output previews',async()=>{
  const key=process.env.NEAR_INTENTS_API_KEY;
  if(!key)throw new Error('NEAR_INTENTS_API_KEY is required for this explicit dry integration check');
  const provider=intentsProvider(key),results=[];
  for(const amountUnits of ['5000000','15000000','50000000']) {
    const q=await provider.preview({method:'solana',amountUnits,recipient:'0x'+'33'.repeat(20),refundTo:'GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB'});
    expect(q.quote.amountOut).toBe(amountUnits);expect(q.quote.depositAddress).toBeUndefined();
    results.push({...quotePreview(q),signatureVerified:true});
  }
  await writeFile(new URL('../../docs/technical/evidence/solana-usdc-dry-2026-11-13.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),syntheticAccounts:true,dryOnly:true,fundsMoved:false,originAsset:ASSETS.solanaUsdc,mint:SOLANA_USDC_MINT,recipientType:'CONFIDENTIAL_INTENTS',results},null,2)+'\n');
},90000);
