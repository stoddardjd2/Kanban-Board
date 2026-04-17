import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { CreateBoardSchema, IdParamSchema } from "../schemas.js";

export async function boardRoutes(app: FastifyInstance) {
  // GET /api/boards — list all boards
  app.get("/api/boards", async (_req, reply) => {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, createdAt: true },
    });
    return reply.send(boards);
  });

  // GET /api/boards/:id — get board with columns + cards
  app.get<{ Params: { id: string } }>("/api/boards/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    if (!board) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Board not found" },
      });
    }

    return reply.send(board);
  });

  // POST /api/boards — create a board
  app.post("/api/boards", async (req, reply) => {
    const body = CreateBoardSchema.parse(req.body);

    const board = await prisma.board.create({
      data: {
        name: body.name,
        columns: {
          create: [
            { name: "To Do", position: 1 },
            { name: "In Progress", position: 2 },
            { name: "Done", position: 3 },
          ],
        },
      },
      include: {
        columns: { orderBy: { position: "asc" } },
      },
    });

    return reply.status(201).send(board);
  });

  // PATCH /api/boards/:id — rename a board
  app.patch<{ Params: { id: string } }>("/api/boards/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const body = CreateBoardSchema.partial().parse(req.body);

    const board = await prisma.board.update({
      where: { id },
      data: body,
    });

    return reply.send(board);
  });

  // DELETE /api/boards/:id
  app.delete<{ Params: { id: string } }>("/api/boards/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    await prisma.board.delete({ where: { id } });
    return reply.status(204).send();
  });
}
