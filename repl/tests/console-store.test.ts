import { beforeEach, expect, test } from "bun:test";
import { get } from "svelte/store";
import {
  clearConsole,
  collapsedGroups,
  counts,
  entries,
  ingest,
  levels,
  preserve,
  query,
  runStarted,
  visible,
} from "../src/console/store.js";

const str = (v: string) => ({ t: "string", v });
let id = 0;
const msg = (level: string, text: string, extra = {}) => ({
  id: ++id,
  kind: "message",
  level,
  groups: [],
  args: [str(text)],
  ...extra,
});

beforeEach(() => {
  clearConsole();
  preserve.set(false);
  query.set("");
  levels.set(new Set(["error", "warn", "info", "log", "debug"]));
});

test("identical consecutive messages collapse into one row with a count", () => {
  ingest([
    msg("log", "tick"),
    msg("log", "tick"),
    msg("log", "tock"),
    msg("log", "tock"),
  ]);
  expect(get(entries).map((e) => [e.args[0].v, e.repeat ?? 1])).toEqual([
    ["tick", 2],
    ["tock", 2],
  ]);
});

test("console.clear clears, unless Preserve log is on", () => {
  ingest([
    msg("log", "a"),
    { id: ++id, kind: "clear", level: "log", args: [], groups: [] },
  ]);
  expect(get(entries).map((e) => e.text)).toEqual(["Console was cleared"]);
  preserve.set(true);
  ingest([
    msg("log", "b"),
    { id: ++id, kind: "clear", level: "log", args: [], groups: [] },
  ]);
  expect(get(entries).at(-1).text).toContain("ignored");
});

test("a new run clears, or adds a separator when preserving", () => {
  ingest([msg("log", "a")]);
  runStarted();
  expect(get(entries)).toEqual([]);
  preserve.set(true);
  ingest([msg("log", "b")]);
  runStarted();
  expect(get(entries).at(-1).kind).toBe("separator");
});

test("level filter, text search and collapsed groups decide what's visible", () => {
  ingest([
    msg("error", "bad thing"),
    msg("warn", "careful"),
    {
      id: 99,
      kind: "group",
      level: "log",
      groupId: 99,
      collapsed: true,
      groups: [],
      args: [str("G")],
    },
    msg("log", "inside", { groups: [99] }),
  ]);
  expect(get(counts)).toEqual({ error: 1, warn: 1 });
  expect(get(collapsedGroups).has(99)).toBe(true);
  expect(get(visible).map((e) => e.args[0].v)).toEqual([
    "bad thing",
    "careful",
    "G",
  ]);
  levels.set(new Set(["warn"]));
  expect(get(visible).map((e) => e.args[0].v)).toEqual(["careful"]);
  levels.set(new Set(["error", "warn", "log"]));
  query.set("BAD");
  expect(get(visible).map((e) => e.args[0].v)).toEqual(["bad thing"]);
});
