import { describe, it, expect } from "vitest";
import { filterCards, isFilterActive } from "../lib/filter";
import type { Card, FilterState } from "../types";

const makeCard = (overrides: Partial<Card>): Card => ({
  id: "c1",
  columnId: "col1",
  title: "Default Title",
  description: "Default description",
  priority: "MEDIUM",
  tags: [],
  assignee: null,
  position: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const emptyFilter: FilterState = { query: "", priority: "", tag: "", assignee: "" };

describe("filterCards", () => {
  it("returns all cards when filter is empty", () => {
    const cards = [makeCard({ id: "1" }), makeCard({ id: "2" })];
    expect(filterCards(cards, emptyFilter)).toHaveLength(2);
  });

  it("filters by title query (case-insensitive)", () => {
    const cards = [
      makeCard({ id: "1", title: "Fix login bug" }),
      makeCard({ id: "2", title: "Add dark mode" }),
    ];
    const result = filterCards(cards, { ...emptyFilter, query: "LOGIN" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by description query", () => {
    const cards = [
      makeCard({ id: "1", description: "relates to the auth service" }),
      makeCard({ id: "2", description: "UI tweak" }),
    ];
    const result = filterCards(cards, { ...emptyFilter, query: "auth" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by priority", () => {
    const cards = [
      makeCard({ id: "1", priority: "HIGH" }),
      makeCard({ id: "2", priority: "LOW" }),
      makeCard({ id: "3", priority: "HIGH" }),
    ];
    const result = filterCards(cards, { ...emptyFilter, priority: "HIGH" });
    expect(result).toHaveLength(2);
  });

  it("filters by tag", () => {
    const cards = [
      makeCard({ id: "1", tags: ["frontend", "bug"] }),
      makeCard({ id: "2", tags: ["backend"] }),
      makeCard({ id: "3", tags: ["frontend"] }),
    ];
    const result = filterCards(cards, { ...emptyFilter, tag: "frontend" });
    expect(result).toHaveLength(2);
  });

  it("filters by assignee (case-insensitive)", () => {
    const cards = [
      makeCard({ id: "1", assignee: "Alice" }),
      makeCard({ id: "2", assignee: "Bob" }),
    ];
    const result = filterCards(cards, { ...emptyFilter, assignee: "alice" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("combines multiple filters (AND logic)", () => {
    const cards = [
      makeCard({ id: "1", priority: "HIGH", tags: ["bug"] }),
      makeCard({ id: "2", priority: "HIGH", tags: ["feature"] }),
      makeCard({ id: "3", priority: "LOW", tags: ["bug"] }),
    ];
    const result = filterCards(cards, {
      ...emptyFilter,
      priority: "HIGH",
      tag: "bug",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when no cards match", () => {
    const cards = [makeCard({ id: "1", priority: "LOW" })];
    expect(filterCards(cards, { ...emptyFilter, priority: "URGENT" })).toHaveLength(0);
  });
});

describe("isFilterActive", () => {
  it("returns false when all fields are empty", () => {
    expect(isFilterActive(emptyFilter)).toBe(false);
  });

  it("returns true when query is set", () => {
    expect(isFilterActive({ ...emptyFilter, query: "x" })).toBe(true);
  });

  it("returns true when priority is set", () => {
    expect(isFilterActive({ ...emptyFilter, priority: "HIGH" })).toBe(true);
  });
});
