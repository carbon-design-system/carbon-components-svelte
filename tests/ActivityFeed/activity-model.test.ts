// @vitest-environment node
import {
  type ActivityItem,
  addItem,
  buildRows,
  dayKey,
  editItem,
  findItem,
  hiddenReplyCount,
  mergeItems,
  removeItem,
  summarizeReactions,
  toggleReaction,
} from "../../src/ActivityFeed/activity-feed.js";

const ada = { id: "ada", name: "Ada" };
const at = (iso: string) => Date.parse(iso);

function comment(id: string, iso: string, extra: Partial<ActivityItem> = {}) {
  return {
    id,
    kind: "comment",
    author: ada,
    createdAt: at(iso),
    body: id,
    ...extra,
  } as ActivityItem;
}

function event(id: string, iso: string) {
  return comment(id, iso, { kind: "event" });
}

describe("items", () => {
  it("adds in time order and replaces a known id", () => {
    let items = addItem([], comment("b", "2026-01-02T00:00:00Z"));
    items = addItem(items, comment("a", "2026-01-01T00:00:00Z"));
    items = addItem(items, comment("b", "2026-01-02T00:00:00Z", { body: "x" }));
    expect(items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(items[1].body).toBe("x");
  });

  it("keeps threads one level: a reply to a reply joins the comment", () => {
    let items = addItem([], comment("c", "2026-01-01T00:00:00Z"));
    items = addItem(
      items,
      comment("r1", "2026-01-01T01:00:00Z", { parentId: "c" }),
    );
    items = addItem(
      items,
      comment("r2", "2026-01-01T02:00:00Z", { parentId: "r1" }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].replies?.map((reply) => reply.id)).toEqual(["r1", "r2"]);
    expect(findItem(items, "r2")?.parent?.id).toBe("c");
  });

  it("edits and removes replies, and removing a comment takes its replies", () => {
    let items = addItem([], comment("c", "2026-01-01T00:00:00Z"));
    items = addItem(
      items,
      comment("r", "2026-01-01T01:00:00Z", { parentId: "c" }),
    );
    items = editItem(items, "r", "changed", 5);
    expect(findItem(items, "r")?.item).toMatchObject({
      body: "changed",
      editedAt: 5,
    });
    expect(removeItem(items, "r")[0].replies).toEqual([]);
    expect(removeItem(items, "c")).toEqual([]);
  });

  it("merges incoming items and reports only the new ones", () => {
    const base = [comment("a", "2026-01-01T00:00:00Z")];
    const { items, added } = mergeItems(base, [
      comment("a", "2026-01-01T00:00:00Z", { body: "edited elsewhere" }),
      comment("z", "2026-01-03T00:00:00Z"),
    ]);
    expect(added.map((item) => item.id)).toEqual(["z"]);
    expect(items[0].body).toBe("edited elsewhere");
  });
});

describe("toggleReaction", () => {
  it("adds, removes and drops an emptied reaction", () => {
    let items = [comment("a", "2026-01-01T00:00:00Z")];
    items = toggleReaction(items, "a", "+1", "ada");
    items = toggleReaction(items, "a", "+1", "grace");
    expect(items[0].reactions).toEqual([
      { emoji: "+1", userIds: ["ada", "grace"] },
    ]);
    items = toggleReaction(items, "a", "+1", "ada");
    items = toggleReaction(items, "a", "+1", "grace");
    expect(items[0].reactions).toEqual([]);
  });

  it("does nothing when forced to the state it is in", () => {
    const items = [comment("a", "2026-01-01T00:00:00Z")];
    expect(toggleReaction(items, "a", "+1", "ada", false)).toEqual(items);
  });

  it("summarizes for the reader without listing the reader by name", () => {
    const item = comment("a", "2026-01-01T00:00:00Z", {
      reactions: [{ emoji: "+1", userIds: ["ada", "grace"] }],
    });
    expect(summarizeReactions(item, "ada", (id) => id.toUpperCase())).toEqual([
      { emoji: "+1", count: 2, mine: true, names: ["GRACE"] },
    ]);
  });
});

describe("buildRows", () => {
  it("groups consecutive events and splits them at a comment", () => {
    const rows = buildRows([
      event("e1", "2026-01-01T09:00:00Z"),
      event("e2", "2026-01-01T09:30:00Z"),
      comment("c", "2026-01-01T10:00:00Z"),
      event("e3", "2026-01-01T11:00:00Z"),
    ]);
    expect(rows.map((row) => [row.type, row.events.length])).toEqual([
      ["events", 2],
      ["comment", 0],
      ["events", 1],
    ]);
  });

  it("starts a new group after the window and one row per event when off", () => {
    const items = [
      event("e1", "2026-01-01T01:00:00Z"),
      event("e2", "2026-01-01T09:00:00Z"),
    ];
    expect(buildRows(items, { timeZone: "UTC" })).toHaveLength(2);
    expect(
      buildRows(
        [
          event("e1", "2026-01-01T01:00:00Z"),
          event("e2", "2026-01-01T01:01:00Z"),
        ],
        { groupEvents: false },
      ),
    ).toHaveLength(2);
  });

  it("marks the first row of each day in the given time zone", () => {
    const items = [
      comment("a", "2026-01-01T23:30:00Z"),
      comment("b", "2026-01-02T00:30:00Z"),
      comment("c", "2026-01-02T10:00:00Z"),
    ];
    expect(buildRows(items, { timeZone: "UTC" }).map((row) => row.day)).toEqual(
      ["2026-01-01", "2026-01-02", undefined],
    );
    // In Tokyo the first two are the same day.
    expect(
      buildRows(items, { timeZone: "Asia/Tokyo" }).map((row) => row.day),
    ).toEqual(["2026-01-02", undefined, undefined]);
    expect(dayKey(at("2026-01-01T23:30:00Z"), "Asia/Tokyo")).toBe("2026-01-02");
  });

  it("keys a row by its client id so a posted comment keeps its element", () => {
    const [row] = buildRows([
      comment("server-1", "2026-01-01T00:00:00Z", { clientId: "pending-1" }),
    ]);
    expect(row.key).toBe("pending-1");
  });
});

describe("hiddenReplyCount", () => {
  it("never hides a single reply", () => {
    expect(hiddenReplyCount(3, 2)).toBe(0);
    expect(hiddenReplyCount(4, 2)).toBe(2);
    expect(hiddenReplyCount(14, 2)).toBe(12);
  });
});
