import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import {
  CreateCardSchema,
  UpdateCardSchema,
  MoveCardSchema,
  ReorderCardSchema,
  CardFilterSchema,
  IdParamSchema,
} from "../schemas.js";
import { moveCard, reorderCard } from "../services/cards.js";

export async function cardRoutes(app: FastifyInstance) {
  // GET /api/cards — filtered list
  app.get("/api/cards", async (req, reply) => {
    const query = CardFilterSchema.parse(req.query);

    const cards = await prisma.card.findMany({
      where: {
        ...(query.columnId ? { columnId: query.columnId } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.tag ? { tags: { has: query.tag } } : {}),
        ...(query.assignee ? { assignee: query.assignee } : {}),
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: "insensitive" } },
                { description: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ columnId: "asc" }, { position: "asc" }],
    });

    return reply.send(cards);
  });

  // POST /api/cards — create
  app.post("/api/cards", async (req, reply) => {
    const body = CreateCardSchema.parse(req.body);

    const last = await prisma.card.findFirst({
      where: { columnId: body.columnId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const card = await prisma.card.create({
      data: {
        ...body,
        position: (last?.position ?? 0) + 1,
      },
    });

    return reply.status(201).send(card);
  });

  // PATCH /api/cards/:id — edit
  app.patch<{ Params: { id: string } }>("/api/cards/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const body = UpdateCardSchema.parse(req.body);

    const card = await prisma.card.update({
      where: { id },
      data: body,
    });

    return reply.send(card);
  });

  // DELETE /api/cards/:id
  app.delete<{ Params: { id: string } }>(
    "/api/cards/:id",
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      await prisma.card.delete({ where: { id } });
      return reply.status(204).send();
    }
  );

  // POST /api/cards/:id/move — move to different column
  app.post<{ Params: { id: string } }>(
    "/api/cards/:id/move",
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const body = MoveCardSchema.parse(req.body);

      const card = await moveCard(
        id,
        body.columnId,
        body.beforeId,
        body.afterId
      );

      return reply.send(card);
    }
  );

  // POST /api/cards/:id/reorder — reorder within column
  app.post<{ Params: { id: string } }>(
    "/api/cards/:id/reorder",
    async (req, reply) => {
      const { id } = IdParamSchema.parse(req.params);
      const body = ReorderCardSchema.parse(req.body);

      const card = await reorderCard(id, body.beforeId, body.afterId);

      return reply.send(card);
    }
  );
}
