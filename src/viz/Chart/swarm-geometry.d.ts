import type { ChartScales } from "./model.js";

export type SwarmInput = {
  /** The category, as it appears on the x scale. */
  x: string | number;
  values: ReadonlyArray<number | null | undefined>;
};

export type SwarmDot = {
  /** Index into the entry's values. */
  index: number;
  value: number;
  /** Position along the value axis. */
  along: number;
  /** Position across the category slot. */
  across: number;
};

export type SwarmShape = {
  key: string;
  slot: number;
  center: number;
  radius: number;
  dots: SwarmDot[];
};

/** One dot per value per category, spread so none overlap. */
export function buildSwarms(
  swarms: ReadonlyArray<SwarmInput>,
  scales: ChartScales,
  options?: { radius?: number; padding?: number },
): SwarmShape[];
