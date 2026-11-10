// @ts-check
import { describeSteps } from "./task-status.js";

/**
 * @typedef {import("./task-status.js").TaskStatus} TaskStatus
 *
 * @typedef {object} TaskContext
 * @property {AbortSignal} signal - Aborted by `cancel()`. A task that ignores it keeps running, but its result is dropped.
 * @property {number} index - Position of the task in the list.
 * @property {(detail: string) => void} setDetail - Replace the step's detail line, such as "2 of 3 nodes ready".
 *
 * @typedef {object} Task
 * @property {string} id
 * @property {string} label
 * @property {string} [detail] - Shown under the label until the task sets its own.
 * @property {string} [href] - A link to the step's log.
 * @property {boolean | ((context: { index: number }) => boolean)} [skip] - Skip the task, as when its work is already done. Read just before it would start.
 * @property {(context: TaskContext) => unknown} run - Rejecting, or throwing, fails the step.
 *
 * @typedef {object} RunnerStep
 * @property {string} id
 * @property {string} label
 * @property {TaskStatus} status
 * @property {number} [startedAt]
 * @property {number} [endedAt]
 * @property {string} [detail]
 * @property {string} [href]
 * @property {string} [error]
 *
 * @typedef {object} RunnerState
 * @property {"pending" | "running" | "succeeded" | "failed" | "canceled"} status
 * @property {ReadonlyArray<RunnerStep>} steps
 */

/**
 * Run tasks in order, or a few at a time, and report each as a step a
 * `TaskStatusList` can show. The runner is a store: `$runner.steps`.
 *
 * Cancel aborts the signal, marks the running and waiting steps
 * `"canceled"` at once, and drops whatever a task that ignores the signal
 * returns later. Retry re-runs the failed, canceled and waiting steps, or
 * every step. Dependencies between tasks are the caller's: run an
 * independent group as one task, or order the list.
 *
 * @param {ReadonlyArray<Task>} tasks
 * @param {object} [options]
 * @param {number} [options.concurrency] - How many tasks run at once. Defaults to `1`: in order.
 * @param {"stop" | "continue"} [options.onError] - What a failure does to the steps after it. `"stop"` (the default) starts no more; `"continue"` runs them all, as a bulk delete does.
 * @param {() => number} [options.now] - The clock, in milliseconds. Defaults to `Date.now`.
 * @param {(error: unknown) => string} [options.formatError] - The text of a failed step's error. Defaults to the error's message.
 */
