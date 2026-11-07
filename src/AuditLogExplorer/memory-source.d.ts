import type { AuditSource } from "./audit-source.js";

export const ACTORS: string[];
export const ACTIONS: string[];
export const OUTCOMES: readonly ["success", "failure", "denied"];
export const TARGETS: string[];
export const IPS: string[];

export type MemorySourceOptions = {
  /** How many events the log holds. @default 1_000_000 */
  size?: number;
  /** Changes which events there are, and nothing else. */
  seed?: number;
  /** The instant of the newest event, in epoch milliseconds. Defaults to the clock. */
  now?: number;
  /** How far back the events reach. @default 30 */
  spanDays?: number;
  /** The simulated round trip, in milliseconds. @default 0 */
  latency?: number;
  /** Events a second the tail produces. @default 20 */
  liveRate?: number;
};

/**
 * An in-memory `AuditSource` over synthetic events. Nothing is stored per
 * event: each field is a function of the event's position, so a million
 * events cost five typed columns, built on the first query, and an event
 * object is made only for the page that is returned.
 */
export function createMemorySource(
  options?: MemorySourceOptions,
): AuditSource & { size: number; columnsBuilt: () => boolean };
