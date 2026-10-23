export function sma(
  values: ReadonlyArray<number>,
  period: number,
): Array<number | null>;
export function ema(
  values: ReadonlyArray<number>,
  period: number,
): Array<number | null>;
export function bollinger(
  values: ReadonlyArray<number>,
  period?: number,
  k?: number,
): {
  middle: Array<number | null>;
  upper: Array<number | null>;
  lower: Array<number | null>;
};
export function rsi(
  values: ReadonlyArray<number>,
  period?: number,
): Array<number | null>;
export function macd(
  values: ReadonlyArray<number>,
  fast?: number,
  slow?: number,
  signal?: number,
): {
  macd: Array<number | null>;
  signal: Array<number | null>;
  histogram: Array<number | null>;
};
