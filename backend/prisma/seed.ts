import { PrismaClient, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();

  const board = await prisma.board.create({
    data: {
      name: "Product Roadmap",
      columns: {
        create: [
          {
            name: "Backlog",
            position: 1,
            cards: {
              create: [
                {
                  title: "Research competitor features",
                  description: "Analyze top 3 competitors and document gaps.",
                  priority: Priority.LOW,
                  tags: ["research", "strategy"],
                  assignee: "Alice",
                  position: 1,
                },
                {
                  title: "Write API specification",
                  description: "Document all REST endpoints with examples.",
                  priority: Priority.MEDIUM,
                  tags: ["docs", "api"],
                  assignee: "Bob",
                  position: 2,
                },
                {
                  title: "Set up CI/CD pipeline",
                  description: "GitHub Actions: lint, test, deploy on merge.",
                  priority: Priority.HIGH,
                  tags: ["infra", "devops"],
                  position: 3,
                },
              ],
            },
          },
          {
            name: "In Progress",
            position: 2,
            cards: {
              create: [
                {
                  title: "Implement authentication",
                  description: "JWT-based auth with refresh tokens.",
                  priority: Priority.URGENT,
                  tags: ["backend", "security"],
                  assignee: "Alice",
                  position: 1,
                },
                {
                  title: "Design system tokens",
                  description: "Define color, spacing, and typography tokens.",
                  priority: Priority.HIGH,
                  tags: ["design", "frontend"],
                  assignee: "Carol",
                  position: 2,
                },
              ],
            },
          },
          {
            name: "Review",
            position: 3,
            cards: {
              create: [
                {
                  title: "Database schema migration",
                  description: "Migrate v1 schema to v2 with zero downtime.",
                  priority: Priority.HIGH,
                  tags: ["backend", "database"],
                  assignee: "Bob",
                  position: 1,
                },
              ],
            },
          },
          {
            name: "Done",
            position: 4,
            cards: {
              create: [
                {
                  title: "Project kickoff",
                  description: "Initial team meeting and goal alignment.",
                  priority: Priority.MEDIUM,
                  tags: ["planning"],
                  assignee: "Alice",
                  position: 1,
                },
                {
                  title: "Tech stack decision",
                  description: "Chose React + Fastify + Postgres.",
                  priority: Priority.MEDIUM,
                  tags: ["planning", "architecture"],
                  position: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Created board: ${board.name} (${board.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
