import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import {
  CreateColumnSchema,
  UpdateColumnSchema,
  IdParamSchema,
} from "../schemas.js";

export async function columnRoutes(app: FastifyInstance) {
  // POST /api/columns — create column in a board
  app.post("/api/columns", async (req, reply) => {
    const body = CreateColumnSchema.parse(req.body);

    // Find the current max position to append at end
    const last = await prisma.column.findFirst({
      where: { boardId: body.boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const column = await prisma.column.create({
      data: {
        boardId: body.boardId,
        name: body.name,
        position: (last?.position ?? 0) + 1,
      },
    });

    return reply.status(201).send(column);
  });

  // PATCH /api/columns/:id — rename column
  app.patch<{ Params: { id: string } }>("/api/columns/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const body = UpdateColumnSchema.parse(req.body);

    const column = await prisma.column.update({
      where: { id },
      data: body,
    });

    return reply.send(column);
  });

  // DELETE /api/columns/:id
  app.delete<{ Params: { id: string } }>("/api/columns/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    await prisma.column.delete({ where: { id } });
    return reply.status(204).send();
  });
}
