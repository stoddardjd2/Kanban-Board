import * as React from "react";
import { Toaster } from "sonner";
import { Board } from "./components/Board";
import { BoardSelector } from "./components/BoardSelector";
import { ThemeToggle } from "./components/ThemeToggle";
import { useBoards } from "./hooks/useBoard";
import { Skeleton } from "./components/ui/skeleton";
import { Kanban, Keyboard } from "lucide-react";

function KeyboardHint() {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors px-2 py-1 rounded"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>
      {visible && (
        <div className="absolute right-0 top-8 z-50 w-56 rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--popover))] p-3 shadow-[var(--shadow-lg)] text-xs space-y-1.5">
          <p className="font-semibold text-[rgb(var(--foreground))] mb-2">Keyboard shortcuts</p>
          <div className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">New card</span><kbd className="font-mono bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded">N</kbd></div>
          <div className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">Focus search</span><kbd className="font-mono bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded">/</kbd></div>
          <div className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">Close / cancel</span><kbd className="font-mono bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded">Esc</kbd></div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { data: boards, isLoading } = useBoards();
  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(null);

  // Auto-select first board
  React.useEffect(() => {
    if (!activeBoardId && boards && boards.length > 0) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);

  const activeBoard = boards?.find((b) => b.id === activeBoardId);

  return (
    <div className="flex h-dvh overflow-hidden bg-[rgb(var(--background))]">
      <BoardSelector activeBoardId={activeBoardId} onSelect={setActiveBoardId} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] shrink-0 h-14">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : activeBoard ? (
              <h1 className="text-base font-semibold text-[rgb(var(--foreground))] truncate">
                {activeBoard.name}
              </h1>
            ) : (
              <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
                <Kanban className="h-5 w-5" />
                <span className="text-sm">Select or create a board</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <KeyboardHint />
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {activeBoardId ? (
            <Board boardId={activeBoardId} />
          ) : (
            <EmptyState onCreateBoard={() => {}} />
          )}
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-[rgb(var(--popover))] border-[rgb(var(--border))] text-[rgb(var(--popover-foreground))]",
          },
        }}
      />
    </div>
  );
}

function EmptyState({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <Kanban className="h-12 w-12 text-[rgb(var(--muted-foreground))]" />
      <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">
        No board selected
      </h2>
      <p className="text-sm text-[rgb(var(--muted-foreground))] max-w-xs">
        Create a new board from the sidebar or select an existing one to get started.
      </p>
      <button
        onClick={onCreateBoard}
        className="text-sm text-[rgb(var(--primary))] hover:underline"
      >
        Create your first board →
      </button>
    </div>
  );
}
