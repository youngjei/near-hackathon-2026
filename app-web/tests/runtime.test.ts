import { afterEach, expect, test, vi } from "vitest";
import { handle } from "../lib/server/runtime-node";
afterEach(() => vi.unstubAllEnvs());
function configure() {
  vi.stubEnv("SUPABASE_URL", "https://database.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-key");
  vi.stubEnv("APP_ORIGIN", "https://split.test");
}
test("canonical deployment origin accepts proxy requests and sets secure cookies", async () => {
  configure();
  const r = await handle(new Request("http://localhost:3000/api/session", {
    method:"POST", headers:{origin:"https://split.test"},
  }));
  expect(r.status).toBe(200);
  expect(r.headers.get("set-cookie")).toContain("Secure");
});
test("host and forwarding headers cannot authorize a foreign origin", async () => {
  configure();
  const r = await handle(new Request("http://localhost:3000/api/session", {
    method:"POST", headers:{origin:"https://evil.test",host:"evil.test","x-forwarded-host":"evil.test"},
  }));
  expect(r.status).toBe(403);
});
test("native production requires a valid explicit origin", async () => {
  configure();
  vi.stubEnv("NODE_ENV","production");
  for (const origin of ["", "invalid", "https://split.test/path"]) {
    vi.stubEnv("APP_ORIGIN",origin);
    expect((await handle(new Request("http://localhost/api/config"))).status).toBe(503);
  }
});
