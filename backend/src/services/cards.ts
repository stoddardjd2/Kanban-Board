import { prisma } from "../db.js";
import { computePosition } from "./rank.js";

export { computePosition };

const REBALANCE_THRESHOLD = 1e-10;
const REBALANCE_SPACING = 1000;

/**
 * Rebalance all cards in a column, spacing them evenly.
 * Called inside the same transaction when a position underflows.
 */
async function rebalanceColumn(
  tx: typeof prisma,
  columnId: string
): Promise<void> {
  const cards = await tx.card.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  await Promise.all(
    cards.map((card, i) =>
      tx.card.update({
        where: { id: card.id },
        data: { position: (i + 1) * REBALANCE_SPACING },
      })
    )
  );
}

/**
 * Move a card to a different column, positioning it between beforeId/afterId.
 * Returns the updated card.
 */
export async function moveCard(
  cardId: string,
  targetColumnId: string,
  beforeId?: string,
  afterId?: string
) {
  return prisma.$transaction(async (tx) => {
    const [beforeCard, afterCard] = await Promise.all([
      beforeId ? tx.card.findUnique({ where: { id: beforeId } }) : null,
      afterId ? tx.card.findUnique({ where: { id: afterId } }) : null,
    ]);

    let newPosition = computePosition(beforeCard, afterCard);

    if (newPosition < REBALANCE_THRESHOLD) {
      await rebalanceColumn(tx as typeof prisma, targetColumnId);
      const [refreshedBefore, refreshedAfter] = await Promise.all([
        beforeId ? tx.card.findUnique({ where: { id: beforeId } }) : null,
        afterId ? tx.card.findUnique({ where: { id: afterId } }) : null,
      ]);
      newPosition = computePosition(refreshedBefore, refreshedAfter);
    }

    return tx.card.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, position: newPosition },
    });
  });
}

/**
 * Reorder a card within its current column.
 */
export async function reorderCard(
  cardId: string,
  beforeId?: string,
  afterId?: string
) {
  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  return prisma.$transaction(async (tx) => {
    const [beforeCard, afterCard] = await Promise.all([
      beforeId ? tx.card.findUnique({ where: { id: beforeId } }) : null,
      afterId ? tx.card.findUnique({ where: { id: afterId } }) : null,
    ]);

    let newPosition = computePosition(beforeCard, afterCard);

    if (newPosition < REBALANCE_THRESHOLD) {
      await rebalanceColumn(tx as typeof prisma, card.columnId);
      const [refreshedBefore, refreshedAfter] = await Promise.all([
        beforeId ? tx.card.findUnique({ where: { id: beforeId } }) : null,
        afterId ? tx.card.findUnique({ where: { id: afterId } }) : null,
      ]);
      newPosition = computePosition(refreshedBefore, refreshedAfter);
    }

    return tx.card.update({
      where: { id: cardId },
      data: { position: newPosition },
    });
  });
}
