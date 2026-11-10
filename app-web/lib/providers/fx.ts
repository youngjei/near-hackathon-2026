import { z } from "zod";
const rateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rate: z.number().positive().max(1e6),
});
const fixtures: Record<string, string> = {
  AED: "0.27229",
  USD: "1",
  EUR: "1.08",
  GBP: "1.29",
  NGN: "0.00065",
  CNY: "0.14",
  KRW: "0.00072",
  JPY: "0.0067",
};
export async function getRate(currency: string, demoFallback = true) {
  if (currency === "USD")
    return {
      rate: "1",
      date: new Date().toISOString().slice(0, 10),
      source: "USD reference",
      fixture: false,
    };
  try {
    const r = await fetch(
      `https://api.frankfurter.dev/v2/rate/${currency.toLowerCase()}/usd`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) throw new Error("Rate service unavailable");
    const v = rateSchema.parse(await r.json());
    return {
      rate: String(v.rate),
      date: v.date,
      source: "Frankfurter",
      fixture: false,
    };
  } catch {
    if (!demoFallback || !fixtures[currency])
      throw new Error("Exchange rate unavailable. Try again later.");
    return {
      rate: fixtures[currency],
      date: "2026-11-10",
      source: "Demo reference rate",
      fixture: true,
    };
  }
}
