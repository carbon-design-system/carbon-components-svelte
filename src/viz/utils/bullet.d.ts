export type BulletInput = {
  value: number;
  target?: number | null;
  /** @default 0 */
  min?: number;
  /** Defaults to the largest of the value, the target, and the last band. */
  max?: number;
  /** Ascending upper bounds of the qualitative bands. */
  bands?: ReadonlyArray<number>;
};

export type BulletBand = {
  from: number;
  to: number;
  /** Width as a percentage of the domain. */
  pct: number;
  index: number;
};

export type BulletGeometry = {
  domain: [number, number];
  /** Length of the measure, 0 to 100. */
  valuePct: number;
  /** Position of the target, 0 to 100, or `null` without a target. */
  targetPct: number | null;
  bands: BulletBand[];
};

/**
 * Positions for a bullet graph, as percentages of the `[min, max]` domain.
 * Without `max`, the domain ends at the largest of the value, the target, and
 * the last band. Bands are ascending upper bounds; the last band always runs
 * to the end of the domain. Everything is clamped to the domain.
 */
export function getBulletGeometry(input: BulletInput): BulletGeometry;
