import { get } from "svelte/store";
import { createHistory } from "../../src/utils/history.js";

function setup(options: Parameters<typeof createHistory>[0] = {}) {
  let time = 0;
  const history = createHistory({ now: () => time, ...options });
  const log: string[] = [];
  const cmd = (name: string, extra: object = {}) => ({
    label: name,
    do: () => log.push(`do ${name}`),
    undo: () => log.push(`undo ${name}`),
    ...extra,
  });
  return {
    history,
    log,
    cmd,
    advance(ms: number) {
      time += ms;
    },
  };
}

describe("createHistory commands", () => {
  it("undoes and redoes in order, and push does not call do", () => {
    const { history, log, cmd } = setup();
    history.push(cmd("a"));
    history.push(cmd("b"));
    expect(log).toEqual([]);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(true);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.redo()).toBe(true);
    expect(history.redo()).toBe(false);
    expect(log).toEqual(["undo b", "undo a", "do a", "do b"]);
  });

  it("run applies the command and records it", () => {
    const { history, log, cmd } = setup();
    history.run(cmd("a"));
    history.undo();
    expect(log).toEqual(["do a", "undo a"]);
  });

  it("truncates the redo steps when a new step follows an undo", () => {
    const { history, log, cmd } = setup();
    history.push(cmd("a"));
    history.push(cmd("b"));
    history.undo();
    history.push(cmd("c"));
    expect(get(history.canRedo)).toBe(false);
    expect(history.redo()).toBe(false);
    history.undo();
    history.undo();
    expect(history.undo()).toBe(false);
    expect(log).toEqual(["undo b", "undo c", "undo a"]);
  });

  it("publishes canUndo, canRedo and the labels", () => {
    const { history, cmd } = setup();
    expect(get(history.canUndo)).toBe(false);
    expect(get(history.undoLabel)).toBeUndefined();
    history.push(cmd("move tab"));
    history.push(cmd("close tab"));
    expect(get(history.canUndo)).toBe(true);
    expect(get(history.undoLabel)).toBe("close tab");
    history.undo();
    expect(get(history.undoLabel)).toBe("move tab");
    expect(get(history.redoLabel)).toBe("close tab");
    expect(get(history.canRedo)).toBe(true);
    history.undo();
    expect(get(history.canUndo)).toBe(false);
    history.clear();
    expect(get(history.canRedo)).toBe(false);
    expect(get(history.redoLabel)).toBeUndefined();
  });

  it("keeps the step when its undo throws", () => {
    const { history } = setup();
    let fail = true;
    history.push({
      do: () => {},
      undo: () => {
        if (fail) throw new Error("boom");
      },
    });
    expect(() => history.undo()).toThrow("boom");
    expect(get(history.canUndo)).toBe(true);
    expect(get(history.canRedo)).toBe(false);
    fail = false;
    expect(history.undo()).toBe(true);
  });

  it("ignores pushes made while an undo or redo applies", () => {
    const { history, cmd } = setup();
    let pushed: boolean | undefined;
    history.push({
      label: "a",
      do: () => {},
      undo: () => {
        pushed = history.push(cmd("echo"));
      },
    });
    history.undo();
    expect(pushed).toBe(false);
    expect(get(history.canUndo)).toBe(false);
    expect(get(history.canRedo)).toBe(true);
  });
});

describe("createHistory limits", () => {
  it("drops the oldest step past `limit`", () => {
    const { history, log, cmd } = setup({ limit: 3 });
    for (const name of ["a", "b", "c", "d", "e"]) history.push(cmd(name));
    while (history.undo());
    expect(log).toEqual(["undo e", "undo d", "undo c"]);
  });

  it("keeps nothing with a limit of 0", () => {
    const { history, cmd } = setup({ limit: 0 });
    history.push(cmd("a"));
    expect(get(history.canUndo)).toBe(false);
  });

  it("drops the oldest steps past `maxCost` but never the newest", () => {
    const { history, log, cmd } = setup({ maxCost: 10 });
    history.push(cmd("a", { cost: 4 }));
    history.push(cmd("b", { cost: 4 }));
    history.push(cmd("c", { cost: 4 }));
    while (history.undo());
    expect(log).toEqual(["undo c", "undo b"]);

    log.length = 0;
    history.clear();
    history.push(cmd("huge", { cost: 50 }));
    expect(history.undo()).toBe(true);
    expect(log).toEqual(["undo huge"]);
  });

  it("gives the cost back when a step is undone", () => {
    const { history, cmd } = setup({ maxCost: 10 });
    history.push(cmd("a", { cost: 6 }));
    history.undo();
    history.redo();
    history.push(cmd("b", { cost: 4 }));
    expect(get(history.undoLabel)).toBe("b");
    history.undo();
    expect(get(history.undoLabel)).toBe("a");
  });
});

