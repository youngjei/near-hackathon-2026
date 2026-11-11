import Decimal from "decimal.js";
import { z } from "zod";
import { receivingAddress } from "./receiving";
export const currencies = [
  "AED",
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "CNY",
  "KRW",
  "JPY",
] as const;
export const moneyInput = z
  .string()
  .regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    "Use an amount with at most two decimal places.",
  );
export const billInput = z
  .object({
    mode: z.enum(["demo", "live"]).default("demo"),
    merchant: z.string().trim().min(1, "Add a name for this bill.").max(80),
    currency: z.enum(currencies),
    total: moneyInput,
    extra: moneyInput.default("0"),
    diners: z.number().int().min(2).max(20),
    receiptId: z.string().uuid().optional(),
    receivingAddress,
    requestKey: z.string().uuid(),
    approvedRate: z.string().regex(/^\d+(\.\d+)?$/),
    approvedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => new Decimal(v.total).gt(0), {
    message: "The total must be greater than zero.",
    path: ["total"],
  });
export function allocation(
  total: string,
  extra: string,
  rate: string,
  diners: number,
) {
  if (!Number.isInteger(diners) || diners < 2 || diners > 20)
    throw new Error("Invalid diner count");
  if (
    !new Decimal(rate).isPositive() ||
    new Decimal(total).lte(0) ||
    new Decimal(extra).lt(0)
  )
    throw new Error("Invalid amount");
  const cents = BigInt(
    new Decimal(total)
      .plus(extra)
      .mul(rate)
      .mul(100)
      .toFixed(0, Decimal.ROUND_HALF_UP),
  );
  if (cents < BigInt(diners))
    throw new Error("Each share must be at least 0.01 USDC.");
  const base = cents / BigInt(diners),
    remainder = cents % BigInt(diners);
  const shares = Array.from(
    { length: diners },
    (_, i) => (base + (BigInt(i) < remainder ? 1n : 0n)) * 10000n,
  );
  return {
    totalUnits: (cents * 10000n).toString(),
    shares: shares.map(String),
  };
}
export function amount(units: string) {
  return new Decimal(units).div(1e6).toFixed(2);
}
export function formatAmount(units: string) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount(units)));
}
