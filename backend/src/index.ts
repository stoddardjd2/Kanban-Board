import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { boardRoutes } from "./routes/boards.js";
import { columnRoutes } from "./routes/columns.js";
import { cardRoutes } from "./routes/cards.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
/** Max requests per IP per window (default: generous for local dev) */
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "300", 10);
/** Window length in ms (default: 1 minute) */
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS ?? "60000",
  10
);

const app = Fastify({
  logger: {
    level: LOG_LEVEL,
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
  genReqId: () => crypto.randomUUID(),
});

// ─── Plugins ──────────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? /^http:\/\/localhost:\d+$/,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
});

await app.register(rateLimit, {
  max: RATE_LIMIT_MAX,
  timeWindow: RATE_LIMIT_WINDOW_MS,
  allowList: (req) => {
    const path = req.url.split("?")[0] ?? "";
    return path === "/health";
  },
  errorResponseBuilder: (_req, context) => ({
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: `Too many requests. Retry after ${context.after}.`,
    },
  }),
});

// ─── Request logger ───────────────────────────────────────────────────────────

app.addHook("onResponse", (req, reply, done) => {
  req.log.info(
    {
      method: req.method,
      url: req.url,
      statusCode: reply.statusCode,
      responseTime: Math.round(reply.elapsedTime),
    },
    "request completed"
  );
  done();
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.setErrorHandler((error, req, reply) => {
  req.log.error(error);

  const err = error as Error & { statusCode?: number };

  if (err.statusCode === 429) {
    return reply.status(429).send({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: err.message || "Too many requests",
      },
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.flatten(),
      },
    });
  }

  const msg = err.message ?? "";
  if (
    msg.includes("Record to update not found") ||
    msg.includes("Record to delete not found") ||
    msg.includes("No record was found")
  ) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Resource not found" },
    });
  }

  return reply.status(500).send({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

await app.register(boardRoutes);
await app.register(columnRoutes);
await app.register(cardRoutes);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
