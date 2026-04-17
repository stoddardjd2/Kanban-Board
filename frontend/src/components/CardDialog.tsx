import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Card, Priority } from "../types";

const cardSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  tags: z.string().optional(),
  assignee: z.string().max(100).optional(),
});

type CardFormValues = z.infer<typeof cardSchema>;

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Card;
  columnId?: string;
  onSubmit: (values: {
    title: string;
    description: string;
    priority: Priority;
    tags: string[];
    assignee?: string;
  }) => void;
  isPending?: boolean;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function CardDialog({
  open,
  onOpenChange,
  card,
  onSubmit,
  isPending,
}: CardDialogProps) {
  const isEdit = !!card;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      title: card?.title ?? "",
      description: card?.description ?? "",
      priority: card?.priority ?? "MEDIUM",
      tags: card?.tags.join(", ") ?? "",
      assignee: card?.assignee ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: card?.title ?? "",
        description: card?.description ?? "",
        priority: card?.priority ?? "MEDIUM",
        tags: card?.tags.join(", ") ?? "",
        assignee: card?.assignee ?? "",
      });
    }
  }, [open, card, reset]);

  const handleFormSubmit = handleSubmit((values) => {
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    onSubmit({
      title: values.title,
      description: values.description ?? "",
      priority: values.priority as Priority,
      tags,
      assignee: values.assignee || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]" open={open}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Card" : "New Card"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Edit card details" : "Create a new card"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} id="card-form" className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-[rgb(var(--destructive))]">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Card title…"
              autoFocus
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-[rgb(var(--destructive))]">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description…"
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                placeholder="Name…"
                {...register("assignee")}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">
              Tags{" "}
              <span className="text-[rgb(var(--muted-foreground))] font-normal text-xs">
                (comma separated)
              </span>
            </Label>
            <Input
              id="tags"
              placeholder="frontend, api, bug…"
              {...register("tags")}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="card-form" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