export function createTaskRunner(tasks, options = {}) {
  const {
    concurrency = 1,
    onError = "stop",
    now = Date.now,
    formatError = defaultFormatError,
  } = options;

  /** @type {Array<RunnerStep>} */
  let steps = tasks.map(initialStep);
  /** @type {RunnerState} */
  let state = snapshot();
  /** @type {Set<(state: RunnerState) => void>} */
  const subscribers = new Set();
  /** @type {AbortController | undefined} */
  let controller;
  /** Bumped when a run starts and when it is canceled, so a late result of an earlier run is dropped. */
  let generation = 0;
  /** @type {Promise<RunnerState> | undefined} */
  let current;

  /** @param {Task} task @returns {RunnerStep} */
  function initialStep(task) {
    return {
      id: task.id,
      label: task.label,
      status: "pending",
      detail: task.detail,
      href: task.href,
    };
  }

  function snapshot() {
    return { status: describeSteps(steps).status, steps };
  }

  function publish() {
    state = snapshot();
    for (const subscriber of subscribers) subscriber(state);
  }

  /**
   * @param {number} index
   * @param {Partial<RunnerStep>} fields
   */
  function patch(index, fields) {
    steps = steps.slice();
    steps[index] = { ...steps[index], ...fields };
    publish();
  }

  /**
   * @param {number} index
   * @param {number} generationAtStart
   * @param {AbortSignal} signal
   * @returns {Promise<"failed" | "done">}
   */
  async function execute(index, generationAtStart, signal) {
    const task = tasks[index];
    const stale = () => generationAtStart !== generation;

    const skip =
      typeof task.skip === "function" ? task.skip({ index }) : task.skip;
    if (skip) {
      patch(index, { status: "skipped" });
      return "done";
    }

    patch(index, {
      status: "running",
      startedAt: now(),
      endedAt: undefined,
      error: undefined,
    });

    try {
      await task.run({
        signal,
        index,
        setDetail(detail) {
          if (!stale()) patch(index, { detail });
        },
      });
      if (stale()) return "done";
      patch(index, { status: "succeeded", endedAt: now() });
      return "done";
    } catch (error) {
      if (stale()) return "done";
      patch(index, {
        status: "failed",
        endedAt: now(),
        error: formatError(error),
      });
      return "failed";
    }
  }

  /** @param {ReadonlyArray<number>} indexes */
  function start(indexes) {
    const generationAtStart = ++generation;
    const abort = new AbortController();
    controller = abort;
    let cursor = 0;
    let stopped = false;

    async function worker() {
      while (!stopped && generationAtStart === generation) {
        const position = cursor++;
        if (position >= indexes.length) return;
        // eslint-disable-next-line no-await-in-loop -- a worker runs one task at a time
        const outcome = await execute(
          indexes[position],
          generationAtStart,
          abort.signal,
        );
        if (outcome === "failed" && onError === "stop") stopped = true;
      }
    }

    const workers = Array.from(
      { length: Math.max(1, Math.min(concurrency, indexes.length)) },
      worker,
    );
    // A task that ignores the signal may never settle, so the run ends on
    // the abort too.
    const aborted = new Promise((resolve) => {
      abort.signal.addEventListener("abort", resolve, { once: true });
    });
    const result = Promise.race([Promise.all(workers), aborted]).then(() => {
      if (generationAtStart === generation) {
        controller = undefined;
        current = undefined;
      }
      return state;
    });
    current = result;
    return result;
  }

  /**
   * Run every task from the start.
   * @returns {Promise<RunnerState>} The state when the run ends. Never rejects.
   */
  function run() {
    if (current) return current;
    steps = tasks.map(initialStep);
    publish();
    return start(tasks.map((_, index) => index));
  }

  /**
   * Run again what did not finish, or everything.
   * @param {{ from?: "failed" | "start" }} [retryOptions] - `"failed"` (the default) re-runs the failed, canceled and waiting steps and keeps the finished ones. `"start"` re-runs every step.
   * @returns {Promise<RunnerState>}
   */
  function retry(retryOptions = {}) {
    if (current) return current;
    const from = retryOptions.from ?? "failed";
    /** @type {Array<number>} */
    const indexes = [];
    steps = steps.slice();
    steps.forEach((step, index) => {
      if (
        from === "start" ||
        step.status === "failed" ||
        step.status === "canceled" ||
        step.status === "pending"
      ) {
        steps[index] = initialStep(tasks[index]);
        indexes.push(index);
      }
    });
    publish();
    return start(indexes);
  }

  /** Stop the run: the running and waiting steps become `"canceled"`. */
  function cancel() {
    if (!controller) return;
    const abort = controller;
    controller = undefined;
    current = undefined;
    generation++;
    steps = steps.map((step) =>
      step.status === "running"
        ? { ...step, status: "canceled", endedAt: now() }
        : step.status === "pending"
          ? { ...step, status: "canceled" }
          : step,
    );
    publish();
    abort.abort();
  }

  /** Cancel a run, and set every step back to waiting. */
  function clear() {
    cancel();
    steps = tasks.map(initialStep);
    publish();
  }

  return {
    /**
     * The store contract: calls `callback` with the state now and on every
     * change, and returns the function that stops it.
     * @param {(state: RunnerState) => void} callback
     */
    subscribe(callback) {
      subscribers.add(callback);
      callback(state);
      return () => {
        subscribers.delete(callback);
      };
    },
    get: () => state,
    run,
    retry,
    cancel,
    reset: clear,
  };
}

/** @param {unknown} error */
function defaultFormatError(error) {
  if (error instanceof Error) return error.message || String(error);
  return String(error);
}
