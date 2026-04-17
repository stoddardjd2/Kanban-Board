import type { Board, Card, Column, GroupBy, VirtualColumn } from "../types";

const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;

export type DisplayColumn =
  | (Column & { isVirtual?: false })
  | VirtualColumn;

export function buildDisplayColumns(
  board: Board,
  groupBy: GroupBy
): DisplayColumn[] {
  if (groupBy === "column") {
    return board.columns.map((col) => ({ ...col, isVirtual: false as const }));
  }

  // Flatten all cards
  const allCards = board.columns.flatMap((col) => col.cards);

  if (groupBy === "priority") {
    return PRIORITY_ORDER.map((priority) => ({
      id: `virtual-priority-${priority}`,
      name: priority,
      cards: allCards
        .filter((c) => c.priority === priority)
        .sort((a, b) => a.position - b.position),
      isVirtual: true as const,
      groupValue: priority,
    }));
  }

  if (groupBy === "assignee") {
    const groups = new Map<string, Card[]>();

    for (const card of allCards) {
      const key = card.assignee ?? "Unassigned";
      const existing = groups.get(key) ?? [];
      existing.push(card);
      groups.set(key, existing);
    }

    // Sort keys: Unassigned last, rest alphabetically
    const keys = [...groups.keys()].sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });

    return keys.map((key) => ({
      id: `virtual-assignee-${key}`,
      name: key,
      cards: (groups.get(key) ?? []).sort((a, b) => a.position - b.position),
      isVirtual: true as const,
      groupValue: key,
    }));
  }

  return board.columns.map((col) => ({ ...col, isVirtual: false as const }));
}
