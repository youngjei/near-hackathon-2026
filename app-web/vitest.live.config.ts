import { defineConfig } from "vitest/config";
// Explicit opt-in only. Default npm test never contacts payment providers.
export default defineConfig({ test: { include: ["checks/intents-live.test.ts"] } });
