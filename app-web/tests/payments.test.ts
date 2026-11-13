import { describe, it, expect } from "vitest";
import { shareStatus, transition, zip321 } from "../lib/payments";
import { hash, secret, shareToken } from "../lib/server/security";
import { imageType } from "../lib/providers/receipt";
describe("payment state integrity", () => {
  it("is idempotent and handles a late payment", () => {
    expect(transition("paid", "paid")).toBe("paid");
    expect(transition("expired", "paid")).toBe("paid");
    expect(transition("failed", "paid")).toBe("paid");
  });
  it("does not revert a refund or paid payment to pending", () => {
    expect(() => transition("refunded", "paid")).toThrow();
    expect(() => transition("paid", "expired")).toThrow();
    expect(transition("paid", "refunded")).toBe("refunded");
  });
  it("counts a share once and preserves an older paid attempt", () => {
    expect(
      shareStatus([
        { status: "expired", expires_at: 0 },
        { status: "paid", expires_at: 0 },
        { status: "paid", expires_at: 0 },
      ]),
    ).toBe("paid");
    expect(shareStatus([{ status: "pending", expires_at: 0 }])).toBe("expired");
    expect(shareStatus([])).toBe("unpaid");
  });
  it("refuses fake or demo payment addresses", () => {
    expect(() => zip321("demo-address", "0.1")).toThrow();
    expect(() => zip321("", "0")).toThrow();
  });
});
describe("private capabilities", () => {
  it("separates organizer and each share", async () => {
    const owner = secret(),
      a = await shareToken(owner, "a"),
      b = await shareToken(owner, "b");
    expect(a).not.toBe(b);
    expect(a).not.toBe(owner);
    expect(await shareToken(owner, "a")).toBe(a);
    expect(await hash(owner)).not.toBe(owner);
  });
  it("rejects active documents disguised as receipt images", () => {
    expect(
      imageType(new TextEncoder().encode('<svg onload="alert(1)">')),
    ).toBeNull();
    expect(imageType(new Uint8Array([255, 216, 255, 0]))).toBe("image/jpeg");
  });
});