describe("createHistory coalescing", () => {
  it("folds keyed steps inside the window into one that undoes to before the first", () => {
    const { history, log, advance } = setup({ coalesceMs: 500 });
    let x = 0;
    const move = (from: number, to: number) => ({
      key: "move",
      label: "move",
      do: () => {
        x = to;
        log.push(`do ${to}`);
      },
      undo: () => {
        x = from;
        log.push(`undo ${from}`);
      },
    });
    x = 1;
    history.push(move(0, 1));
    advance(100);
    x = 2;
    history.push(move(1, 2));
    advance(100);
    x = 3;
    history.push(move(2, 3));

    history.undo();
    expect(x).toBe(0);
    expect(history.undo()).toBe(false);
    history.redo();
    expect(x).toBe(3);
    expect(log).toEqual(["undo 0", "do 3"]);
  });

  it("starts a new step after the window passes", () => {
    const { history, cmd, advance } = setup({ coalesceMs: 500 });
    history.push(cmd("a", { key: "k" }));
    advance(501);
    history.push(cmd("b", { key: "k" }));
    history.undo();
    expect(get(history.canUndo)).toBe(true);
  });

  it("slides the window with every folded step", () => {
    const { history, cmd, advance } = setup({ coalesceMs: 500 });
    for (let i = 0; i < 20; i++) {
      history.push(cmd(`s${i}`, { key: "typing" }));
      advance(400);
    }
    history.undo();
    expect(get(history.canUndo)).toBe(false);
  });

  it("includes a gap of exactly the window", () => {
    const { history, cmd, advance } = setup({ coalesceMs: 500 });
    history.push(cmd("a", { key: "k" }));
    advance(500);
    history.push(cmd("b", { key: "k" }));
    history.undo();
    expect(get(history.canUndo)).toBe(false);
  });

  it("does not fold steps with different keys or no key", () => {
    const { history, cmd } = setup();
    history.push(cmd("a", { key: "x" }));
    history.push(cmd("b", { key: "y" }));
    history.push(cmd("c"));
    history.push(cmd("d"));
    let count = 0;
    while (history.undo()) count++;
    expect(count).toBe(4);
  });

  it("does not fold into a step after an undo", () => {
    const { history, cmd } = setup();
    history.push(cmd("a", { key: "k" }));
    history.push(cmd("b", { key: "other" }));
    history.undo();
    history.redo();
    history.push(cmd("c", { key: "other" }));
    let count = 0;
    while (history.undo()) count++;
    expect(count).toBe(3);
  });

  it("seal ends the open step", () => {
    const { history, cmd } = setup();
    history.push(cmd("a", { key: "k" }));
    history.seal();
    history.push(cmd("b", { key: "k" }));
    let count = 0;
    while (history.undo()) count++;
    expect(count).toBe(2);
  });

  it("folds until sealed with an infinite window", () => {
    const { history, cmd, advance } = setup({ coalesceMs: Infinity });
    history.push(cmd("a", { key: "k" }));
    advance(10 * 60 * 1000);
    history.push(cmd("b", { key: "k" }));
    history.undo();
    expect(get(history.canUndo)).toBe(false);
  });

  it("lets a step set its own window", () => {
    const { history, cmd, advance } = setup({ coalesceMs: 500 });
    history.push(cmd("a", { key: "k", coalesceMs: 50 }));
    advance(100);
    history.push(cmd("b", { key: "k", coalesceMs: 50 }));
    history.undo();
    expect(get(history.canUndo)).toBe(true);
  });

  it("takes the latest label of a folded step", () => {
    const { history, cmd } = setup();
    history.push(cmd("nudge", { key: "k" }));
    history.push({ ...cmd("nudge twice", { key: "k" }) });
    expect(get(history.undoLabel)).toBe("nudge twice");
  });

  it("clears the redo steps when a keyed step folds", () => {
    const { history, cmd } = setup();
    history.push(cmd("a", { key: "k" }));
    history.undo();
    history.push(cmd("b", { key: "k" }));
    expect(get(history.canRedo)).toBe(false);
  });

  it("extend keeps the window open without recording", () => {
    const { history, cmd, advance } = setup({ coalesceMs: 500 });
    expect(history.extend("k")).toBe(false);
    history.push(cmd("a", { key: "k" }));
    advance(400);
    expect(history.extend("k")).toBe(true);
    advance(400);
    expect(history.extend("k")).toBe(true);
    advance(600);
    expect(history.extend("k")).toBe(false);
    expect(history.extend(undefined)).toBe(false);
  });

  it("survives a very long fold without nesting calls", () => {
    const { history } = setup({ coalesceMs: Infinity });
    let x = 0;
    for (let i = 1; i <= 100_000; i++) {
      history.push({
        key: "drag",
        do: () => {
          x = i;
        },
        undo: () => {
          x = i - 1;
        },
      });
    }
    // The folded undo is the first one: back to before the drag.
    history.undo();
    expect(x).toBe(0);
    history.redo();
    expect(x).toBe(100_000);
  });
});

