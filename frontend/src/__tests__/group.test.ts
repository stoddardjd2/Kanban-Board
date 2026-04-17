import { describe, it, expect } from "vitest";
import { buildDisplayColumns } from "../lib/group";
import type { Board, Card, Column } from "../types";

const makeCard = (overrides: Partial<Card>): Card => ({
  id: "c1",
  columnId: "col1",
  title: "Card",
  description: "",
  priority: "MEDIUM",
  tags: [],
  assignee: null,
  position: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeColumn = (overrides: Partial<Column> & { cards: Card[] }): Column => ({
  id: "col1",
  boardId: "board1",
  name: "To Do",
  position: 1,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const board: Board = {
  id: "board1",
  name: "Test Board",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  columns: [
    makeColumn({
      id: "col1",
      name: "To Do",
      position: 1,
      cards: [
        makeCard({ id: "c1", priority: "HIGH", assignee: "Alice", columnId: "col1" }),
        makeCard({ id: "c2", priority: "LOW", assignee: "Bob", columnId: "col1" }),
      ],
    }),
    makeColumn({
      id: "col2",
      name: "Done",
      position: 2,
      cards: [
        makeCard({ id: "c3", priority: "HIGH", assignee: "Alice", columnId: "col2" }),
        makeCard({ id: "c4", priority: "MEDIUM", assignee: null, columnId: "col2" }),
      ],
    }),
  ],
};

describe("buildDisplayColumns — groupBy column", () => {
  it("returns original columns unchanged", () => {
    const cols = buildDisplayColumns(board, "column");
    expect(cols).toHaveLength(2);
    expect(cols[0].name).toBe("To Do");
    expect(cols[1].name).toBe("Done");
  });
});

describe("buildDisplayColumns — groupBy priority", () => {
  it("creates a virtual column per priority level", () => {
    const cols = buildDisplayColumns(board, "priority");
    const names = cols.map((c) => c.name);
    expect(names).toContain("HIGH");
    expect(names).toContain("LOW");
    expect(names).toContain("MEDIUM");
  });

  it("places cards with matching priority in correct virtual column", () => {
    const cols = buildDisplayColumns(board, "priority");
    const highCol = cols.find((c) => c.name === "HIGH")!;
    expect(highCol.cards).toHaveLength(2);
    expect(highCol.cards.map((c) => c.id)).toContain("c1");
    expect(highCol.cards.map((c) => c.id)).toContain("c3");
  });

  it("marks columns as virtual", () => {
    const cols = buildDisplayColumns(board, "priority");
    expect(cols.every((c) => c.isVirtual === true)).toBe(true);
  });
});

describe("buildDisplayColumns — groupBy assignee", () => {
  it("groups cards by assignee name", () => {
    const cols = buildDisplayColumns(board, "assignee");
    const aliceCol = cols.find((c) => c.name === "Alice")!;
    const bobCol = cols.find((c) => c.name === "Bob")!;
    expect(aliceCol).toBeDefined();
    expect(bobCol).toBeDefined();
    expect(aliceCol.cards).toHaveLength(2);
    expect(bobCol.cards).toHaveLength(1);
  });

  it("places unassigned cards in an Unassigned column at the end", () => {
    const cols = buildDisplayColumns(board, "assignee");
    const unassigned = cols.find((c) => c.name === "Unassigned");
    expect(unassigned).toBeDefined();
    expect(unassigned!.cards).toHaveLength(1);
    expect(unassigned!.cards[0].id).toBe("c4");
    // Unassigned should be last
    expect(cols[cols.length - 1].name).toBe("Unassigned");
  });
});
