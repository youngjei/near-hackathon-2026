import sys,json,hashlib,re
from pathlib import Path
from datetime import datetime,timedelta,timezone
sys.path.insert(0,str(Path('scripts').resolve()))
from probe_near_intents import http,b58
values={}
for line in Path('app-web/.env.local').read_text().splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1);values[k.strip()]=v.strip().strip('\"\'')
key=values.get('NEAR_INTENTS_API_KEY','')
if not key or any(x.isspace() for x in key):raise SystemExit('Key missing or incorrectly formatted.')
base='https://1click.chaindefuser.com'
results={'checked_at':datetime.now(timezone.utc).isoformat(),'dry_only':True,'funds_moved':False,'probes':[]}
def probe(name,payload,authenticated=True):
 if payload.get('dry') is not True:raise RuntimeError('Only dry quotes permitted.')
 status,response=http(base+'/v0/quote',payload,{'X-API-Key':key} if authenticated else {})
 safe={'name':name,'http_status':status,'authenticated':authenticated}
 if isinstance(response,dict):
  for k in ['message','error','correlationId']:
   if k in response:
    val=str(response[k]).replace(key,'[redacted]')
    safe[k]=re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+','[redacted]',val)[:700]
  q=response.get('quote',{})
  safe['quote']={k:q[k] for k in ['amountInFormatted','amountOutFormatted','timeEstimate','refundFee','withdrawFee'] if k in q}
  safe['deposit_address_generated']=bool(q.get('depositAddress'))
 results['probes'].append(safe)
 Path('work/partner-check/results.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps(safe),flush=True)
 return status
status,tokens=http(base+'/v0/tokens')
if status!=200:raise SystemExit('Asset catalogue unavailable.')
def asset(symbol,chain):return next(t['assetId'] for t in tokens if t['symbol']==symbol and t['blockchain']==chain)
zec=asset('ZEC','zec');usdc=asset('USDC','near')
results['assets']={'zec':zec,'usdc':usdc}
common={'dry':True,'swapType':'EXACT_OUTPUT','slippageTolerance':100,'amount':'15000000','deadline':(datetime.now(timezone.utc)+timedelta(minutes=15)).isoformat()}
control={**common,'originAsset':asset('USDC','base'),'depositType':'ORIGIN_CHAIN','destinationAsset':asset('USDC','arb'),'recipientType':'DESTINATION_CHAIN','recipient':'0x2222222222222222222222222222222222222222','refundType':'ORIGIN_CHAIN','refundTo':'0x1111111111111111111111111111111111111111','confidentiality':'public'}
probe('partner-auth-control',control)
payload=b'\x1c\xb8'+hashlib.sha256(b'splitdbill dry quote synthetic refund').digest()[:20]
refund=b58(payload+hashlib.sha256(hashlib.sha256(payload).digest()).digest()[:4])
private={**common,'originAsset':zec,'depositType':'ORIGIN_CHAIN','destinationAsset':usdc,'recipientType':'CONFIDENTIAL_INTENTS','recipient':'33'*32,'refundType':'ORIGIN_CHAIN','refundTo':refund,'confidentiality':'basic'}
probe('zec-to-confidential-usdc-basic',private)
probe('zec-to-confidential-usdc-public-parameter',{**private,'confidentiality':'public'})
probe('confidential-usdc-to-confidential-usdc',{**private,'originAsset':usdc,'depositType':'CONFIDENTIAL_INTENTS','refundType':'CONFIDENTIAL_INTENTS','refundTo':'44'*32})
print('Finished: synthetic identifiers, dry quotes only. No wallet access or payment submission.')
