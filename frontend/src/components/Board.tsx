import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./Column";
import { KanbanCard } from "./Card";
import { CardDialog } from "./CardDialog";
import { Filters } from "./Filters";
import { GroupBySelect } from "./GroupBySelect";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { useBoardView } from "@/state/boardView";
import { buildDisplayColumns } from "@/lib/group";
import { filterCards } from "@/lib/filter";
import {
  useBoard,
  useCreateCard,
  useUpdateCard,
  useDeleteCard,
  useMoveCard,
  useReorderCard,
  useCreateColumn,
  useDeleteColumn,
} from "@/hooks/useBoard";
import type { Card as CardType, Column, Priority } from "../types";

interface BoardProps {
  boardId: string;
}

export function Board({ boardId }: BoardProps) {
  const { data: board, isLoading, isError } = useBoard(boardId);
  const { groupBy, filter } = useBoardView();

  const createCard = useCreateCard(boardId);
  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const moveCard = useMoveCard(boardId);
  const reorderCard = useReorderCard(boardId);
  const createColumn = useCreateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);

  const [activeCard, setActiveCard] = React.useState<CardType | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<CardType | undefined>();
  const [targetColumnId, setTargetColumnId] = React.useState<string>("");
  const [newColumnName, setNewColumnName] = React.useState("");
  const [showNewColumn, setShowNewColumn] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Keyboard shortcut: N = new card (in first column)
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !dialogOpen
      ) {
        e.preventDefault();
        if (board?.columns[0]) {
          setTargetColumnId(board.columns[0].id);
          setEditingCard(undefined);
          setDialogOpen(true);
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [board, dialogOpen]);

  if (isLoading) return <BoardSkeleton />;
  if (isError || !board)
    return (
      <div className="flex items-center justify-center h-64 text-[rgb(var(--muted-foreground))]">
        Failed to load board. Please try again.
      </div>
    );

  const displayColumns = buildDisplayColumns(board, groupBy);

  // Apply filters on display columns
  const filteredColumns = displayColumns.map((col) => ({
    ...col,
    cards: filterCards(col.cards, filter),
  }));

  function handleAddCard(columnId: string) {
    setTargetColumnId(columnId);
    setEditingCard(undefined);
    setDialogOpen(true);
  }

  function handleEditCard(card: CardType) {
    setEditingCard(card);
    setTargetColumnId(card.columnId);
    setDialogOpen(true);
  }

  function handleDeleteCard(cardId: string) {
    deleteCard.mutate(cardId);
  }

  function handleDialogSubmit(values: {
    title: string;
    description: string;
    priority: Priority;
    tags: string[];
    assignee?: string;
  }) {
    if (editingCard) {
      updateCard.mutate(
        { id: editingCard.id, input: values },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createCard.mutate(
        { ...values, columnId: targetColumnId },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  }

  // ─── DnD handlers ────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current?.card as CardType;
    if (card) setActiveCard(card);
  }

  function handleDragOver(_event: DragOverEvent) {
    // Optimistic column switching could go here; we rely on onSettled refresh
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardData = active.data.current?.card as CardType | undefined;
    if (!activeCardData) return;

    const overId = over.id as string;

    // Determine if over a column or a card
    const overColumn = filteredColumns.find((c) => c.id === overId);
    const overCard = filteredColumns
      .flatMap((c) => c.cards)
      .find((c) => c.id === overId);

    if (!overColumn && !overCard) return;

    const targetColId = overColumn
      ? overColumn.id
      : overCard!.columnId;

    const isSameColumn = activeCardData.columnId === targetColId;
    const isVirtualColumn = filteredColumns.find((c) => c.id === targetColId)
      ?.isVirtual;

    if (isVirtualColumn) {
      // Grouping change — update the grouped attribute
      if (groupBy === "priority") {
        const col = filteredColumns.find((c) => c.id === targetColId);
        if (col && "groupValue" in col) {
          updateCard.mutate({
            id: activeCardData.id,
            input: { priority: col.groupValue as Priority },
          });
        }
      } else if (groupBy === "assignee") {
        const col = filteredColumns.find((c) => c.id === targetColId);
        if (col && "groupValue" in col) {
          updateCard.mutate({
            id: activeCardData.id,
            input: {
              assignee:
                col.groupValue === "Unassigned" ? null : col.groupValue,
            },
          });
        }
      }
      return;
    }

    if (isSameColumn) {
      // Reorder within column
      if (overCard) {
        const col = filteredColumns.find((c) => c.id === targetColId)!;
        const overIdx = col.cards.findIndex((c) => c.id === overId);
        const beforeCard = col.cards[overIdx - 1];
        const afterCard = col.cards[overIdx];

        reorderCard.mutate({
          cardId: activeCardData.id,
          input: {
            beforeId: beforeCard?.id,
            afterId: afterCard?.id,
          },
        });
      }
    } else {
      // Move to different column
      const targetCol = filteredColumns.find((c) => c.id === targetColId)!;
      const overIdx = overCard
        ? targetCol.cards.findIndex((c) => c.id === overId)
        : targetCol.cards.length;

      const beforeCard = targetCol.cards[overIdx - 1];
      const afterCard = overCard ? targetCol.cards[overIdx] : undefined;

      moveCard.mutate({
        cardId: activeCardData.id,
        input: {
          columnId: targetColId,
          beforeId: beforeCard?.id,
          afterId: afterCard?.id,
        },
      });
    }
  }

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    createColumn.mutate(newColumnName.trim(), {
      onSuccess: () => {
        setNewColumnName("");
        setShowNewColumn(false);
      },
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] shrink-0">
        <Filters />
        <div className="ml-auto flex items-center gap-2">
          <GroupBySelect />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-6 h-full items-start">
            {filteredColumns.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                name={col.name}
                cards={col.cards}
                isVirtual={col.isVirtual}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onDeleteColumn={
                  !col.isVirtual && groupBy === "column"
                    ? deleteColumn.mutate
                    : undefined
                }
              />
            ))}

            {/* Add column */}
            {groupBy === "column" && (
              <div className="w-72 shrink-0">
                {showNewColumn ? (
                  <form
                    onSubmit={handleAddColumn}
                    className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--secondary))] p-3 space-y-2"
                  >
                    <Input
                      autoFocus
                      placeholder="Column name…"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setShowNewColumn(false);
                          setNewColumnName("");
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="flex-1 h-7 text-xs">
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setShowNewColumn(false);
                          setNewColumnName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowNewColumn(true)}
                    className="w-full h-10 border-dashed text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                )}
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <KanbanCard
                card={activeCard}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card dialog */}
      <CardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editingCard}
        columnId={targetColumnId}
        onSubmit={handleDialogSubmit}
        isPending={createCard.isPending || updateCard.isPending}
      />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-72 shrink-0 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--secondary))] p-3 space-y-2"
        >
          <Skeleton className="h-5 w-24 mb-3" />
          {[1, 2, 3].map((j) => (
            <div
              key={j}
              className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3.5 space-y-2"
            >
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Re-export Column type for use in board utils
export type { Column };
