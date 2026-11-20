// @vitest-environment node
import { get } from "svelte/store";
import type { ActivityItem } from "../../src/ActivityFeed/activity-feed.js";
import { createActivityFeed } from "../../src/ActivityFeed/activity-store.js";

const ada = { id: "ada", name: "Ada" };
const base: ActivityItem[] = [
  {
    id: "c1",
    kind: "comment",
    author: { id: "grace", name: "Grace" },
    createdAt: 1000,
    body: "first",
    reactions: [],
    replies: [],
  },
];

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}

describe("createActivityFeed", () => {
  it("shows an added comment at once, then swaps in the saved one under the same key", async () => {
    const saved = deferred<ActivityItem>();
    const feed = createActivityFeed({
      items: base,
      user: ada,
      now: () => 2000,
      onAdd: () => saved.promise,
    });
    const done = feed.add("hello");
    let state = get(feed);
    expect(state.items).toHaveLength(2);
    expect(state.items[1]).toMatchObject({ body: "hello", status: "sending" });
    const temp = state.items[1];

    saved.resolve({ ...temp, id: "c2", status: undefined });
    await done;
    state = get(feed);
    expect(state.items[1]).toMatchObject({
      id: "c2",
      clientId: temp.id,
      status: undefined,
    });
    expect(state.pending.size).toBe(0);
  });

  it("keeps a failed comment with its text, and retry sends it again", async () => {
    let fail = true;
    const feed = createActivityFeed({
      items: base,
      user: ada,
      onAdd: ({ body }) => {
        if (fail) return Promise.reject(new Error("offline"));
        return {
          id: "c2",
          kind: "comment",
          author: ada,
          createdAt: 3000,
          body,
        };
      },
    });
    expect(await feed.add("draft")).toBe(false);
    const failed = get(feed).items[1];
    expect(failed).toMatchObject({ body: "draft", status: "failed" });

    fail = false;
    expect(await feed.retry(failed.id)).toBe(true);
    expect(get(feed).items[1]).toMatchObject({ id: "c2", status: undefined });
  });

  it("rolls back a failed edit and records it, and nothing else", async () => {
    const edit = deferred();
    const feed = createActivityFeed({
      items: base,
      user: ada,
      onEdit: () => edit.promise,
      onReact: () => Promise.resolve(),
    });
    const editing = feed.edit("c1", "changed");
    expect(get(feed).items[0]).toMatchObject({ body: "changed" });
    const reacting = feed.react("c1", "+1");
    expect(get(feed).items[0].reactions).toHaveLength(1);

    edit.reject(new Error("nope"));
    expect(await editing).toBe(false);
    await reacting;
    const state = get(feed);
    expect(state.items[0].body).toBe("first");
    expect(state.items[0].reactions).toEqual([
      { emoji: "+1", userIds: ["ada"] },
    ]);
    expect(state.errors).toMatchObject([{ op: "edit", itemId: "c1" }]);

    feed.dismiss(state.errors[0].id);
    expect(get(feed).errors).toEqual([]);
  });

  it("restores a deleted comment when the request fails", async () => {
    const feed = createActivityFeed({
      items: base,
      user: ada,
      onDelete: () => Promise.reject(new Error("forbidden")),
    });
    const removing = feed.remove("c1");
    expect(get(feed).items).toHaveLength(0);
    await removing;
    expect(get(feed).items).toHaveLength(1);
    expect(get(feed).errors[0]).toMatchObject({ op: "delete" });
  });

  it("toggles a reaction off on the second call", async () => {
    const calls: boolean[] = [];
    const feed = createActivityFeed({
      items: base,
      user: ada,
      onReact: (_id, _emoji, on) => {
        calls.push(on);
      },
    });
    await feed.react("c1", "+1");
    await feed.react("c1", "+1");
    expect(calls).toEqual([true, false]);
    expect(get(feed).items[0].reactions).toEqual([]);
  });

  it("does not duplicate your own comment when the server echoes it first", async () => {
    const saved = deferred<ActivityItem>();
    const feed = createActivityFeed({
      items: base,
      user: ada,
      onAdd: () => saved.promise,
    });
    const done = feed.add("hello");
    const echo: ActivityItem = {
      id: "c2",
      kind: "comment",
      author: ada,
      createdAt: 2000,
      body: "hello",
    };
    feed.receive([echo]);
    saved.resolve(echo);
    await done;
    expect(get(feed).items.filter((item) => item.id === "c2")).toHaveLength(1);
  });

  it("loads older items before the rest and stops when there are no more", async () => {
    const older: ActivityItem = { ...base[0], id: "c0", createdAt: 10 };
    const feed = createActivityFeed({
      items: base,
      user: ada,
      hasOlder: true,
      onLoadOlder: () => ({ items: [older], hasOlder: false }),
    });
    const loading = feed.loadOlder();
    expect(get(feed).loadingOlder).toBe(true);
    await loading;
    const state = get(feed);
    expect(state.items.map((item) => item.id)).toEqual(["c0", "c1"]);
    expect(state.hasOlder).toBe(false);
    expect(await feed.loadOlder()).toBe(false);
  });

  it("records a failed page and lets the next try run", async () => {
    let fail = true;
    const feed = createActivityFeed({
      items: base,
      user: ada,
      hasOlder: true,
      onLoadOlder: () =>
        fail ? Promise.reject(new Error("x")) : { items: [], hasOlder: false },
    });
    expect(await feed.loadOlder()).toBe(false);
    expect(get(feed).errors[0].op).toBe("older");
    expect(get(feed).hasOlder).toBe(true);
    fail = false;
    expect(await feed.loadOlder()).toBe(true);
  });
});
