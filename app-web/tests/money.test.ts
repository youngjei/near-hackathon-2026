import { describe, it, expect } from "vitest";
import { allocation, billInput } from "../lib/money";
describe("equal reimbursement allocation", () => {
  it("includes organizer but requests only N-1 shares", () => {
    const r = allocation("200", "0", "0.27229", 4);
    expect(r.totalUnits).toBe("54460000");
    expect(r.shares).toEqual(["13620000", "13620000", "13610000", "13610000"]);
    expect(r.shares.slice(1).reduce((s, v) => s + BigInt(v), 0n)).toBe(
      40840000n,
    );
  });
  it("conserves every cent for all group sizes", () => {
    for (let n = 2; n <= 20; n++)
      for (const total of ["0.21", "17.77", "200.00", "99999999.99"]) {
        const r = allocation(total, "0", "1", n);
        expect(r.shares.reduce((s, v) => s + BigInt(v), 0n)).toBe(
          BigInt(r.totalUnits),
        );
        expect(
          BigInt(r.shares[0]) - BigInt(r.shares.at(-1)!),
        ).toBeLessThanOrEqual(10000n);
      }
  });
  it("adds only the explicit extra amount", () =>
    expect(allocation("200", "10", "1", 3).totalUnits).toBe("210000000"));
  it("rejects tiny bills and bad inputs", () => {
    expect(() => allocation("0.01", "0", "1", 4)).toThrow();
    expect(() => allocation("10", "0", "1", 0)).toThrow();
    expect(() => allocation("10", "-1", "1", 2)).toThrow();
    expect(billInput.safeParse({ total: "NaN" }).success).toBe(false);
  });
});
