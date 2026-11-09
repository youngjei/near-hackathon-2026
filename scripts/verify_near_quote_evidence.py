"""Verify saved quote signatures using the linked official SDK field projection."""
import json,hashlib,pathlib
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
A='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
def dec(s):
 s=s.removeprefix('ed25519:');n=0
 for c in s:n=n*58+A.index(c)
 return bytes(len(s)-len(s.lstrip('1')))+n.to_bytes((n.bit_length()+7)//8,'big')
def enc(b):
 n=int.from_bytes(b,'big');s=''
 while n:n,r=divmod(n,58);s=A[r]+s
 return '1'*(len(b)-len(b.lstrip(b'\0')))+s
key=Ed25519PublicKey.from_public_bytes(dec('reYaWhvwu8Jzo3WUM3zhn6VrhuMEF4eADL17qtRVifc'))
base=pathlib.Path(__file__).resolve().parents[1]/'docs/technical/evidence'
records=json.loads((base/'probe-results.json').read_text())
results=[]
for name in ['dry-external-public','unfunded-public','unfunded-public-status']:
 r=records[name]['response'];r=r.get('quoteResponse',r)
 req=r['quoteRequest'];q=r['quote']
 d={k:req[k] for k in ['dry','swapType','slippageTolerance','originAsset','depositType','destinationAsset','amount','refundTo','refundType','recipient','recipientType','deadline'] if k in req}
 d.update({k:req[k] for k in ['quoteWaitingTimeMs','referral','virtualChainRecipient','virtualChainRefundRecipient','customRecipientMsg'] if req.get(k)})
 d.update({k:q[k] for k in ['amountIn','amountInFormatted','amountInUsd','minAmountIn','amountOut','amountOutFormatted','amountOutUsd','minAmountOut'] if k in q})
 if not req['dry']:d.update({k:q[k] for k in ['depositAddress','depositMemo','deadline','timeWhenInactive','timeEstimate','refundFee','withdrawFee'] if q.get(k)})
 d['timestamp']=r['timestamp']
 message=enc(hashlib.sha256(json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).digest()).encode()
 try:key.verify(dec(r['signature']),message);valid=True
 except Exception:valid=False
 results.append({'name':name,'signature_valid':valid})
print(json.dumps(results,indent=2))
if not all(r['signature_valid'] for r in results): raise SystemExit(1)
