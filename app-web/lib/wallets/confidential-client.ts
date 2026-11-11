'use client';
import type {NearConnector, NearWalletBase} from '@hot-labs/near-connect';
import type {ConfidentialIntent} from '../providers/intents';
let connector: NearConnector | undefined;
let wallet: NearWalletBase | undefined;
let accountId: string | undefined;

// A connector is a wallet selection, never a new confidential account.
export async function connectConfidentialWallet(): Promise<{accountId:string}> {
  const {NearConnector}=await import('@hot-labs/near-connect');
  connector ??= new NearConnector({network:'mainnet',features:{signMessage:true},autoConnect:false});
  wallet=await connector.connect();
  const accounts=await wallet.getAccounts({network:'mainnet'});
  if (accounts.length !== 1 || !accounts[0].accountId) {
    wallet=undefined; accountId=undefined;
    throw new Error('Select one NEAR wallet account to continue.');
  }
  accountId=accounts[0].accountId;
  return {accountId};
}
export async function signConfidentialIntent(intent: ConfidentialIntent, expectedAccount: string) {
  if (!wallet || !accountId || accountId !== expectedAccount) throw new Error('Reconnect the same wallet account.');
  const accounts=await wallet.getAccounts({network:'mainnet'});
  if (!accounts.some(a=>a.accountId===accountId)) throw new Error('The connected wallet account changed.');
  if (intent.standard!=='nep413' || intent.payload.recipient!=='intents.far' || !/^[A-Za-z0-9+/]{43}=$/.test(intent.payload.nonce)) throw new Error('The payment request is invalid.');
  const nonce=Uint8Array.from(atob(intent.payload.nonce),c=>c.charCodeAt(0));
  if(nonce.length!==32) throw new Error('The payment request is invalid.');
  const signed=await wallet.signMessage({message:intent.payload.message,recipient:intent.payload.recipient,nonce,signerId:accountId,network:'mainnet'});
  if (signed.accountId!==accountId || !signed.publicKey || !signed.signature) throw new Error('The wallet signed with a different account.');
  return {accountId:signed.accountId,publicKey:signed.publicKey,signature:signed.signature};
}
export async function disconnectConfidentialWallet() {
  if(connector && wallet) await connector.disconnect(wallet);
  wallet=undefined;accountId=undefined;
}
