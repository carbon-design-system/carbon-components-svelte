// @ts-check
// One time range for a page of charts: a store of `{ from, to, preset }`,
// set from a preset such as "7d" or from two dates, that every chart reads
// as its x domain and every query reads as its window.

import { get, writable } from "svelte/store";

const UNITS = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
const PRESET = /^(\d+)([mhdw])$/;

/**
 * The length of a preset in milliseconds, or `null` when it is not one.
 * @param {string} preset
 */
export function presetLength(preset) {
  const match = PRESET.exec(preset);
  if (!match) return null;
  return Number(match[1]) * UNITS[/** @type {keyof typeof UNITS} */ (match[2])];
}

/**
 * The words for a preset: "Last 7 days".
 * @param {string} preset
 * @param {string} [locale]
 */
export function presetLabel(preset, locale) {
  const match = PRESET.exec(preset);
  if (!match) return preset;
  const count = Number(match[1]);
  const unit = { m: "minute", h: "hour", d: "day", w: "week" }[
    /** @type {keyof typeof UNITS} */ (match[2])
  ];
  const format = new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "long",
  });
  return `Last ${format.format(count)}`;
}

/**
 * Write a range as one short string for a URL: the preset, or two ISO dates.
 * @param {import("./time-range.d.ts").TimeRangeValue} value
 */
export function timeRangeToParam(value) {
  return (
    value.preset ?? `${value.from.toISOString()}..${value.to.toISOString()}`
  );
}

/**
 * Read a range back from `timeRangeToParam`, or `undefined` for junk.
 * @param {string} raw
 * @returns {string | [Date, Date] | undefined}
 */
export function timeRangeFromParam(raw) {
  if (PRESET.test(raw)) return raw;
  const [from, to] = raw.split("..").map((part) => new Date(part));
  if (
    !from ||
    !to ||
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime())
  )
    return undefined;
  return [from, to];
}

/**
 * @param {import("./time-range.d.ts").TimeRangeOptions} [options]
 * @returns {import("./time-range.d.ts").TimeRange}
 */
export function createTimeRange(options = {}) {
  const {
    presets = ["1h", "24h", "7d", "30d"],
    initial = presets[0],
    now = () => Date.now(),
  } = options;

  /** @param {string | readonly [Date | number, Date | number]} next */
  function resolve(next) {
    if (typeof next === "string") {
      const length = presetLength(next);
      if (length === null) throw new Error(`Not a time range preset: ${next}`);
      const to = new Date(now());
      return { from: new Date(to.getTime() - length), to, preset: next };
    }
    const [a, b] = next.map((d) => new Date(d));
    return a <= b
      ? { from: a, to: b, preset: null }
      : { from: b, to: a, preset: null };
  }

  const store = writable(resolve(initial));
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let timer;

  return {
    subscribe: store.subscribe,
    presets,
    set(next) {
      store.set(resolve(next));
    },
    refresh() {
      const current = get(store);
      if (current.preset) store.set(resolve(current.preset));
    },
    shift(steps) {
      const { from, to } = get(store);
      const length = to.getTime() - from.getTime();
      store.set(
        resolve([
          from.getTime() + steps * length,
          to.getTime() + steps * length,
        ]),
      );
    },
    refreshEvery(ms) {
      clearInterval(timer);
      timer = ms > 0 ? setInterval(() => this.refresh(), ms) : undefined;
      return () => clearInterval(timer);
    },
  };
}
