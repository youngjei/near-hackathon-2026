import { isSolanaWalletAddress } from "../wallets/solana-address";
import { verifyQuoteSignature, type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { z } from "zod";

export const INTENTS_API = "https://1click.chaindefuser.com/v0";
export const ASSETS = {
  zec: "nep141:zec.omft.near",
  solanaUsdc: "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near",
  usdc: "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
} as const;
const units = z.string().regex(/^[1-9]\d{0,29}$/);
const account = z.string().regex(/^(?:0x[0-9a-f]{40}|[a-z0-9]+(?:[._-][a-z0-9]+)*)$/).min(2).max(64);
export type PaymentRoute = {
  method: "zcash" | "confidential" | "solana";
  recipient: string;
  refundTo: string;
  amountUnits: string;
};
export type PaymentQuoteRequest = ReturnType<typeof paymentQuoteRequest>;
export class IntentsError extends Error {
  constructor(public code: "unavailable" | "invalid_quote" | "unsupported_refund" | "invalid_input", message: string) {
    super(message);
  }
}
function invalidQuote(): never {
  throw new IntentsError("invalid_quote", "The payment quote could not be verified. Request a new quote.");
}

// Check the actual Base58Check payload, not just a t1/t3-shaped string.
export async function isTransparentZcashAddress(address: string): Promise<boolean> {
  if (!/^t[13][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return false;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const c of address) n = n * 58n + BigInt(alphabet.indexOf(c));
  const hex = n.toString(16).padStart(52, "0");
  if (hex.length !== 52) return false;
  const bytes = Uint8Array.from(hex.match(/../g)!, x => parseInt(x, 16));
  if (bytes[0] !== 0x1c || ![0xb8, 0xbd].includes(bytes[1])) return false;
  const first = await crypto.subtle.digest("SHA-256", bytes.slice(0, 22));
  const second = new Uint8Array(await crypto.subtle.digest("SHA-256", first));
  return bytes.slice(22).every((b, i) => b === second[i]);
}

export function paymentQuoteRequest(route: PaymentRoute, dry = true, now = Date.now()) {
  const parsed = z.object({
    method: z.enum(["zcash", "confidential", "solana"]), recipient: account,
    refundTo: z.string().min(2).max(256), amountUnits: units,
  }).safeParse(route);
  if (!parsed.success || BigInt(route.amountUnits) % 10000n !== 0n)
    throw new IntentsError("invalid_input", "Use a valid receiving account and a share rounded to USDC cents.");
  if (route.method === "confidential" && !account.safeParse(route.refundTo).success)
    throw new IntentsError("invalid_input", "Use the payer's Confidential Intents account for refunds.");
  if (route.method === "solana" && !isSolanaWalletAddress(route.refundTo))
    throw new IntentsError("unsupported_refund", "Use a valid Solana wallet address for refunds, not a token account or exchange deposit address.");
  return {
    dry, swapType: "EXACT_OUTPUT" as const, slippageTolerance: 100,
    originAsset: route.method === "zcash" ? ASSETS.zec : route.method === "solana" ? ASSETS.solanaUsdc : ASSETS.usdc,
    destinationAsset: ASSETS.usdc,
    depositType: route.method !== "confidential" ? "ORIGIN_CHAIN" as const : "CONFIDENTIAL_INTENTS" as const,
    recipientType: "CONFIDENTIAL_INTENTS" as const,
    refundType: route.method !== "confidential" ? "ORIGIN_CHAIN" as const : "CONFIDENTIAL_INTENTS" as const,
    amount: route.amountUnits, recipient: route.recipient, refundTo: route.refundTo,
    confidentiality: "basic" as const,
    deadline: new Date(now + 15 * 60000).toISOString(),
  };
}

const quoteSchema = z.object({
  correlationId: z.string().optional(), timestamp: z.string().datetime(), signature: z.string(),
  quoteRequest: z.record(z.string(), z.unknown()),
  quote: z.object({
    amountIn: units, amountOut: units, minAmountIn: units, minAmountOut: units,
    amountInFormatted: z.string(), amountInUsd: z.string(),
    amountOutFormatted: z.string(), amountOutUsd: z.string(),
    depositAddress: z.string().optional(), depositMemo: z.string().optional(),
    deadline: z.string().datetime().optional(), timeWhenInactive: z.string().datetime().optional(),
    timeEstimate: z.number().nonnegative().optional(),
  }).passthrough(),
}).passthrough();
export type VerifiedQuote = z.infer<typeof quoteSchema>;
export type SignatureVerifier = (quote: QuoteResponse) => boolean;

export function validatePaymentQuote(
  raw: unknown, expected: PaymentQuoteRequest,
  options: { now?: number; historic?: boolean; verify?: SignatureVerifier } = {},
): VerifiedQuote {
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) invalidQuote();
  const response = parsed.data;
  // The SDK signs a field projection, not all fields (not confidentiality/status).
  // Compare all requested routing/privacy fields independently to our server input.
  for (const [key, value] of Object.entries(expected)) {
    if (response.quoteRequest[key] !== value) invalidQuote();
  }
  const q = response.quote;
  if (q.amountOut !== expected.amount || q.minAmountOut !== expected.amount || BigInt(q.minAmountIn) > BigInt(q.amountIn)) invalidQuote();
  if (expected.dry && (q.depositAddress || q.depositMemo)) invalidQuote();
  if (!expected.dry && (!q.depositAddress || !q.deadline || !q.timeWhenInactive)) invalidQuote();
  if (!options.historic) {
    const now = options.now ?? Date.now();
    const timestamp = Date.parse(response.timestamp);
    if (timestamp > now + 60000 || timestamp < now - 120000) invalidQuote();
    if (!expected.dry && Math.min(Date.parse(q.deadline!), Date.parse(q.timeWhenInactive!)) <= now + 30000) invalidQuote();
  }
  try {
    if (!(options.verify ?? verifyQuoteSignature)(response as unknown as QuoteResponse)) invalidQuote();
  } catch { invalidQuote(); }
  return response;
}

// Browser-safe projection: never return recipient/refund identifiers or raw payloads.
// This is an estimate, not an executable payment request or a fixed fee promise.
export function quotePreview(quote: VerifiedQuote) {
  if (quote.quoteRequest.dry !== true) invalidQuote();
  const decimals = quote.quoteRequest.originAsset === ASSETS.zec ? 8 : 6;
  const n = BigInt(quote.quote.amountIn), scale = 10n ** BigInt(decimals);
  return {
    kind: "estimate" as const,
    inputAsset: decimals === 8 ? "ZEC" as const : "USDC" as const,
    inputAmount: `${n / scale}.${(n % scale).toString().padStart(decimals, "0")}`,
    outputUnits: quote.quote.amountOut, quotedAt: quote.timestamp,
    estimatedSeconds: quote.quote.timeEstimate ?? null,
    // No QR/ZIP-321/deposit address exists for a dry quote.
  };
}

export type Settlement = {
  state: "pending" | "paid" | "refunded" | "failed" | "review";
  providerStatus: string;
  updatedAt: string;
};
export function assessSettlement(raw: unknown, saved: VerifiedQuote, now = Date.now()): Settlement {
  if (saved.quoteRequest.dry !== false) invalidQuote();
  const parsed = z.object({
    status: z.string(), updatedAt: z.string().datetime(), quoteResponse: z.unknown(),
    swapDetails: z.object({amountOut: z.string().regex(/^(?:0|[1-9]\d{0,29})$/).nullish()}).passthrough(),
  }).safeParse(raw);
  if (!parsed.success || Date.parse(parsed.data.updatedAt) > now + 60000) invalidQuote();
  const data = parsed.data;
  // Status responses may omit correlationId and provider-added defaults from
  // quoteRequest. Bind only the original application-controlled fields.
  const requestKeys = ['dry','swapType','slippageTolerance','originAsset','destinationAsset','depositType',
    'recipientType','refundType','amount','recipient','refundTo','confidentiality','deadline'] as const;
  const expected = Object.fromEntries(requestKeys.map(key => [key, saved.quoteRequest[key]])) as PaymentQuoteRequest;
  // The provider currently omits its quoteWaitingTimeMs default in status,
  // although the SDK includes it in the signature. Restore only that known
  // signed default from the independently verified saved quote.
  validatePaymentQuote(saved, expected, {historic:true});
  const incomingRaw = structuredClone(data.quoteResponse);
  const statusObject = z.object({quoteRequest:z.record(z.string(), z.unknown())}).passthrough().safeParse(incomingRaw);
  if (!statusObject.success) invalidQuote();
  const sr = statusObject.data.quoteRequest;
  if (sr.quoteWaitingTimeMs === undefined && saved.quoteRequest.quoteWaitingTimeMs !== undefined)
    sr.quoteWaitingTimeMs = saved.quoteRequest.quoteWaitingTimeMs;
  else if (sr.quoteWaitingTimeMs !== saved.quoteRequest.quoteWaitingTimeMs) invalidQuote();
  const incoming = validatePaymentQuote(statusObject.data, expected, {historic:true});
  if (incoming.signature !== saved.signature || incoming.timestamp !== saved.timestamp ||
      incoming.quote.depositAddress !== saved.quote.depositAddress || incoming.quote.depositMemo !== saved.quote.depositMemo ||
      incoming.quote.amountIn !== saved.quote.amountIn || incoming.quote.amountOut !== saved.quote.amountOut ||
      incoming.quote.minAmountIn !== saved.quote.minAmountIn || incoming.quote.minAmountOut !== saved.quote.minAmountOut ||
      incoming.quote.deadline !== saved.quote.deadline || incoming.quote.timeWhenInactive !== saved.quote.timeWhenInactive) invalidQuote();
  let state: Settlement["state"] = "review";
  if (["PENDING_DEPOSIT", "KNOWN_DEPOSIT_TX", "INCOMPLETE_DEPOSIT", "PROCESSING"].includes(data.status)) state = "pending";
  if (data.status === "FAILED") state = "failed";
  if (data.status === "REFUNDED") state = "refunded";
  // A successful quote is not payment. Require the provider's delivered amount.
  if (data.status === "SUCCESS" && data.swapDetails.amountOut && BigInt(data.swapDetails.amountOut) >= BigInt(saved.quote.amountOut)) state = "paid";
  return {state,providerStatus:data.status,updatedAt:data.updatedAt};
}

export function intentsProvider(partnerKey: string, transport: typeof fetch = fetch) {
  async function request(path: string, body?: unknown) {
    if (!partnerKey) throw new IntentsError("unavailable", "Payment routing is not configured.");
    let response: Response;
    try {
      response = await transport(INTENTS_API + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {"X-API-Key":partnerKey,"Content-Type":"application/json"},
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20000), redirect:"error", cache:"no-store",
      });
      if (!response.ok) throw new Error("Provider unavailable");
      return await response.json() as unknown;
    } catch {
      // Upstream diagnostics may contain account information. Never forward them.
      throw new IntentsError("unavailable", "The payment route is unavailable. Please try again.");
    }
  }
  return {
    async preview(route: PaymentRoute) {
      if (route.method === "zcash" && !await isTransparentZcashAddress(route.refundTo))
        throw new IntentsError("unsupported_refund", "This route requires a valid transparent Zcash refund address (t1 or t3).");
      const expected = paymentQuoteRequest(route);
      return validatePaymentQuote(await request("/quote", expected), expected);
    },
    // Allocates a real, fundable provider instruction. Callers must persist the
    // attempt before this request and treat a timeout as an unknown outcome.
    async allocate(route: PaymentRoute) {
      if (route.method === "zcash" && !await isTransparentZcashAddress(route.refundTo))
        throw new IntentsError("unsupported_refund", "This route requires a valid transparent Zcash refund address (t1 or t3).");
      const expected = paymentQuoteRequest(route, false);
      return validatePaymentQuote(await request("/quote", expected), expected);
    },
    async generateIntent(saved: VerifiedQuote, signer: string) {
      if (saved.quoteRequest.dry !== false || saved.quoteRequest.depositType !== "CONFIDENTIAL_INTENTS" ||
          saved.quoteRequest.refundTo !== signer || !saved.quote.depositAddress) invalidQuote();
      const result = z.object({intent:z.unknown()}).safeParse(await request("/generate-intent", {
        type:"swap_transfer", standard:"nep413", signerId:signer, depositAddress:saved.quote.depositAddress,
      }));
      if (!result.success) invalidQuote();
      return validateConfidentialIntent(result.data.intent,saved,signer);
    },
    // Only use a server-persisted generated payload after atomically reserving
    // submission. A failed/timeout POST has an unknown outcome, not a safe retry.
    async submitIntent(saved: VerifiedQuote, signer: string, stored: ConfidentialIntent, signature: {accountId:string;publicKey:string;signature:string}) {
      const intent=validateConfidentialIntent(stored,saved,signer);
      const proof=await validateConfidentialSignature(intent,signer,signature);
      const result=z.object({intentHash:z.string().min(1).max(256)}).safeParse(await request("/submit-intent",{
        type:"swap_transfer",signedData:{...intent,public_key:proof.publicKey,signature:"ed25519:"+base58Encode(Uint8Array.from(atob(proof.signature),c=>c.charCodeAt(0)))},
      }));
      if (!result.success) invalidQuote();
      return {intentHash:result.data.intentHash};
    },
    async status(saved: VerifiedQuote) {
      if (saved.quoteRequest.dry !== false || !saved.quote.depositAddress) invalidQuote();
      const params = new URLSearchParams({depositAddress:saved.quote.depositAddress});
      if (saved.quote.depositMemo) params.set("depositMemo",saved.quote.depositMemo);
      return assessSettlement(await request("/status?" + params),saved);
    },
  };
}

