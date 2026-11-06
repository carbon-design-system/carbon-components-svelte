import { createTaskRunner } from "carbon-components-svelte/TaskStatusList/task-runner.js";
import type {
  Task,
  TaskContext,
} from "carbon-components-svelte/TaskStatusList/task-runner.js";

/** A task that settles when the test says so. */
function gate(id: string, label = id) {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  let context!: TaskContext;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  const task: Task = {
    id,
    label,
    run: (given) => {
      context = given;
      return promise;
    },
  };
  return { task, resolve, reject, context: () => context };
}

const statuses = (runner: ReturnType<typeof createTaskRunner>) =>
  runner.get().steps.map((step) => step.status);

describe("createTaskRunner", () => {
  it("runs the tasks in order and times each step", async () => {
    let clock = 1000;
    const order: string[] = [];
    const runner = createTaskRunner(
      ["vpc", "cluster"].map((id) => ({
        id,
        label: id,
        run: () => {
          order.push(id);
          clock += 500;
        },
      })),
      { now: () => clock },
    );

    const result = await runner.run();

    expect(order).toEqual(["vpc", "cluster"]);
    expect(result.status).toBe("succeeded");
    expect(result.steps[0]).toMatchObject({
      status: "succeeded",
      startedAt: 1000,
      endedAt: 1500,
    });
    expect(result.steps[1].startedAt).toBe(1500);
  });

  it("is a store: the state now, then every change", async () => {
    const seen: string[][] = [];
    const runner = createTaskRunner([{ id: "a", label: "A", run: () => {} }]);
    const stop = runner.subscribe((state) =>
      seen.push(state.steps.map((step) => step.status)),
    );

    await runner.run();
    stop();
    await runner.run();

    expect(seen).toEqual([
      ["pending"],
      ["pending"],
      ["running"],
      ["succeeded"],
    ]);
  });

  it("stops at a failure by default and keeps the error", async () => {
    const run = vi.fn();
    const runner = createTaskRunner([
      { id: "a", label: "A", run: () => {} },
      {
        id: "b",
        label: "B",
        run: () => {
          throw new Error("Quota exceeded");
        },
      },
      { id: "c", label: "C", run },
    ]);

    const result = await runner.run();

    expect(statuses(runner)).toEqual(["succeeded", "failed", "pending"]);
    expect(result.status).toBe("failed");
    expect(result.steps[1].error).toBe("Quota exceeded");
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the rest after a failure with onError continue", async () => {
    const runner = createTaskRunner(
      [1, 2, 3].map((n) => ({
        id: `item-${n}`,
        label: `Item ${n}`,
        run: () => {
          if (n === 2) throw new Error("Locked");
        },
      })),
      { onError: "continue" },
    );

    await runner.run();

    expect(statuses(runner)).toEqual(["succeeded", "failed", "succeeded"]);
    expect(runner.get().status).toBe("failed");
  });

  it("runs up to `concurrency` tasks at once", async () => {
    const gates = [1, 2, 3, 4].map((n) => gate(`t${n}`));
    const runner = createTaskRunner(
      gates.map(({ task }) => task),
      { concurrency: 2 },
    );

    const done = runner.run();
    expect(statuses(runner)).toEqual([
      "running",
      "running",
      "pending",
      "pending",
    ]);

    gates[0].resolve();
    await vi.waitFor(() =>
      expect(statuses(runner)).toEqual([
        "succeeded",
        "running",
        "running",
        "pending",
      ]),
    );

    for (const { resolve } of gates) resolve();
    expect((await done).status).toBe("succeeded");
  });

  it("cancels mid-step: aborts the signal, marks the steps, and ignores a late result", async () => {
    const first = gate("a");
    const second = gate("b");
    const third = gate("c");
    const runner = createTaskRunner([first.task, second.task, third.task]);

    const done = runner.run();
    first.resolve();
    await vi.waitFor(() =>
      expect(statuses(runner)).toEqual(["succeeded", "running", "pending"]),
    );

    runner.cancel();

    expect(second.context().signal.aborted).toBe(true);
    expect(statuses(runner)).toEqual(["succeeded", "canceled", "canceled"]);
    expect(runner.get().status).toBe("canceled");
    expect(runner.get().steps[1].endedAt).toBeDefined();
    // The run ends at the cancel, though `second` never settles.
    expect((await done).status).toBe("canceled");

    // A task that ignores the signal and fails later changes nothing.
    second.reject(new Error("late"));
    await Promise.resolve();
    expect(statuses(runner)).toEqual(["succeeded", "canceled", "canceled"]);
  });

  it("retries from the failed step and keeps what finished", async () => {
    let clock = 0;
    let attempts = 0;
    const calls: string[] = [];
    const runner = createTaskRunner(
      [
        { id: "a", label: "A", run: () => calls.push("a") },
        {
          id: "b",
          label: "B",
          run: () => {
            calls.push("b");
            if (++attempts === 1) throw new Error("Timed out");
          },
        },
        { id: "c", label: "C", run: () => calls.push("c") },
      ],
      { now: () => ++clock },
    );

    await runner.run();
    const before = runner.get().steps[0];
    const result = await runner.retry({ from: "failed" });

    expect(calls).toEqual(["a", "b", "b", "c"]);
    expect(result.status).toBe("succeeded");
    // The first step was not run again.
    expect(result.steps[0]).toBe(before);
    expect(result.steps[1].error).toBeUndefined();
  });

  it("retries every step from the start, and runs canceled steps again", async () => {
    const calls: string[] = [];
    const first = gate("a");
    const runner = createTaskRunner([
      first.task,
      { id: "b", label: "B", run: () => calls.push("b") },
    ]);

    const done = runner.run();
    runner.cancel();
    await done;
    expect(statuses(runner)).toEqual(["canceled", "canceled"]);

    first.resolve();
    await runner.retry({ from: "start" });

    expect(calls).toEqual(["b"]);
    expect(statuses(runner)).toEqual(["succeeded", "succeeded"]);
  });

  it("skips a task, and lets a running task set its detail", async () => {
    const runner = createTaskRunner([
      { id: "a", label: "A", skip: () => true, run: vi.fn() },
      {
        id: "b",
        label: "B",
        detail: "Waiting",
        run: ({ setDetail }) => setDetail("2 of 3 nodes ready"),
      },
    ]);

    const result = await runner.run();

    expect(result.steps[0].status).toBe("skipped");
    expect(result.steps[1].detail).toBe("2 of 3 nodes ready");
    expect(result.status).toBe("succeeded");
  });
});
