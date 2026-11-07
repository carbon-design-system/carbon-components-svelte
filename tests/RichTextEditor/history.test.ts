import { createHistory } from "../../src/RichTextEditor/history.js";

function setup(options: Parameters<typeof createHistory>[0] = {}) {
  let time = 0;
  let doc = "";
  const history = createHistory<string>({ now: () => time, ...options });
  return {
    history,
    type(text: string, kind = "insert", advance = 100) {
      time += advance;
      history.record(kind, () => doc);
      doc += text;
    },
    command(text: string) {
      history.seal();
      history.push(doc);
      doc += text;
      history.seal();
    },
    undo() {
      const state = history.undo(() => doc);
      if (state !== undefined) doc = state;
      return doc;
    },
    redo() {
      const state = history.redo(() => doc);
      if (state !== undefined) doc = state;
      return doc;
    },
    wait(ms: number) {
      time += ms;
    },
    get doc() {
      return doc;
    },
  };
}

describe("createHistory", () => {
  it("groups typing in one step", () => {
    const h = setup();
    h.type("a");
    h.type("b");
    h.type("c");

    expect(h.undo()).toBe("");
    expect(h.history.canUndo()).toBe(false);
  });

  it("starts a new step after a pause", () => {
    const h = setup({ delay: 500 });
    h.type("a");
    h.wait(600);
    h.type("b");

    expect(h.undo()).toBe("a");
    expect(h.undo()).toBe("");
  });

  it("starts a new step when the kind changes, and when sealed", () => {
    const h = setup();
    h.type("ab");
    h.type("x", "delete");
    h.history.seal();
    h.type("y", "delete");

    expect(h.undo()).toBe("abx");
    expect(h.undo()).toBe("ab");
    expect(h.undo()).toBe("");
  });

  it("keeps a command out of the typing groups around it", () => {
    const h = setup();
    h.type("a");
    h.command("[B]");
    h.type("c");

    expect(h.undo()).toBe("a[B]");
    expect(h.undo()).toBe("a");
    expect(h.undo()).toBe("");
  });

  it("redoes what was undone, until something new is done", () => {
    const h = setup();
    h.type("a");
    h.wait(1000);
    h.type("b");
    h.undo();
    expect(h.history.canRedo()).toBe(true);

    expect(h.redo()).toBe("ab");
    h.undo();
    h.wait(1000);
    h.type("c");

    expect(h.history.canRedo()).toBe(false);
  });

  it("returns nothing when there is nothing to undo or redo", () => {
    const h = setup();
    expect(h.history.undo(() => "x")).toBeUndefined();
    expect(h.history.redo(() => "x")).toBeUndefined();
  });

  it("forgets the oldest step past its limit", () => {
    const h = setup({ limit: 2 });
    h.command("a");
    h.command("b");
    h.command("c");

    expect(h.undo()).toBe("ab");
    expect(h.undo()).toBe("a");
    expect(h.history.canUndo()).toBe(false);
  });

  it("clears both stacks", () => {
    const h = setup();
    h.command("a");
    h.undo();
    h.history.clear();

    expect(h.history.canUndo()).toBe(false);
    expect(h.history.canRedo()).toBe(false);
  });
});
