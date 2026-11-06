export type RailItem = {
  id: string;
  /** Where the card would sit beside its range. */
  top: number;
  height: number;
};

/**
 * Place the cards of the margin rail: each at the top of its range, pushed
 * down to clear the card above it. The cards keep the order given. Returns
 * the top of each card by id, and the height of the rail.
 */
export function layoutRail(
  items: ReadonlyArray<RailItem>,
  gap?: number,
): { tops: Record<string, number>; height: number };
