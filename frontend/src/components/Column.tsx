import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { KanbanCard } from "./Card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Card as CardType } from "../types";

interface ColumnProps {
  id: string;
  name: string;
  cards: CardType[];
  isVirtual?: boolean;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: CardType) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanColumn({
  id,
  name,
  cards,
  isVirtual = false,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteColumn,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={cn(
        "flex flex-col w-72 shrink-0 rounded-[var(--radius-lg)]",
        "bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]",
        "transition-colors duration-150",
        isOver && "bg-[rgb(var(--accent))] border-[rgb(var(--primary))]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-semibold text-[rgb(var(--foreground))] truncate">
            {name}
          </h2>
          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-[rgb(var(--muted))] text-[10px] font-semibold text-[rgb(var(--muted-foreground))] px-1.5">
            {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {!isVirtual && (
            <AddButton
              label={`Add card to ${name}`}
              onClick={() => onAddCard(id)}
              iconOnly
            />
          )}
          {!isVirtual && onDeleteColumn && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeleteColumn(id)}
                aria-label={`Delete ${name} column`}
                className="h-7 w-7 cursor-pointer hover:text-[rgb(var(--destructive))] hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Card list */}
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-col gap-2 p-2.5 flex-1 min-h-[80px] overflow-y-auto",
            "max-h-[calc(100vh-220px)]"
          )}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}

          {cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                No cards yet
              </p>
              {!isVirtual && (
                <AddButton
                  label="Add card"
                  onClick={() => onAddCard(id)}
                  className="mt-2"
                />
              )}
            </div>
          )}
        </div>
      </SortableContext>

      {/* Footer add button */}
      {!isVirtual && cards.length > 0 && (
        <div className="p-2.5 pt-0">
          <AddButton
            label="Add card"
            onClick={() => onAddCard(id)}
            fullWidth
          />
        </div>
      )}
    </div>
  );
}

// ─── Shared animated add button ───────────────────────────────────────────────

interface AddButtonProps {
  label: string;
  onClick: () => void;
  iconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
}

function AddButton({ label, onClick, iconOnly, fullWidth, className }: AddButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  if (iconOnly) {
    return (
      <motion.div
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        className="relative"
      >
        {/* Glow ring on hover */}
        <motion.span
          // className="absolute inset-0 rounded-[var(--radius-sm)] bg-[rgb(var(--primary))]"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={hovered ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className="h-7 w-7 cursor-pointer relative z-10 hover:shadow-2xl"
          style={
            hovered
              ? {
                  backgroundColor:
                    "color-mix(in srgb, rgb(var(--foreground)) 10%, transparent)",
                }
              : undefined
          }
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: fullWidth ? 1.01 : 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={cn("relative", fullWidth && "w-full", className)}
    >
      {/* Animated left accent bar */}
      <motion.span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-[rgb(var(--primary))]"
        initial={{ height: 0, opacity: 0 }}
        animate={
          hovered
            ? { height: "60%", opacity: 1 }
            : { height: 0, opacity: 0 }
        }
        transition={{ duration: 0.15 }}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        aria-label={label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "h-8 text-xs text-[rgb(var(--muted-foreground))] justify-start cursor-pointer",
          "hover:text-[rgb(var(--primary))] hover:bg-[rgb(var(--accent))]",
          fullWidth && "w-full"
        )}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        {label}
      </Button>
    </motion.div>
  );
}
