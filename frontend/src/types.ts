export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  assignee: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  cards: Card[];
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  createdAt: string;
}

export type CreateCardInput = {
  columnId: string;
  title: string;
  description?: string;
  priority?: Priority;
  tags?: string[];
  assignee?: string;
};

export type UpdateCardInput = Partial<{
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  assignee: string | null;
}>;

export type MoveCardInput = {
  columnId: string;
  beforeId?: string;
  afterId?: string;
};

export type ReorderCardInput = {
  beforeId?: string;
  afterId?: string;
};

export type GroupBy = "column" | "priority" | "assignee";

export interface FilterState {
  query: string;
  priority: Priority | "";
  tag: string;
  assignee: string;
}

export interface BoardViewState {
  groupBy: GroupBy;
  filter: FilterState;
  setGroupBy: (g: GroupBy) => void;
  setFilter: (f: Partial<FilterState>) => void;
  resetFilter: () => void;
}

// Virtual column used when groupBy != 'column'
export interface VirtualColumn {
  id: string;
  name: string;
  cards: Card[];
  isVirtual: true;
  groupValue: string;
}
