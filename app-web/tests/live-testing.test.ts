import { expect, test } from "vitest";
import { paymentReadiness } from "../lib/providers/near";
import { paymentOptions } from "../lib/server/payment-runtime";

const settings = {
  NEAR_INTENTS_API_KEY: "synthetic-not-a-credential",
  LIVE_PAYMENTS_ENABLED: "true",
  LIVE_PAYMENT_TESTING: "true",
  LIVE_ZCASH_ENABLED: "true",
  LIVE_SOLANA_ENABLED: "true",
  LIVE_CONFIDENTIAL_ENABLED: "true",
  ZCASH_ACCEPTANCE_VERIFIED: "false",
  SOLANA_ACCEPTANCE_VERIFIED: "false",
  CONFIDENTIAL_ACCEPTANCE_VERIFIED: "false",
};

test("testing environment flags alone cannot open any live route", () => {
  for (const ownerProof of [undefined, false]) {
    const readiness = paymentReadiness(settings, ownerProof);
    expect(readiness).toMatchObject({enabled: false, testing: false, methods: {zcash: false, solana: false, confidential: false}});
    expect(paymentOptions(settings, ownerProof).readiness).toEqual(readiness);
  }
  // Even previously accepted routes fail closed while the owner test gate is active.
  expect(paymentReadiness({...settings, SOLANA_ACCEPTANCE_VERIFIED: "true"}).enabled).toBe(false);
});

test("server-proven owner can test deposits without misrepresenting acceptance", () => {
  const readiness = paymentReadiness(settings, true);
  expect(readiness).toMatchObject({enabled: true, testing: true, methods: {zcash: true, solana: true, confidential: false}});
  expect(readiness.reason).toContain("real funds");
  expect(readiness.reason).toContain("incomplete");
  expect(settings.SOLANA_ACCEPTANCE_VERIFIED).toBe("false");
  expect(settings.ZCASH_ACCEPTANCE_VERIFIED).toBe("false");
  expect(paymentOptions(settings, true).readiness).toEqual(readiness);
});

test("owner testing still requires key, global activation and each route's switch", () => {
  for (const key of ["NEAR_INTENTS_API_KEY", "LIVE_PAYMENTS_ENABLED"]) {
    expect(paymentReadiness({...settings, [key]: ""}, true).enabled).toBe(false);
  }
  for (const [key, method] of [["LIVE_ZCASH_ENABLED", "zcash"], ["LIVE_SOLANA_ENABLED", "solana"]] as const) {
    expect(paymentReadiness({...settings, [key]: "false"}, true).methods[method]).toBe(false);
  }
});

test("owner proof does not bypass ordinary rollout or confidential signing acceptance", () => {
  expect(paymentReadiness({...settings, LIVE_PAYMENT_TESTING: "false"}, true)).toMatchObject({enabled: false, testing: false});
  expect(paymentReadiness(settings, true).methods.confidential).toBe(false);
  expect(paymentReadiness({...settings, CONFIDENTIAL_ACCEPTANCE_VERIFIED: "true"}, true).methods.confidential).toBe(true);
});
