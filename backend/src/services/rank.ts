/**
 * Compute a new fractional position between two neighbors.
 * This is a pure function with no DB dependency — easy to unit test.
 *
 * - No neighbors  → 1.0
 * - Only after    → after.position / 2  (prepend)
 * - Only before   → before.position + 1 (append)
 * - Both          → (before.position + after.position) / 2 (insert between)
 */
export function computePosition(
  before: { position: number } | null,
  after: { position: number } | null
): number {
  if (!before && !after) return 1.0;
  if (!before && after) return after.position / 2;
  if (before && !after) return before.position + 1;
  return (before!.position + after!.position) / 2;
}
