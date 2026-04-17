import { apiClient } from "./client";
import type {
  Card,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  ReorderCardInput,
} from "../types";

export const cardsApi = {
  create: async (input: CreateCardInput): Promise<Card> => {
    const { data } = await apiClient.post("/api/cards", input);
    return data;
  },

  update: async (id: string, input: UpdateCardInput): Promise<Card> => {
    const { data } = await apiClient.patch(`/api/cards/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/cards/${id}`);
  },

  move: async (id: string, input: MoveCardInput): Promise<Card> => {
    const { data } = await apiClient.post(`/api/cards/${id}/move`, input);
    return data;
  },

  reorder: async (id: string, input: ReorderCardInput): Promise<Card> => {
    const { data } = await apiClient.post(`/api/cards/${id}/reorder`, input);
    return data;
  },
};

export const columnsApi = {
  create: async (boardId: string, name: string) => {
    const { data } = await apiClient.post("/api/columns", { boardId, name });
    return data;
  },
  rename: async (id: string, name: string) => {
    const { data } = await apiClient.patch(`/api/columns/${id}`, { name });
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/api/columns/${id}`);
  },
};
