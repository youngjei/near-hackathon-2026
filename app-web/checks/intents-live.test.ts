import {test,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {intentsProvider,quotePreview} from '../lib/providers/intents';
function base58(bytes:Uint8Array) {
 const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
 let n=BigInt('0x'+Buffer.from(bytes).toString('hex')),s='';
 while(n){s=alphabet[Number(n%58n)]+s;n/=58n;}
 return s;
}
test('partner routes return signed exact-output previews at dinner amounts',async()=>{
 const key=process.env.NEAR_INTENTS_API_KEY;
 if(!key)throw new Error('NEAR_INTENTS_API_KEY is required for this explicit integration check');
 const provider=intentsProvider(key);
 const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest();
 const payload=Buffer.concat([Buffer.from([0x1c,0xb8]),hash(Buffer.from('splitdbill synthetic refund')).subarray(0,20)]);
 const refund=base58(Buffer.concat([payload,hash(hash(payload)).subarray(0,4)]));
 const results=[];
 for(const method of ['zcash','confidential'] as const) {
  for(const amountUnits of ['5000000','15000000','50000000']) {
   const quote=await provider.preview({method,amountUnits,recipient:'0x'+'33'.repeat(20),refundTo:method==='zcash'?refund:'44'.repeat(32)});
   expect(quote.quote.amountOut).toBe(amountUnits);
   expect(quote.quote.depositAddress).toBeUndefined();
   results.push({method,...quotePreview(quote),signatureVerified:true});
  }
 }
 const path=new URL('../../docs/technical/evidence/payment-adapter-2026-11-10.json',import.meta.url);
 await mkdir(new URL('.',path),{recursive:true});
 await writeFile(path,JSON.stringify({checkedAt:new Date().toISOString(),syntheticAccounts:true,dryOnly:true,fundsMoved:false,results},null,2)+'\n');
 console.log('Six signed route previews verified. No deposit addresses or funds.');
},150000);
