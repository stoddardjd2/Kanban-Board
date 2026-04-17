import * as React from "react";
import { Plus, Kanban } from "lucide-react";
import { useBoards, useCreateBoard } from "@/hooks/useBoard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

interface BoardSelectorProps {
  activeBoardId: string | null;
  onSelect: (id: string) => void;
}

export function BoardSelector({ activeBoardId, onSelect }: BoardSelectorProps) {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createBoard.mutate(newName.trim(), {
      onSuccess: (board) => {
        setNewName("");
        setCreating(false);
        onSelect(board.id);
      },
    });
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-y-auto">
      <div className="px-4 py-4 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2">
          <Kanban className="h-5 w-5 text-[rgb(var(--primary))]" />
          <span className="font-bold text-base tracking-tight text-[rgb(var(--foreground))]">
            Ravenna
          </span>
        </div>
      </div>

      <div className="flex-1 px-2 py-2 space-y-0.5">
        <p className="px-2 py-1.5 text-[10px] font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wider">
          Boards
        </p>

        {isLoading ? (
          <>
            <Skeleton className="h-8 mx-2 mb-1" />
            <Skeleton className="h-8 mx-2 mb-1" />
          </>
        ) : (
          boards?.map((board) => (
            <button
              key={board.id}
              onClick={() => onSelect(board.id)}
              className={`w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors ${
                activeBoardId === board.id
                  ? "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] font-medium"
                  : "text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))]"
              }`}
            >
              {board.name}
            </button>
          ))
        )}
      </div>

      <div className="p-2 border-t border-[rgb(var(--border))]">
        {creating ? (
          <form onSubmit={handleCreate} className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Board name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" className="flex-1 h-6 text-xs">
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreating(true)}
            className="w-full h-8 text-xs justify-start text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Board
          </Button>
        )}
      </div>
    </aside>
  );
}
