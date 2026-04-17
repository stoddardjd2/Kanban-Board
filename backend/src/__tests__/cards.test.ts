import { describe, it, expect } from "vitest";
import { computePosition } from "../services/rank.js";

describe("computePosition", () => {
  it("returns 1.0 when there are no neighbors", () => {
    expect(computePosition(null, null)).toBe(1.0);
  });

  it("returns half of after.position when only after is given", () => {
    expect(computePosition(null, { position: 4 })).toBe(2);
  });

  it("returns before.position + 1 when only before is given", () => {
    expect(computePosition({ position: 3 }, null)).toBe(4);
  });

  it("returns average of before and after positions", () => {
    expect(computePosition({ position: 2 }, { position: 4 })).toBe(3);
  });

  it("handles fractional positions correctly", () => {
    expect(computePosition({ position: 1 }, { position: 2 })).toBe(1.5);
    expect(computePosition({ position: 1.5 }, { position: 2 })).toBe(1.75);
  });
});

describe("position algorithm — ordering invariants", () => {
  it("inserting between two items yields position strictly between them", () => {
    const before = { position: 1 };
    const after = { position: 3 };
    const pos = computePosition(before, after);
    expect(pos).toBeGreaterThan(before.position);
    expect(pos).toBeLessThan(after.position);
  });

  it("appending always yields a position greater than the last item", () => {
    const last = { position: 5.5 };
    const pos = computePosition(last, null);
    expect(pos).toBeGreaterThan(last.position);
  });

  it("prepending always yields a position less than the first item", () => {
    const first = { position: 4 };
    const pos = computePosition(null, first);
    expect(pos).toBeLessThan(first.position);
  });
});
