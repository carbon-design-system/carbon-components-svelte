import { get } from "svelte/store";
import {
  type ChecklistSnapshot,
  type ChecklistStorage,
  type ChecklistTask,
  cookieChecklistStorage,
  createChecklistStore,
  localChecklistStorage,
  parseChecklistCookie,
  resolveChecklist,
} from "../../src/utils/checklist-store";

const EMPTY: ChecklistSnapshot = {
  done: [],
  skipped: [],
  minimized: false,
  dismissed: false,
  celebrated: false,
};

function memoryStorage(initial: Partial<ChecklistSnapshot> = {}) {
  const storage: ChecklistStorage & {
    snapshot: ChecklistSnapshot;
    read: ReturnType<typeof vi.fn<() => ChecklistSnapshot>>;
    write: ReturnType<typeof vi.fn<(snapshot: ChecklistSnapshot) => void>>;
  } = {
    snapshot: { ...EMPTY, ...initial },
    read: vi.fn(() => storage.snapshot),
    write: vi.fn((snapshot: ChecklistSnapshot) => {
      storage.snapshot = snapshot;
    }),
  };
  return storage;
}

describe("createChecklistStore", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "carbon-onboarding=; Max-Age=0; Path=/";
  });

  it("does not read the storage until it is connected", () => {
    const storage = memoryStorage({ done: ["a"] });
    const store = createChecklistStore({ storage });

    expect(storage.read).not.toHaveBeenCalled();
    expect(get(store)).toMatchObject({ ready: false, pending: "hide" });
    expect([...get(store).done]).toEqual([]);

    store.connect();

    expect(get(store).ready).toBe(true);
    expect([...get(store).done]).toEqual(["a"]);
  });

  it("is ready from the start with the progress the server gave it", () => {
    const storage = memoryStorage();
    const store = createChecklistStore({
      storage,
      initial: { done: ["a"], minimized: true },
    });

    expect(get(store)).toMatchObject({ ready: true, minimized: true });
    expect([...get(store).done]).toEqual(["a"]);
  });

  it("adds what it reads to what the server already knew", () => {
    const store = createChecklistStore({
      storage: memoryStorage({ done: ["b"], dismissed: true }),
      initial: { done: ["a"] },
    });

    store.connect();

    expect([...get(store).done].sort()).toEqual(["a", "b"]);
    expect(get(store).dismissed).toBe(true);
  });

  it("saves every change and skips one that changes nothing", () => {
    const storage = memoryStorage();
    const store = createChecklistStore({ storage });
    store.connect();

    store.check("a");
    store.check("a");
    store.skip("b");
    store.minimize();
    store.dismiss();
    store.celebrate();

    expect(storage.write).toHaveBeenCalledTimes(5);
    expect(storage.snapshot).toEqual({
      done: ["a"],
      skipped: ["b"],
      minimized: true,
      dismissed: true,
      celebrated: true,
    });
  });

  it("checking a task un-skips it, and restore opens a dismissed checklist", () => {
    const store = createChecklistStore({ storage: memoryStorage() });
    store.connect();

    store.skip("a");
    store.check("a");
    store.minimize();
    store.dismiss();
    store.restore();

    expect([...get(store).skipped]).toEqual([]);
    expect(get(store)).toMatchObject({ dismissed: false, minimized: false });
  });

  it("forgets everything on reset", () => {
    const storage = memoryStorage({ done: ["a"], celebrated: true });
    const store = createChecklistStore({ storage });
    store.connect();

    store.reset();

    expect(storage.snapshot).toEqual(EMPTY);
  });

  it("lets a reset made during an asynchronous read win over it", async () => {
    let resolve: (snapshot: ChecklistSnapshot) => void = () => {};
    const storage: ChecklistStorage = {
      read: () =>
        new Promise<ChecklistSnapshot>((done) => {
          resolve = done;
        }),
      write: vi.fn(),
    };
    const store = createChecklistStore({ storage, initial: { done: ["x"] } });
    store.connect();

    store.reset();
    resolve({ ...EMPTY, done: ["a"], dismissed: true });
    await Promise.resolve();

    expect(get(store)).toMatchObject({ ready: true, dismissed: false });
    expect([...get(store).done]).toEqual([]);
  });

  it("reports a failing read and a failing write, and keeps the progress", async () => {
    const onError = vi.fn();
    const store = createChecklistStore({
      storage: {
        read: () => {
          throw new Error("read");
        },
        write: () => Promise.reject(new Error("write")),
      },
      onError,
    });

    store.connect();
    store.check("a");
    await Promise.resolve();

    expect(get(store).ready).toBe(true);
    expect([...get(store).done]).toEqual(["a"]);
    expect(onError.mock.calls.map(([error]) => error.message)).toEqual([
      "read",
      "write",
    ]);
  });

  it("stops listening when the last connection lets go", () => {
    const stop = vi.fn();
    const subscribe = vi.fn(() => stop);
    const store = createChecklistStore({
      storage: { ...memoryStorage(), subscribe },
    });

    const first = store.connect();
    const second = store.connect();
    first();
    first();
    expect(stop).not.toHaveBeenCalled();
    second();

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("localChecklistStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips JSON under its key and reads garbage as empty", () => {
    const storage = localChecklistStorage("k");

    expect(storage.read()).toEqual(EMPTY);

    storage.write({ ...EMPTY, done: ["a"], minimized: true });
    expect(JSON.parse(localStorage.getItem("k") as string)).toMatchObject({
      done: ["a"],
      minimized: true,
    });
    expect(storage.read()).toMatchObject({ done: ["a"], minimized: true });

    localStorage.setItem("k", "{nope");
    expect(storage.read()).toEqual(EMPTY);

    localStorage.setItem("k", JSON.stringify({ done: [1, "b"], skipped: "x" }));
    expect(storage.read()).toEqual({ ...EMPTY, done: ["b"] });
  });

  it("tells a second store with the same key about a write", () => {
    const writer = createChecklistStore({
      storage: localChecklistStorage("k"),
    });
    const reader = createChecklistStore({
      storage: localChecklistStorage("k"),
    });
    reader.connect();

    writer.check("a");

    expect([...get(reader).done]).toEqual(["a"]);
  });

  it("follows a change from another tab", () => {
    const store = createChecklistStore({ storage: localChecklistStorage("k") });
    store.connect();

    localStorage.setItem("k", JSON.stringify({ ...EMPTY, done: ["z"] }));
    window.dispatchEvent(
      new StorageEvent("storage", { key: "k", storageArea: localStorage }),
    );

    expect([...get(store).done]).toEqual(["z"]);
  });
});

