import { afterEach, expect, test, vi } from "vitest";
import { testAccess, testOwnerAuthorized } from "../lib/server/test-access";
import { handle } from "../lib/server/runtime-node";
const settings = {STANDALONE_PRIVATE_ACCESS: "true", LIVE_PAYMENT_TESTING: "true", PRIVATE_TEST_PASSWORD: "test-only-owner-password-with-over-32-characters", APP_ORIGIN: "https://split.test", CRON_SECRET: "cron-test-secret"};
afterEach(() => vi.unstubAllEnvs());
function request(path = "/api/config", headers: Record<string, string> = {}) {
  return new Request(`http://localhost:3000${path}`, {headers});
}
function login(password = settings.PRIVATE_TEST_PASSWORD, returnTo = "/") {
  return new Request("http://localhost:3000/api/test-access", {method: "POST", headers: {origin: settings.APP_ORIGIN, "content-type": "application/x-www-form-urlencoded"}, body: new URLSearchParams({password, returnTo})});
}
async function session() {
  const response = await testAccess(login(), settings);
  expect(response?.status).toBe(303);
  expect(response?.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Strict; Max-Age=43200; Secure");
  return response!.headers.get("set-cookie")!.split(";")[0];
}
test("private testing is default-off and missing or weak passwords fail closed", async () => {
  expect(await testAccess(request(), {})).toBeUndefined();
  for (const password of [undefined, "short"]) {
    expect((await testAccess(request(), {...settings, PRIVATE_TEST_PASSWORD: password}))?.status).toBe(503);
  }
});
test("unauthorized native APIs ignore forged Sites identity and page requests lead to login", async () => {
  expect((await testAccess(request("/api/config", {"x-oai-user-id": "owner", "x-oai-site-user-role": "owner"}), settings))?.status).toBe(401);
  const response = await testAccess(request("/b/abc?view=1"), settings);
  expect(response?.headers.get("location")).toBe("https://split.test/test-access?returnTo=%2Fb%2Fabc%3Fview%3D1");
  expect((await testAccess(request("/test-access"), settings))?.headers.get("cache-control")).toBe("no-store");
  // no-referrer would make a browser's form POST Origin:null and fail CSRF.
  expect((await testAccess(request("/test-access"), settings))?.headers.get("referrer-policy")).toBe("same-origin");
});
test("signed owner cookies authorize APIs and reject forgery, expiry, origin and key changes", async () => {
  const cookie = await session();
  const req = request("/api/config", {cookie});
  expect(testOwnerAuthorized(req, settings)).toBe(true);
  expect(await testAccess(req, settings)).toBeUndefined();
  expect(testOwnerAuthorized(req, settings, Date.now() + 13 * 60 * 60 * 1000)).toBe(false);
  expect(testOwnerAuthorized(req, {...settings, APP_ORIGIN: "https://other.test"})).toBe(false);
  expect(testOwnerAuthorized(req, {...settings, PRIVATE_TEST_PASSWORD: "another-test-password-at-least-32-characters"})).toBe(false);
  expect(testOwnerAuthorized(request("/api/config", {cookie: cookie.slice(0, -1) + "x"}), settings)).toBe(false);
});
test("login checks password and pinned origin and cannot redirect offsite", async () => {
  expect((await testAccess(login("wrong"), settings))?.status).toBe(401);
  const foreign = login();
  foreign.headers.set("origin", "https://evil.test");
  foreign.headers.set("x-forwarded-host", "evil.test");
  expect((await testAccess(foreign, settings))?.status).toBe(403);
  for (const returnTo of ["https://evil.test", "//evil.test", "/\\evil.test", "/\n/evil.test", "/api/config", "/test-access"]) {
    expect((await testAccess(login(undefined, returnTo), settings))?.headers.get("location")).toBe("https://split.test/");
  }
  const response = await testAccess(login(undefined, "/b/abc"), settings);
  expect(response?.headers.get("location")).toBe("https://split.test/b/abc");
});
test("public login body is bounded even without content-length", async () => {
  const req = login("x".repeat(5000));
  expect((await testAccess(req, settings))?.status).toBe(413);
});
test("only exact authenticated reconciliation POST bypasses owner cookie", async () => {
  for (const path of ["/api/config", "/api/reconcile/", "/api/reconcile/fake"]) {
    const req = new Request(`http://localhost:3000${path}`, {method: "POST", headers: {authorization: `Bearer ${settings.CRON_SECRET}`}});
    expect((await testAccess(req, settings))?.status).toBe(401);
  }
  const req = new Request("http://localhost:3000/api/reconcile", {method: "POST", headers: {authorization: `Bearer ${settings.CRON_SECRET}`}});
  expect(await testAccess(req, settings)).toBeUndefined();
  expect((await testAccess(req, {...settings, CRON_SECRET: ""}))?.status).toBe(401);
});
test("native runtime independently enforces access before storage or config", async () => {
  for (const [name, value] of Object.entries(settings)) vi.stubEnv(name, value);
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  expect((await handle(request())).status).toBe(401);
  const response = await handle(login());
  expect(response.status).toBe(303);
});

test("pilot admits only checkout shell and exact capability-protected share endpoints", async () => {
  const id = "22222222-2222-4222-8222-222222222222";
  expect(await testAccess(request("/pay?id=" + id), settings)).toBeUndefined();
  expect(await testAccess(request("/fonts/space-grotesk-variable.ttf"), settings)).toBeUndefined();
  for (const suffix of ["", "/receipt"]) expect(await testAccess(request(`/api/shares/${id}${suffix}`), settings)).toBeUndefined();
  for (const suffix of ["access", "attempts", "prepare", "submit", "refresh", "simulate"]) {
    const req = new Request(`http://localhost:3000/api/shares/${id}/${suffix}`, {method:"POST"});
    expect(await testAccess(req, settings)).toBeUndefined();
  }
  for (const path of ["/", "/bill", "/bills", "/api/config", "/api/bills", `/api/shares/${id}/unknown`, `/api/shares/${id}/attempts/extra`]) {
    expect(await testAccess(request(path), settings)).toBeDefined();
  }
  expect((await testAccess(new Request("http://localhost:3000/api/bills", {method:"POST"}), settings))?.status).toBe(401);
});

test("standalone access can be disabled for a public pilot", async () => {
  expect(await testAccess(new Request("https://split.test/api/bills", {method:"POST"}), {...settings, STANDALONE_PRIVATE_ACCESS:"false", PUBLIC_LIVE_PILOT:"true"})).toBeUndefined();
});
