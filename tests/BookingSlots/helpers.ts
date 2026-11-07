import { slotsFromWindows } from "carbon-components-svelte/BookingSlots/booking-slots.js";

/** 2026-11-06 12:00 UTC, a Friday: 07:00 in New York. */
export const NOW = "2026-11-06T12:00:00Z";

/** Every half hour from 09:00 to 11:00 in New York (14:00 to 16:00 UTC). */
export function morningOn(day: string) {
  return slotsFromWindows([
    { start: `${day}T14:00:00Z`, end: `${day}T16:00:00Z` },
  ]);
}

export const SLOTS = [
  ...morningOn("2026-11-09"),
  ...morningOn("2026-11-11"),
  ...morningOn("2026-11-13"),
];

/** Resolves a month's slots after `ms`. */
export function slow<T>(value: T, ms: number) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}