describe("cookies", () => {
  it("parses the cookie a server reads, and nothing from a bad one", () => {
    const cookie = encodeURIComponent(
      JSON.stringify({ done: ["a"], dismissed: true }),
    );

    expect(
      parseChecklistCookie(`x=1; carbon-onboarding=${cookie}; y=2`),
    ).toEqual({ ...EMPTY, done: ["a"], dismissed: true });
    expect(parseChecklistCookie("x=1")).toBeUndefined();
    expect(parseChecklistCookie("carbon-onboarding=%7B")).toBeUndefined();
    expect(parseChecklistCookie(undefined)).toBeUndefined();
  });

  it("writes a cookie the server can read back", () => {
    const storage = cookieChecklistStorage();

    storage.write({ ...EMPTY, done: ["a"], skipped: ["b"] });

    expect(parseChecklistCookie(document.cookie)).toEqual({
      ...EMPTY,
      done: ["a"],
      skipped: ["b"],
    });
    expect(storage.read()).toMatchObject({ done: ["a"], skipped: ["b"] });
  });
});

describe("resolveChecklist", () => {
  const tasks: ChecklistTask[] = [
    { id: "app", title: "App", section: "One", completed: true },
    { id: "app-open", title: "App open", section: "One", completed: false },
    { id: "user", title: "User", section: "Two" },
    { id: "opt", title: "Optional", section: "Two", optional: true },
    { id: "loose", title: "Loose" },
  ];
  const state = (done: string[] = [], skipped: string[] = []) => ({
    done: new Set(done),
    skipped: new Set(skipped),
  });

  it("lets the app own a task whose completed is a boolean", () => {
    // The stored progress says the app's open task is done. The app wins.
    const progress = resolveChecklist(tasks, state(["app-open", "user"]));

    expect(
      progress.items.map((item) => [item.task.id, item.appOwned, item.status]),
    ).toEqual([
      ["app", true, "complete"],
      ["app-open", true, "incomplete"],
      ["user", false, "complete"],
      ["opt", false, "incomplete"],
      ["loose", false, "incomplete"],
    ]);
  });

  it("takes a skipped task out of the total and honors skip only when optional", () => {
    const progress = resolveChecklist(tasks, state([], ["opt", "user"]));

    expect(progress).toMatchObject({ complete: 1, skipped: 1, total: 4 });
    expect(progress.allSet).toBe(false);
  });

  it("is all set when every counted task is complete, and never for no tasks", () => {
    const all = resolveChecklist(
      [
        { id: "a", title: "A" },
        { id: "b", title: "B", optional: true },
      ],
      state(["a"], ["b"]),
    );

    expect(all).toMatchObject({ complete: 1, total: 1, allSet: true });
    expect(resolveChecklist([], state()).allSet).toBe(false);
  });

  it("groups by section in order of first appearance, and ignores unknown ids", () => {
    const progress = resolveChecklist(tasks, state(["gone"]));

    expect(
      progress.sections.map((section) => [
        section.title,
        section.items.length,
        section.complete,
        section.total,
      ]),
    ).toEqual([
      ["One", 2, 1, 2],
      ["Two", 2, 0, 2],
      [undefined, 1, 0, 1],
    ]);
    expect(progress.complete).toBe(1);
  });
});
