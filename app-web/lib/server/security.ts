export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function secret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function hash(v: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function shareToken(owner: string, id: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(owner),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`share:${id}`),
      ),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export function cookie(req: Request, name: string) {
  return (
    req.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(name + "="))
      ?.slice(name.length + 1) || ""
  );
}
export function sessionCookie(req: Request, name: string, value: string) {
  return `${name}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=604800${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin !== new URL(req.url).origin)
    throw new HttpError(403, "Please open this page directly and try again.");
}
export async function readJson(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Expected JSON.");
  const max = 16 * 1024;
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "Request too large.");
  const reader = req.body?.getReader();
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > max) {
        await reader.cancel();
        throw new HttpError(413, "Request too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
export const responseHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: { ...responseHeaders, ...headers },
  });
}