// 1Click confidential NEP-413 payload: pin the FAR token namespace and allow
// exactly one transfer of the quoted input to this quote's deposit account.
const confidentialTokenPrefix = 'imt:51e8f94d77b5e90dc9852ca6113771e11e8382ce69473a75e313e41665de7cbe:';
const nep413Intent = z.object({
  standard:z.literal('nep413'),
  payload:z.object({message:z.string().max(10000),nonce:z.string(),recipient:z.literal('intents.far')}).strict(),
}).strict();
export type ConfidentialIntent = z.infer<typeof nep413Intent>;
export function validateConfidentialIntent(raw: unknown, saved: VerifiedQuote, signer: string, now = Date.now()): ConfidentialIntent {
  const q = validatePaymentQuote(saved, saved.quoteRequest as PaymentQuoteRequest, {historic:true});
  if (q.quoteRequest.dry !== false || q.quoteRequest.depositType !== 'CONFIDENTIAL_INTENTS' ||
      q.quoteRequest.originAsset !== ASSETS.usdc || q.quoteRequest.refundTo !== signer ||
      !account.safeParse(signer).success || !q.quote.depositAddress || !q.quote.deadline || !q.quote.timeWhenInactive ||
      typeof q.quoteRequest.deadline !== 'string' || !Number.isFinite(Date.parse(q.quoteRequest.deadline)) ||
      Math.min(Date.parse(q.quote.deadline),Date.parse(q.quote.timeWhenInactive),Date.parse(q.quoteRequest.deadline)) <= now) invalidQuote();
  const parsed = nep413Intent.safeParse(raw);
  if (!parsed.success) invalidQuote();
  const p=parsed.data.payload;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(p.nonce)) invalidQuote();
  try { if (atob(p.nonce).length !== 32) invalidQuote(); } catch { invalidQuote(); }
  let message: unknown;
  try { message=JSON.parse(p.message); } catch { invalidQuote(); }
  const transfer = z.object({intent:z.literal('transfer'),receiver_id:z.string(),tokens:z.record(z.string(), units)}).strict();
  const body=z.object({signer_id:z.string(),deadline:z.string().datetime(),intents:z.array(transfer).length(1)}).strict().safeParse(message);
  if (!body.success || body.data.signer_id !== signer || body.data.intents[0].receiver_id !== q.quote.depositAddress ||
      Date.parse(body.data.deadline) <= now || Date.parse(body.data.deadline) > Date.parse(q.quote.deadline)) invalidQuote();
  const tokens=Object.entries(body.data.intents[0].tokens);
  if (tokens.length !== 1 || tokens[0][0] !== confidentialTokenPrefix + ASSETS.usdc || tokens[0][1] !== q.quote.amountIn) invalidQuote();
  return parsed.data;
}

