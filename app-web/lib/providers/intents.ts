import { verifyQuoteSignature, type QuoteResponse } from "@defuse-protocol/one-click-sdk-typescript";
import { z } from "zod";

export const INTENTS_API = "https://1click.chaindefuser.com/v0";
export const ASSETS = {
  zec: "nep141:zec.omft.near",
  usdc: "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
} as const;
const units = z.string().regex(/^[1-9]\d{0,29}$/);
const account = z.string().regex(/^(?:0x[0-9a-f]{40}|[a-z0-9]+(?:[._-][a-z0-9]+)*)$/).min(2).max(64);
export type PaymentRoute = {
  method: "zcash" | "confidential";
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
    method: z.enum(["zcash", "confidential"]), recipient: account,
    refundTo: z.string().min(2).max(256), amountUnits: units,
  }).safeParse(route);
  if (!parsed.success || BigInt(route.amountUnits) % 10000n !== 0n)
    throw new IntentsError("invalid_input", "Use a valid receiving account and a share rounded to USDC cents.");
  if (route.method === "confidential" && !account.safeParse(route.refundTo).success)
    throw new IntentsError("invalid_input", "Use the payer's Confidential Intents account for refunds.");
  return {
    dry, swapType: "EXACT_OUTPUT" as const, slippageTolerance: 100,
    originAsset: route.method === "zcash" ? ASSETS.zec : ASSETS.usdc,
    destinationAsset: ASSETS.usdc,
    depositType: route.method === "zcash" ? "ORIGIN_CHAIN" as const : "CONFIDENTIAL_INTENTS" as const,
    recipientType: "CONFIDENTIAL_INTENTS" as const,
    refundType: route.method === "zcash" ? "ORIGIN_CHAIN" as const : "CONFIDENTIAL_INTENTS" as const,
    amount: route.amountUnits, recipient: route.recipient, refundTo: route.refundTo,
    confidentiality: "basic" as const,
    deadline: new Date(now + 15 * 60000).toISOString(),
  };
}

const quoteSchema = z.object({
  correlationId: z.string(), timestamp: z.string().datetime(), signature: z.string(),
  quoteRequest: z.record(z.unknown()),
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
    swapDetails: z.object({amountOut: z.string().regex(/^(?:0|[1-9]\d{0,29})$/).optional()}).passthrough(),
  }).safeParse(raw);
  if (!parsed.success || Date.parse(parsed.data.updatedAt) > now + 60000) invalidQuote();
  const data = parsed.data;
  const incoming = validatePaymentQuote(data.quoteResponse, saved.quoteRequest as PaymentQuoteRequest, {historic:true});
  if (incoming.signature !== saved.signature || incoming.timestamp !== saved.timestamp ||
      incoming.quote.depositAddress !== saved.quote.depositAddress || incoming.quote.depositMemo !== saved.quote.depositMemo) invalidQuote();
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
    async status(saved: VerifiedQuote) {
      if (saved.quoteRequest.dry !== false || !saved.quote.depositAddress) invalidQuote();
      const params = new URLSearchParams({depositAddress:saved.quote.depositAddress});
      if (saved.quote.depositMemo) params.set("depositMemo",saved.quote.depositMemo);
      return assessSettlement(await request("/status?" + params),saved);
    },
  };
}
