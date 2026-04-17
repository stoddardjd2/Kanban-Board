import { z } from "zod";

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// ─── Board ────────────────────────────────────────────────────────────────────

export const CreateBoardSchema = z.object({
  name: z.string().min(1).max(100),
});

// ─── Column ───────────────────────────────────────────────────────────────────

export const CreateColumnSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1).max(100),
});

export const UpdateColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// ─── Card ─────────────────────────────────────────────────────────────────────

export const CreateCardSchema = z.object({
  columnId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  priority: PriorityEnum.optional().default("MEDIUM"),
  tags: z.array(z.string().max(50)).optional().default([]),
  assignee: z.string().max(100).optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: PriorityEnum.optional(),
  tags: z.array(z.string().max(50)).optional(),
  assignee: z.string().max(100).nullable().optional(),
});

export const MoveCardSchema = z.object({
  columnId: z.string().cuid(),
  beforeId: z.string().cuid().optional(),
  afterId: z.string().cuid().optional(),
});

export const ReorderCardSchema = z.object({
  beforeId: z.string().cuid().optional(),
  afterId: z.string().cuid().optional(),
});

export const CardFilterSchema = z.object({
  columnId: z.string().cuid().optional(),
  priority: PriorityEnum.optional(),
  tag: z.string().optional(),
  assignee: z.string().optional(),
  q: z.string().optional(),
});

// ─── Params ───────────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({
  id: z.string().cuid(),
});
