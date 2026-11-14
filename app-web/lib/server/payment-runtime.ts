import { intentsProvider } from "../providers/intents";
import { paymentReadiness } from "../providers/near";
import type { PaymentOptions } from "./api";

// Server-only configuration. A credential never enables payments by itself.
export function paymentOptions(settings: Record<string, string | undefined>, liveTestOwnerAuthorized = false): PaymentOptions {
  return {
    readiness: paymentReadiness(settings, liveTestOwnerAuthorized),
    // Applied only after the API validates the specific share capability.
    payerReadiness: settings.LIVE_PAYMENT_TESTING === "true" ? paymentReadiness(settings, true) : undefined,
    provider: settings.NEAR_INTENTS_API_KEY ? intentsProvider(settings.NEAR_INTENTS_API_KEY) : undefined,
  };
}
