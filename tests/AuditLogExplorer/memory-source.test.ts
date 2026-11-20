import type {
  AuditEvent,
  AuditQuery,
} from "../../src/AuditLogExplorer/audit-source";
import { createMemorySource } from "../../src/AuditLogExplorer/memory-source";

const NOW = Date.parse("2026-11-04T12:00:00Z");

function base(over: Partial<AuditQuery> = {}): AuditQuery {
  return {
    q: "",
    filters: [],
    range: { from: null, to: null },
    limit: 50,
    ...over,
  };
}

/** Every event of a small source, newest first, by walking the cursor. */
async function all(
  source: ReturnType<typeof createMemorySource>,
  query: Partial<AuditQuery> = {},
) {
  const events: AuditEvent[] = [];
  let cursor: string | null | undefined;
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: each cursor comes from the last page
    const page = await source.query(base({ ...query, cursor, limit: 500 }));
    events.push(...page.events);
    if (!page.nextCursor) return events;
    cursor = page.nextCursor;
  }
}

describe("createMemorySource", () => {
  const source = createMemorySource({ size: 20_000, now: NOW });

  it("is deterministic and orders events newest first", async () => {
    const again = createMemorySource({ size: 20_000, now: NOW });
    const a = await source.query(base());
    const b = await again.query(base());
    expect(a.events).toEqual(b.events);
    const times = a.events.map((e) => e.time);
    expect(times).toEqual([...times].sort().reverse());
    expect(a.events[0].id).toBe("evt_00004e1f");
  });

  it("pages by cursor without gaps or repeats", async () => {
    const events = await all(source);
    expect(events).toHaveLength(20_000);
    expect(new Set(events.map((e) => e.id)).size).toBe(20_000);
  });

  it("filters by an exact qualifier and a text qualifier", async () => {
    const outcome = await all(source, {
      filters: [
        { key: "outcome", op: "eq", values: ["denied"], negated: false },
      ],
    });
    expect(outcome.length).toBeGreaterThan(100);
    expect(outcome.every((e) => e.outcome === "denied")).toBe(true);

    const target = await all(source, {
      filters: [
        { key: "target", op: "eq", values: ["bucket/00"], negated: false },
      ],
    });
    expect(target.length).toBeGreaterThan(0);
    expect(target.every((e) => e.target.includes("bucket/00"))).toBe(true);

    const not = await all(source, {
      filters: [
        { key: "outcome", op: "eq", values: ["success"], negated: true },
      ],
    });
    expect(not.every((e) => e.outcome !== "success")).toBe(true);
  });

  it("matches free text across fields, phrases and negation", async () => {
    const hit = await all(source, { q: "svc-ci" });
    expect(hit.length).toBeGreaterThan(0);
    expect(
      hit.every((e) =>
        JSON.stringify([e.actor, e.action, e.target, e.ip]).includes("svc-ci"),
      ),
    ).toBe(true);
    const without = await all(source, { q: "iam -svc-ci" });
    expect(without.every((e) => !e.actor.includes("svc-ci"))).toBe(true);
    const phrase = await all(source, { q: '"policy.update"' });
    expect(phrase.every((e) => e.action === "iam.policy.update")).toBe(true);
  });

  it("limits by range with open ends", async () => {
    const mid = new Date(NOW - 10 * 86_400_000).toISOString();
    const recent = await all(source, { range: { from: mid, to: null } });
    expect(recent.length).toBeGreaterThan(5000);
    expect(recent.length).toBeLessThan(10_000);
    expect(recent.every((e) => e.time >= mid)).toBe(true);
    const older = await all(source, { range: { from: null, to: mid } });
    expect(older.every((e) => e.time <= mid)).toBe(true);
    expect(older.length + recent.length).toBe(20_000);
  });

  it("counts facets that ignore the facet's own filter", async () => {
    const q = base({
      facets: ["actor", "action", "outcome"],
      filters: [
        { key: "outcome", op: "eq", values: ["denied"], negated: false },
      ],
    });
    const page = await source.query(q);
    const denied = await all(source, { filters: q.filters });
    expect(page.total).toBe(denied.length);
    // The outcome facet counts every outcome; the others count within "denied".
    const everything = await all(source);
    const outcomes = page.facets?.outcome ?? {};
    expect(outcomes.success).toBe(
      everything.filter((e) => e.outcome === "success").length,
    );
    expect(outcomes.denied).toBe(denied.length);
    const actors = page.facets?.actor ?? {};
    expect(Object.values(actors).reduce((n, v) => n + v, 0)).toBe(
      denied.length,
    );
  });

  it("rejects when aborted", async () => {
    const slow = createMemorySource({ size: 100, now: NOW, latency: 50 });
    const controller = new AbortController();
    const pending = slow.query(base({ signal: controller.signal }));
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("builds its columns on the first query, not before", async () => {
    const lazy = createMemorySource({ size: 5000, now: NOW });
    expect(lazy.columnsBuilt()).toBe(false);
    await lazy.query(base());
    expect(lazy.columnsBuilt()).toBe(true);
  });

  it("tails matching events at the configured rate", async () => {
    const live = createMemorySource({ size: 1000, now: NOW, liveRate: 200 });
    const controller = new AbortController();
    const got: AuditEvent[] = [];
    live.tail?.(base(), {
      signal: controller.signal,
      onEvents: (e) => got.push(...e),
    });
    await new Promise((r) => setTimeout(r, 400));
    controller.abort();
    expect(got.length).toBeGreaterThan(40);
    expect(got.length).toBeLessThan(120);
    const ids = got.map((e) => e.id);
    expect(ids).toEqual([...ids].sort());
    // The events are part of the log afterwards.
    const page = await live.query(base({ limit: 1 }));
    expect(page.events[0].id).toBe(ids[ids.length - 1]);
  });
});