const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(bytes: Uint8Array): string {
  let n=0n; for (const b of bytes) n=(n<<8n)+BigInt(b);
  let result=""; while(n){const rem=Number(n%58n);n/=58n;result=base58Alphabet[rem]+result;}
  for(const b of bytes){if(b!==0)break;result="1"+result;} return result;
}
function base58Decode(value: string): Uint8Array {
  let n=0n;for(const c of value)n=n*58n+BigInt(base58Alphabet.indexOf(c));
  const bytes:number[]=[];while(n){bytes.unshift(Number(n&255n));n>>=8n;}
  for(const c of value){if(c!=="1")break;bytes.unshift(0);}return Uint8Array.from(bytes);
}
async function verifyNep413Signature(intent: ConfidentialIntent, publicKey: string, signature: string): Promise<boolean> {
  try {
    const keyBytes=base58Decode(publicKey.slice(8));
    const sig=Uint8Array.from(atob(signature),c=>c.charCodeAt(0));
    const nonce=Uint8Array.from(atob(intent.payload.nonce),c=>c.charCodeAt(0));
    if(keyBytes.length!==32 || sig.length!==64 || nonce.length!==32)return false;
    const enc=new TextEncoder(); const msg=enc.encode(intent.payload.message), recipient=enc.encode(intent.payload.recipient);
    const size=4+4+msg.length+32+4+recipient.length+1, bytes=new Uint8Array(size), view=new DataView(bytes.buffer);
    let off=0;view.setUint32(off,2147484061,true);off+=4;
    view.setUint32(off,msg.length,true);off+=4;bytes.set(msg,off);off+=msg.length;
    bytes.set(nonce,off);off+=32;view.setUint32(off,recipient.length,true);off+=4;bytes.set(recipient,off);off+=recipient.length;
    bytes[off]=0; // Borsh None callback URL.
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    const key=await crypto.subtle.importKey("raw",Uint8Array.from(keyBytes),{name:"Ed25519"},false,["verify"]);
    return await crypto.subtle.verify("Ed25519",key,sig,digest);
  } catch {return false;}
}

export async function validateConfidentialSignature(intent: ConfidentialIntent, signer: string, signature: {accountId:string;publicKey:string;signature:string}) {
  const proof=z.object({accountId:z.literal(signer),publicKey:z.string().regex(/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,44}$/),signature:z.string().regex(/^[A-Za-z0-9+/]{86}==$/)}).strict().safeParse(signature);
  if (!proof.success || !await verifyNep413Signature(intent,proof.data.publicKey,proof.data.signature))
    throw new IntentsError("invalid_input", "The wallet signature could not be verified.");
  return proof.data;
}