describe("createHistory transactions", () => {
  it("commits a group as one step, undone in reverse and redone in order", () => {
    const { history, log, cmd } = setup();
    history.begin("rename");
    history.push(cmd("a"));
    history.push(cmd("b"));
    history.push(cmd("c"));
    expect(get(history.canUndo)).toBe(false);
    expect(history.commit()).toBe(true);
    expect(get(history.undoLabel)).toBe("rename");
    history.undo();
    history.redo();
    expect(log).toEqual(["undo c", "undo b", "undo a", "do a", "do b", "do c"]);
    history.undo();
    expect(get(history.canUndo)).toBe(false);
  });

  it("composes relative commands, which a keyed fold would not", () => {
    const { history } = setup();
    let n = 0;
    history.begin("add three");
    for (let i = 0; i < 3; i++) {
      n += 1;
      history.push({
        do: () => {
          n += 1;
        },
        undo: () => {
          n -= 1;
        },
      });
    }
    history.commit();
    history.undo();
    expect(n).toBe(0);
    history.redo();
    expect(n).toBe(3);
  });

  it("cancel undoes the group and records nothing", () => {
    const { history, log, cmd } = setup();
    history.push(cmd("before"));
    history.begin();
    history.push(cmd("a"));
    history.push(cmd("b"));
    expect(history.cancel()).toBe(true);
    expect(log).toEqual(["undo b", "undo a"]);
    expect(get(history.undoLabel)).toBe("before");
    expect(get(history.canRedo)).toBe(false);
  });

  it("commit and cancel with no group do nothing", () => {
    const { history } = setup();
    expect(history.commit()).toBe(false);
    expect(history.cancel()).toBe(false);
  });

  it("commits nothing for an empty group", () => {
    const { history } = setup();
    history.begin("empty");
    expect(history.commit()).toBe(false);
    expect(get(history.canUndo)).toBe(false);
  });

  it("nests: the inner group is one step of the outer", () => {
    const { history, log, cmd } = setup();
    history.begin("outer");
    history.push(cmd("a"));
    history.begin("inner");
    history.push(cmd("b"));
    history.push(cmd("c"));
    history.commit();
    history.push(cmd("d"));
    history.commit();
    history.undo();
    expect(log).toEqual(["undo d", "undo c", "undo b", "undo a"]);
    expect(get(history.canUndo)).toBe(false);
  });

  it("cancels only the inner group", () => {
    const { history, log, cmd } = setup();
    history.begin("outer");
    history.push(cmd("a"));
    history.begin();
    history.push(cmd("b"));
    history.cancel();
    history.commit();
    expect(log).toEqual(["undo b"]);
    history.undo();
    expect(log).toEqual(["undo b", "undo a"]);
  });

  it("refuses undo and redo while a group is open", () => {
    const { history, cmd } = setup();
    history.push(cmd("a"));
    history.begin();
    expect(history.undo()).toBe(false);
    history.cancel();
    expect(history.undo()).toBe(true);
    history.begin();
    expect(history.redo()).toBe(false);
  });

  it("folds keyed steps inside a group, so a scrub stays one entry", () => {
    const { history, log, advance } = setup({ coalesceMs: 100 });
    history.begin("scrub");
    for (let i = 1; i <= 50; i++) {
      advance(10);
      history.push({
        key: "v",
        do: () => log.push(`do ${i}`),
        undo: () => log.push(`undo ${i - 1}`),
      });
    }
    history.commit();
    history.undo();
    expect(log).toEqual(["undo 0"]);
  });

  it("does not fold the next gesture into a committed one", () => {
    const { history, cmd } = setup({ coalesceMs: Infinity });
    history.begin();
    history.push(cmd("a", { key: "k" }));
    history.commit();
    history.push(cmd("b", { key: "k" }));
    let count = 0;
    while (history.undo()) count++;
    expect(count).toBe(2);
  });

  it("transaction commits on return and cancels on a throw", () => {
    const { history, log, cmd } = setup();
    const result = history.transaction("two", () => {
      history.push(cmd("a"));
      history.push(cmd("b"));
      return 7;
    });
    expect(result).toBe(7);
    expect(get(history.undoLabel)).toBe("two");

    expect(() =>
      history.transaction("bad", () => {
        history.push(cmd("c"));
        throw new Error("nope");
      }),
    ).toThrow("nope");
    expect(log).toEqual(["undo c"]);
    expect(get(history.undoLabel)).toBe("two");
  });

  it("clear drops an open group", () => {
    const { history, cmd } = setup();
    history.begin();
    history.push(cmd("a"));
    history.clear();
    history.push(cmd("b"));
    expect(history.undo()).toBe(true);
  });
});

