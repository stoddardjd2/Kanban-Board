import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { boardsApi } from "../api/boards";
import { cardsApi, columnsApi } from "../api/cards";
import type {
  Board,
  Card,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  ReorderCardInput,
} from "../types";

export const BOARD_QUERY_KEY = (id: string) => ["board", id] as const;

function applyCardUpdate(board: Board, cardId: string, patch: Partial<Card>): Board {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    })),
  };
}

function removeCard(board: Board, cardId: string): Board {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.filter((c) => c.id !== cardId),
    })),
  };
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: BOARD_QUERY_KEY(boardId),
    queryFn: () => boardsApi.get(boardId),
    staleTime: 30_000,
  });
}

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: boardsApi.list,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => boardsApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) => cardsApi.create(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      const previous = qc.getQueryData<Board>(BOARD_QUERY_KEY(boardId));

      const optimisticCard: Card = {
        id: `optimistic-${Date.now()}`,
        columnId: input.columnId,
        title: input.title,
        description: input.description ?? "",
        priority: input.priority ?? "MEDIUM",
        tags: input.tags ?? [],
        assignee: input.assignee ?? null,
        position: 99999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (previous) {
        qc.setQueryData<Board>(BOARD_QUERY_KEY(boardId), {
          ...previous,
          columns: previous.columns.map((col) =>
            col.id === input.columnId
              ? { ...col, cards: [...col.cards, optimisticCard] }
              : col
          ),
        });
      }

      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(BOARD_QUERY_KEY(boardId), ctx.previous);
      }
      toast.error("Failed to create card");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
    },
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      cardsApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      const previous = qc.getQueryData<Board>(BOARD_QUERY_KEY(boardId));
      if (previous) {
        qc.setQueryData<Board>(BOARD_QUERY_KEY(boardId), applyCardUpdate(previous, id, input));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(BOARD_QUERY_KEY(boardId), ctx.previous);
      }
      toast.error("Failed to update card");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => cardsApi.delete(cardId),
    onMutate: async (cardId) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      const previous = qc.getQueryData<Board>(BOARD_QUERY_KEY(boardId));
      if (previous) {
        qc.setQueryData<Board>(BOARD_QUERY_KEY(boardId), removeCard(previous, cardId));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(BOARD_QUERY_KEY(boardId), ctx.previous);
      }
      toast.error("Failed to delete card");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
    },
    onSuccess: () => toast.success("Card deleted"),
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: string; input: MoveCardInput }) =>
      cardsApi.move(cardId, input),
    onMutate: async ({ cardId, input }) => {
      await qc.cancelQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      const previous = qc.getQueryData<Board>(BOARD_QUERY_KEY(boardId));

      if (previous) {
        const board = removeCard(previous, cardId);
        const movedCard = previous.columns
          .flatMap((c) => c.cards)
          .find((c) => c.id === cardId);

        if (movedCard) {
          qc.setQueryData<Board>(BOARD_QUERY_KEY(boardId), {
            ...board,
            columns: board.columns.map((col) =>
              col.id === input.columnId
                ? {
                    ...col,
                    cards: [...col.cards, { ...movedCard, columnId: input.columnId }],
                  }
                : col
            ),
          });
        }
      }

      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(BOARD_QUERY_KEY(boardId), ctx.previous);
      }
      toast.error("Failed to move card");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
    },
  });
}

export function useReorderCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: string; input: ReorderCardInput }) =>
      cardsApi.reorder(cardId, input),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => columnsApi.create(boardId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      toast.success("Column added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (colId: string) => columnsApi.delete(colId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARD_QUERY_KEY(boardId) });
      toast.success("Column deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
