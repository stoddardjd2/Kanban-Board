import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Pencil, Trash2, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn, PRIORITY_CONFIG } from "@/lib/utils";
import type { Card as CardType } from "../types";

interface CardProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (cardId: string) => void;
  isDragOverlay?: boolean;
}

function PriorityDot({ priority }: { priority: CardType["priority"] }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", cfg.dot)}
      title={cfg.label}
      aria-label={`Priority: ${cfg.label}`}
    />
  );
}

export function KanbanCard({
  card,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging}
      className={cn(
        "group relative rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))]",
        "p-3.5 shadow-[var(--shadow-card)] select-none",
        "transition-all duration-150",
        isDragging && "opacity-40 ring-2 ring-[rgb(var(--ring))]",
        isDragOverlay && "rotate-1 shadow-[var(--shadow-lg)] opacity-100 ring-2 ring-[rgb(var(--ring))]",
        !isDragging && !isDragOverlay && "hover:shadow-[var(--shadow-md)] hover:border-[rgb(var(--neutral-300))] dark:hover:border-[rgb(var(--neutral-600))]"
      )}
      aria-label={`Card: ${card.title}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-70 cursor-grab active:cursor-grabbing p-1 rounded transition-opacity touch-none"
        aria-label="Drag to reorder"
        tabIndex={0}
      >
        <GripVertical className="h-3.5 w-3.5 text-[rgb(var(--muted-foreground))]" />
      </button>

      <div className="pl-4">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-[rgb(var(--card-foreground))] line-clamp-2 flex-1">
            {card.title}
          </h3>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(card)}
                aria-label="Edit card"
                className="h-6 w-6 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(card.id)}
                aria-label="Delete card"
                className="h-6 w-6 cursor-pointer hover:text-[rgb(var(--destructive))] hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))] line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={card.priority} />
            <span
              className={cn(
                "text-xs font-medium",
                PRIORITY_CONFIG[card.priority].color
              )}
            >
              {PRIORITY_CONFIG[card.priority].label}
            </span>
          </div>

          {card.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {card.tags.length > 3 && (
            <span className="text-[10px] text-[rgb(var(--muted-foreground))]">
              +{card.tags.length - 3}
            </span>
          )}

          {card.assignee && (
            <div className="ml-auto flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
              <User className="h-3 w-3" />
              <span>{card.assignee}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3.5 space-y-2">
      <div className="h-3.5 bg-[rgb(var(--muted))] rounded animate-pulse w-3/4" />
      <div className="h-3 bg-[rgb(var(--muted))] rounded animate-pulse w-full" />
      <div className="h-3 bg-[rgb(var(--muted))] rounded animate-pulse w-1/2" />
    </div>
  );
}
