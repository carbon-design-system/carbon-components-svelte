import type { TaskStatus } from "./task-status.js";

export type TaskContext = {
  /** Aborted by `cancel()`. */
  signal: AbortSignal;
  /** Position of the task in the list. */
  index: number;
  /** Replace the step's detail line. */
  setDetail: (detail: string) => void;
};

export type Task = {
  id: string;
  label: string;
  detail?: string;
  /** A link to the step's log. */
  href?: string;
  /** Skip the task, as when its work is already done. */
  skip?: boolean | ((context: { index: number }) => boolean);
  /** Rejecting, or throwing, fails the step. */
  run: (context: TaskContext) => unknown;
};

export type RunnerStep = {
  id: string;
  label: string;
  status: TaskStatus;
  startedAt?: number;
  endedAt?: number;
  detail?: string;
  href?: string;
  error?: string;
};

export type RunnerState = {
  status: "pending" | "running" | "succeeded" | "failed" | "canceled";
  steps: ReadonlyArray<RunnerStep>;
};

export type TaskRunnerOptions = {
  /** How many tasks run at once. Defaults to `1`. */
  concurrency?: number;
  /** What a failure does to the steps after it. Defaults to `"stop"`. */
  onError?: "stop" | "continue";
  /** The clock, in milliseconds. Defaults to `Date.now`. */
  now?: () => number;
  /** The text of a failed step's error. Defaults to the error's message. */
  formatError?: (error: unknown) => string;
};

export type TaskRunner = {
  /** The store contract. */
  subscribe: (callback: (state: RunnerState) => void) => () => void;
  get: () => RunnerState;
  /** Run every task from the start. Never rejects. */
  run: () => Promise<RunnerState>;
  /** Run again what did not finish, or every step. */
  retry: (options?: { from?: "failed" | "start" }) => Promise<RunnerState>;
  /** Mark the running and waiting steps canceled. */
  cancel: () => void;
  /** Cancel a run, and set every step back to waiting. */
  reset: () => void;
};

/**
 * Run tasks in order, or a few at a time, and report each as a step a
 * `TaskStatusList` can show. The runner is a store: `$runner.steps`.
 */
export function createTaskRunner(
  tasks: ReadonlyArray<Task>,
  options?: TaskRunnerOptions,
): TaskRunner;
