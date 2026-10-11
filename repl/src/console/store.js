// Console state for the shell: structured entries from the preview (see
// sandbox/inspect/console.js), filters, group collapse, repeat collapsing and
// run separators. Values stay in the iframe; entries hold previews + handles.

import { derived, get, writable } from "svelte/store";

const MAX_ENTRIES = 5000;
export const LEVELS = ["error", "warn", "info", "log", "debug"];

export const entries = writable(/** @type {any[]} */ ([]));
export const preserve = writable(false);
export const levels = writable(new Set(LEVELS));
export const query = writable("");
export const collapsedGroups = writable(new Set());
export const droppedTotal = writable(0);
/** Performance channel: run summaries, slow interactions, long frames. */
export const perfRuns = writable(/** @type {any[]} */ ([]));
export const perfInteractions = writable(/** @type {any[]} */ ([]));
export const perfFrames = writable(/** @type {any[]} */ ([]));
export const perfHotspots = writable(/** @type {any[]} */ ([]));
const MAX_PERF = 200;

export function addPerf(store, items) {
  store.update((list) => [...list, ...items].slice(-MAX_PERF));
}

export function clearPerf() {
  perfRuns.set([]);
  perfInteractions.set([]);
  perfFrames.set([]);
  perfHotspots.set([]);
}

/** Network requests from the preview, merged start/end by id. */
export const network = writable(/** @type {any[]} */ ([]));
const MAX_REQUESTS = 500;

export function netEvent(message) {
  network.update((list) => {
    if (message.phase === "start")
      return [...list, { ...message }].slice(-MAX_REQUESTS);
    return list.map((r) =>
      r.id === message.id ? { ...r, ...message, done: true } : r,
    );
  });
}

/** Preview storage shims (localStorage/sessionStorage) as [key, value] entries. */
export const storage = writable(
  /** @type {{ area: string; entries: [string, string][] }[]} */ ([]),
);

/** Latest accessibility findings for the preview (replaced on each audit). */
export const a11y = writable(/** @type {any[]} */ ([]));
/** Carbon component events from the preview (instrumented dispatchers). */
export const events = writable(/** @type {any[]} */ ([]));
const MAX_EVENTS = 2000;

let localId = 0;
let runCount = 0;

/** Plain text of an entry, for search and repeat detection. */
export function entryText(entry) {
  const parts = (entry.parts ?? []).map((p) =>
    "text" in p ? p.text : previewText(p.value),
  );
  return [
    ...parts,
    ...(entry.args ?? []).map(previewText),
    entry.text ?? "",
  ].join(" ");
}

export function previewText(p) {
  if (!p) return "";
  if (
    p.t === "string" ||
    p.t === "number" ||
    p.t === "bigint" ||
    p.t === "boolean" ||
    p.t === "symbol"
  )
    return p.v;
  if (p.t === "object") return p.desc;
  return p.t;
}

function signature(entry) {
  return `${entry.kind}|${entry.level}|${entry.groups?.join(",")}|${entry.source?.file}:${entry.source?.line}|${entryText(entry)}`;
}

function append(list, incoming) {
  for (const entry of incoming) {
    const last = list.at(-1);
    if (
      last &&
      entry.kind === "message" &&
      last.kind === "message" &&
      !entry.frames?.length &&
      signature(last) === signature(entry)
    ) {
      list[list.length - 1] = {
        ...last,
        repeat: (last.repeat ?? 1) + 1,
        time: entry.time,
      };
      continue;
    }
    list.push(entry);
  }
  return list.length > MAX_ENTRIES ? list.slice(-MAX_ENTRIES) : list;
}

/** Entries from the preview (one batch per frame). */
export function ingest(incoming) {
  const carbonEvents = incoming.filter((e) => e.kind === "event");
  if (carbonEvents.length) {
    events.update((list) => [...list, ...carbonEvents].slice(-MAX_EVENTS));
  }
  const batch = carbonEvents.length
    ? incoming.filter((e) => e.kind !== "event")
    : incoming;
  if (!batch.length) return;
  entries.update((list) => {
    let next = list;
    let pendingBatch = [];
    for (const entry of batch) {
      if (entry.kind === "clear") {
        next = append(next, pendingBatch);
        pendingBatch = [];
        next = get(preserve)
          ? append(next, [
              system(
                "info",
                "console.clear() was ignored because Preserve log is on",
              ),
            ])
          : [system("info", "Console was cleared")];
        continue;
      }
      if (entry.kind === "group" && entry.collapsed) {
        collapsedGroups.update((s) => new Set(s).add(entry.groupId));
      }
      pendingBatch.push(entry);
    }
    return append(next === list ? [...list] : next, pendingBatch);
  });
}

export function system(level, text, extra = {}) {
  return {
    id: `s${++localId}`,
    kind: "system",
    level,
    text,
    time: Date.now(),
    groups: [],
    ...extra,
  };
}

export function push(entry) {
  entries.update((list) =>
    append(
      [...list],
      [{ id: `l${++localId}`, time: Date.now(), groups: [], ...entry }],
    ),
  );
}

export function runStarted() {
  runCount += 1;
  if (get(preserve))
    push(system("separator", `Run ${runCount}`, { kind: "separator" }));
  else {
    entries.set([]);
    events.set([]);
    network.set([]);
    collapsedGroups.set(new Set());
  }
}

export function clearEvents() {
  events.set([]);
}

export function clearConsole() {
  entries.set([]);
  collapsedGroups.set(new Set());
}

export function dropped(count) {
  droppedTotal.update((n) => n + count);
  const noun = count === 1 ? "message" : "messages";
  push(system("warn", `${count} ${noun} dropped (more than 2,000 per second)`));
}

export function toggleGroup(id) {
  collapsedGroups.update((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

const levelOf = (entry) =>
  entry.level === "trace" || entry.level === "result" ? "log" : entry.level;

/** Entries after level/search filters and collapsed groups. */
export const visible = derived(
  [entries, levels, query, collapsedGroups],
  ([$entries, $levels, $query, $collapsed]) => {
    const q = $query.trim().toLowerCase();
    return $entries.filter((e) => {
      if (e.kind === "separator" || e.kind === "command") return !q;
      if (e.groups?.some((g) => $collapsed.has(g))) return false;
      if (!$levels.has(levelOf(e))) return false;
      return !q || entryText(e).toLowerCase().includes(q);
    });
  },
);

export const counts = derived(entries, ($entries) => {
  const c = { error: 0, warn: 0 };
  for (const e of $entries) {
    if (e.level === "error") c.error += e.repeat ?? 1;
    else if (e.level === "warn") c.warn += e.repeat ?? 1;
  }
  return c;
});
