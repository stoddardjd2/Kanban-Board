import { apiClient } from "./client";
import type { Board, BoardSummary } from "../types";

export const boardsApi = {
  list: async (): Promise<BoardSummary[]> => {
    const { data } = await apiClient.get("/api/boards");
    return data;
  },

  get: async (id: string): Promise<Board> => {
    const { data } = await apiClient.get(`/api/boards/${id}`);
    return data;
  },

  create: async (name: string): Promise<Board> => {
    const { data } = await apiClient.post("/api/boards", { name });
    return data;
  },

  rename: async (id: string, name: string): Promise<Board> => {
    const { data } = await apiClient.patch(`/api/boards/${id}`, { name });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/boards/${id}`);
  },
};
