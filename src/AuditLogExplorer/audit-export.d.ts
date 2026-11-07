import type { AuditEvent, AuditQuery, AuditSource } from "./audit-source.js";

export const CSV_COLUMNS: readonly [
  "id",
  "time",
  "actor",
  "action",
  "target",
  "outcome",
  "ip",
  "payload",
];

/** One CSV cell, quoted when it needs it and defanged when a spreadsheet would run it. */
export function csvCell(value: unknown): string;

export function toCsv(events: ReadonlyArray<AuditEvent>): string;

export function toJson(events: ReadonlyArray<AuditEvent>): string;

/** Walk a source's pages until `limit` events are read or it runs out. */
export function collectEvents(
  source: AuditSource,
  query: Omit<AuditQuery, "cursor" | "limit" | "facets">,
  options?: {
    limit?: number;
    pageSize?: number;
    onProgress?: (count: number) => void;
  },
): Promise<{ events: AuditEvent[]; truncated: boolean }>;
