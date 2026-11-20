export type AuditOutcome = "success" | "failure" | "denied";

/** One audit record. */
export type AuditEvent = {
  /** Stable and unique. A string, so a server may use any id scheme. */
  id: string;
  /** ISO 8601 instant in UTC, such as `2026-11-04T09:30:12.481Z`. */
  time: string;
  /** Who did it: a user, a service account or a key. */
  actor: string;
  /** What was done, such as `iam.policy.update`. */
  action: string;
  /** What it was done to, such as `bucket/logs-0042`. */
  target: string;
  outcome: AuditOutcome;
  ip: string;
  /** The request, as the service saw it. Any JSON value. */
  payload: unknown;
};

/** A structured test the user chose, in the shape `TokenSearch` and `FilterPanel` share. */
export type AuditFilter = {
  key: string;
  op: "eq" | "gt" | "gte" | "lt" | "lte" | "between";
  values: string[];
  negated: boolean;
};

/**
 * The time window. Both ends are instants in UTC. An open end is `null`: an
 * open `to` is "up to now", and it stays open while a live tail runs.
 */
export type AuditRange = { from: string | null; to: string | null };

export type AuditQuery = {
  /**
   * The free text, as `TokenSearch` writes it: words, `"quoted phrases"` and
   * `-negated` words, all of which must match. Qualifiers are in `filters`.
   */
  q: string;
  /** Qualifiers and facets, merged. A repeated key is "and"; the values of one filter are "any of". */
  filters: AuditFilter[];
  range: AuditRange;
  /** The `nextCursor` of the previous page. Omit for the first page. */
  cursor?: string | null;
  limit: number;
  signal?: AbortSignal;
  /** The fields to count on the first page: `facets` in the result. */
  facets?: string[];
};

export type AuditPage = {
  /** Newest first. */
  events: AuditEvent[];
  /** Opaque. `null` when there is nothing older. */
  nextCursor: string | null;
  /** How many events match, if the server can say. First page only. */
  total?: number;
  /**
   * How many events each value would show, by field and value, ignoring the
   * field's own filter (disjunctive counts). First page only.
   */
  facets?: Record<string, Record<string, number>>;
};

export type AuditTailHandlers = {
  /** New events, oldest first. */
  onEvents: (events: AuditEvent[]) => void;
  signal: AbortSignal;
};

export type AuditSource = {
  /** One page of a query, newest first. */
  query(query: AuditQuery): Promise<AuditPage>;
  /**
   * Stream events newer than now that match `query` (its `cursor` is
   * ignored). Ends when `signal` aborts.
   */
  tail?(query: AuditQuery, handlers: AuditTailHandlers): void;
};
