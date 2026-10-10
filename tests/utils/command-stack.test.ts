import { get } from "svelte/store";
import { createCommandStack } from "../../src/utils/command-stack.js";

describe("createCommandStack", () => {
  test("executes, undoes, and redoes in order, and clears the redo stack on a new command", () => {
    const stack = createCommandStack();
    const log: string[] = [];
    const cmd = (name: string) => ({
      do: () => log.push(`do ${name}`),
      undo: () => log.push(`undo ${name}`),
    });
    expect(get(stack.canUndo)).toBe(false);
    stack.execute(cmd("a"));
    stack.execute(cmd("b"));
    expect(get(stack.canUndo)).toBe(true);
    expect(stack.undo()).toBe(true);
    expect(get(stack.canRedo)).toBe(true);
    expect(stack.redo()).toBe(true);
    stack.undo();
    stack.execute(cmd("c"));
    expect(get(stack.canRedo)).toBe(false);
    expect(stack.redo()).toBe(false);
    expect(log).toEqual(["do a", "do b", "undo b", "do b", "undo b", "do c"]);
    stack.undo();
    stack.undo();
    expect(stack.undo()).toBe(false);
    expect(log.slice(-2)).toEqual(["undo c", "undo a"]);
  });

  test("folds consecutive commands with one key into a single step until sealed", () => {
    const stack = createCommandStack();
    let x = 0;
    const move = (to: number, from: number) => ({
      key: "move:n1",
      do: () => (x = to),
      undo: () => (x = from),
    });
    stack.execute(move(1, 0));
    stack.execute(move(2, 1));
    stack.execute(move(3, 2));
    expect(x).toBe(3);
    stack.undo();
    expect(x).toBe(0);
    stack.redo();
    expect(x).toBe(3);
    stack.seal();
    stack.execute(move(4, 3));
    stack.undo();
    expect(x).toBe(3);
  });

  test("keeps at most the limit", () => {
    const stack = createCommandStack({ limit: 2 });
    let n = 0;
    for (let i = 0; i < 5; i++)
      stack.execute({ do: () => n++, undo: () => n-- });
    stack.undo();
    stack.undo();
    expect(stack.undo()).toBe(false);
    expect(n).toBe(3);
  });
});
