export type DurationUnit = "day" | "hour" | "minute" | "second" | "millisecond";

export const DURATION_UNITS: readonly DurationUnit[];
export const UNIT_MS: Record<DurationUnit, number>;

/** The units a field shows, largest first. */
export function unitRange(
  largest: DurationUnit,
  smallest: DurationUnit,
): DurationUnit[];

export function splitDuration(
  total: number,
  units: readonly DurationUnit[],
): Partial<Record<DurationUnit, number>>;

export function joinDuration(
  parts: Partial<Record<DurationUnit, number | null>>,
): number;

export function segmentMax(
  unit: DurationUnit,
  units: readonly DurationUnit[],
  max: number | undefined,
): number;

export function clampDuration(
  value: number,
  min: number | undefined,
  max: number | undefined,
): number;

export function asciiDigits(text: string): string;

export function snapDuration(
  total: number,
  smallest: DurationUnit,
  step?: number,
): number;

export function stepDuration(
  total: number | null,
  unit: DurationUnit,
  direction: 1 | -1,
  options: {
    smallest: DurationUnit;
    step?: number;
    min?: number;
    max?: number;
    count?: number;
  },
): number;

export function typeDigit(
  buffer: string,
  digit: string,
  limit: number,
  maxDigits: number,
): { buffer: string; count: number; done: boolean };

export function segmentDigits(limit: number): number;

export function parseDuration(
  text: string,
  bareUnit?: DurationUnit,
): number | null | undefined;

export function formatISODuration(total: number): string;

export function formatCompactDuration(
  total: number,
  units: readonly DurationUnit[],
): string;

export type DurationFormatOptions = {
  locale?: string;
  style?: "long" | "short" | "narrow";
};

export function formatDuration(
  total: number,
  units: readonly DurationUnit[],
  options?: DurationFormatOptions,
): string;

export function unitLabel(
  unit: DurationUnit,
  locale: string | undefined,
  display: "long" | "short" | "narrow",
  count?: number,
): string;
