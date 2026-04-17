import { create } from "zustand";
import type { BoardViewState, FilterState, GroupBy } from "../types";

const defaultFilter: FilterState = {
  query: "",
  priority: "",
  tag: "",
  assignee: "",
};

export const useBoardView = create<BoardViewState>((set) => ({
  groupBy: "column",
  filter: defaultFilter,

  setGroupBy: (groupBy: GroupBy) => set({ groupBy }),

  setFilter: (partial: Partial<FilterState>) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),

  resetFilter: () => set({ filter: defaultFilter }),
}));
