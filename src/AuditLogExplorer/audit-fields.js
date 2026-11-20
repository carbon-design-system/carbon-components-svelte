// @ts-check
import { ACTIONS, OUTCOMES } from "./memory-source.js";

/**
 * The fields of the in-memory source, as the explorer takes them. `actor`
 * lists no values: its facet and its query bar learn them from the counts a
 * source returns, as they would from a server.
 *
 * @type {ReadonlyArray<import("./audit-state.js").AuditField>}
 */
export const AUDIT_FIELDS = [
  {
    key: "outcome",
    label: "Outcome",
    description: "Whether the request was allowed",
    facet: true,
    values: [...OUTCOMES],
    valueLabels: { success: "Success", failure: "Failure", denied: "Denied" },
  },
  {
    key: "action",
    label: "Action",
    description: "What was done",
    facet: true,
    values: ACTIONS,
  },
  {
    key: "actor",
    label: "Actor",
    description: "Who did it",
    facet: true,
    values: [],
  },
  { key: "target", label: "Target", description: "What it was done to" },
  {
    key: "ip",
    label: "IP address",
    description: "Where the request came from",
  },
];
