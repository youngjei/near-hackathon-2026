import { intentsProvider } from "../providers/intents";
import { paymentReadiness } from "../providers/near";
import type { PaymentOptions } from "./api";

// Server-only configuration. A credential never enables payments by itself.
export function paymentOptions(settings: Record<string, string | undefined>): PaymentOptions {
  return {
    readiness: paymentReadiness(settings),
    provider: settings.NEAR_INTENTS_API_KEY ? intentsProvider(settings.NEAR_INTENTS_API_KEY) : undefined,
  };
}