describe("createHistory announcements", () => {
  it("announces an undo and a redo with the label", () => {
    const messages: string[] = [];
    const { history, cmd } = setup({ announce: (m) => messages.push(m) });
    history.push(cmd("move tab"));
    history.undo();
    history.redo();
    history.push({ do() {}, undo() {} });
    history.undo();
    expect(messages).toEqual(["Undid move tab", "Redid move tab", "Undid"]);
  });

  it("takes translated texts and stays quiet when nothing happens", () => {
    const messages: string[] = [];
    const { history, cmd } = setup({
      announce: (m) => messages.push(m),
      undoneText: (label) => `Annulé : ${label}`,
      redoneText: (label) => `Rétabli : ${label}`,
    });
    history.undo();
    history.redo();
    history.push(cmd("déplacer"));
    history.undo();
    history.redo();
    expect(messages).toEqual(["Annulé : déplacer", "Rétabli : déplacer"]);
  });
});

describe("createHistory snapshots", () => {
  type Form = { name: string; email: string };

  function snapshotSetup(options: Parameters<typeof createHistory>[0] = {}) {
    const base = setup(options);
    let live: Form = { name: "", email: "" };
    const applied: Form[] = [];
    const snap = base.history.snapshots<Form>({
      initial: live,
      apply: (state) => {
        live = state;
        applied.push(state);
      },
      capture: () => live,
    });
    return {
      ...base,
      snap,
      applied,
      get live() {
        return live;
      },
      set(next: Form) {
        live = next;
      },
    };
  }

  it("restores the state before and after a recorded change", () => {
    const s = snapshotSetup();
    const a = { name: "Ada", email: "" };
    s.set(a);
    s.snap.record(a, { label: "name" });
    const b = { name: "Ada", email: "a@b.c" };
    s.set(b);
    s.snap.record(b, { label: "email" });

    s.history.undo();
    expect(s.live).toEqual(a);
    s.history.undo();
    expect(s.live).toEqual({ name: "", email: "" });
    s.history.redo();
    expect(s.live).toBe(a);
    s.history.redo();
    expect(s.live).toBe(b);
  });

  it("skips a record of an equal state, so a reactive echo of an undo adds nothing", () => {
    const s = snapshotSetup();
    const a = { name: "Ada", email: "" };
    s.snap.record(a);
    expect(s.snap.record(a)).toBe(false);
    s.history.undo();
    expect(s.snap.record(s.live)).toBe(false);
    expect(get(s.history.canUndo)).toBe(false);
    expect(get(s.history.canRedo)).toBe(true);
  });

  it("compares with `equals`", () => {
    const base = setup();
    const snap = base.history.snapshots<{ n: number }>({
      initial: { n: 0 },
      apply: () => {},
      equals: (x, y) => x.n === y.n,
    });
    expect(snap.record({ n: 0 })).toBe(false);
    expect(snap.record({ n: 1 })).toBe(true);
  });

  it("folds keyed typing into one step and undoes to before the burst", () => {
    const s = snapshotSetup({ coalesceMs: 700 });
    for (const text of ["A", "Ad", "Ada"]) {
      s.snap.record({ name: text, email: "" }, { key: "name", label: "name" });
      s.advance(200);
    }
    s.history.undo();
    expect(s.live.name).toBe("");
    expect(get(s.history.canUndo)).toBe(false);
    s.history.redo();
    expect(s.live.name).toBe("Ada");
  });

  it("starts a new step for a different field", () => {
    const s = snapshotSetup();
    s.snap.record({ name: "A", email: "" }, { key: "name" });
    s.snap.record({ name: "A", email: "x" }, { key: "email" });
    s.history.undo();
    expect(s.live).toEqual({ name: "A", email: "" });
  });

  it("counts the cost of a state", () => {
    const base = setup({ maxCost: 5 });
    const snap = base.history.snapshots<string>({
      initial: "",
      apply: () => {},
      cost: (state) => state.length,
    });
    snap.record("aaa");
    snap.record("bbbb");
    base.history.undo();
    expect(get(base.history.canUndo)).toBe(false);
  });

  it("checkpoint captures before the change and redo reads the state at undo", () => {
    const s = snapshotSetup();
    s.snap.checkpoint({ label: "edit", key: "t" });
    s.set({ name: "A", email: "" });
    s.advance(100);
    s.snap.checkpoint({ label: "edit", key: "t" });
    s.set({ name: "Ad", email: "" });
    s.history.undo();
    expect(s.live).toEqual({ name: "", email: "" });
    expect(get(s.history.canUndo)).toBe(false);
    s.history.redo();
    expect(s.live).toEqual({ name: "Ad", email: "" });
  });

  it("checkpoint reads the live state only when a step starts", () => {
    const base = setup({ coalesceMs: 700 });
    const capture = vi.fn(() => "x");
    const snap = base.history.snapshots<string>({
      initial: "x",
      apply: () => {},
      capture,
    });
    for (let i = 0; i < 100; i++) {
      snap.checkpoint({ key: "typing" });
      base.advance(10);
    }
    expect(capture).toHaveBeenCalledTimes(1);
    base.advance(5000);
    snap.checkpoint({ key: "typing" });
    expect(capture).toHaveBeenCalledTimes(2);
  });

  it("checkpoint throws without `capture`", () => {
    const base = setup();
    const snap = base.history.snapshots<string>({
      initial: "",
      apply: () => {},
    });
    expect(() => snap.checkpoint()).toThrow(TypeError);
  });

  it("reset moves the current state without a step", () => {
    const s = snapshotSetup();
    const loaded = { name: "Loaded", email: "" };
    s.snap.reset(loaded);
    expect(get(s.history.canUndo)).toBe(false);
    s.snap.record({ name: "Edited", email: "" });
    s.history.undo();
    expect(s.live).toBe(loaded);
  });

  it("shares one timeline with commands", () => {
    const s = snapshotSetup();
    s.snap.record({ name: "A", email: "" });
    s.history.push(s.cmd("rename list"));
    s.history.undo();
    expect(s.log).toEqual(["undo rename list"]);
    s.history.undo();
    expect(s.live).toEqual({ name: "", email: "" });
  });

  it("cancels a gesture back to the snapshot before it", () => {
    const s = snapshotSetup();
    s.history.begin("drag");
    s.snap.record({ name: "A", email: "" });
    s.snap.record({ name: "AB", email: "" });
    s.history.cancel();
    expect(s.live).toEqual({ name: "", email: "" });
    expect(s.snap.current).toEqual({ name: "", email: "" });
    expect(get(s.history.canUndo)).toBe(false);
  });
});
