export type TaskStatus =
  "pending" | "running" | "succeeded" | "failed" | "skipped" | "canceled";

export type TimedStep = {
  status: TaskStatus;
  startedAt?: number | Date;
  endedAt?: number | Date;
};

export type TaskCounts = {
  total: number;
  pending: number;
  running: number;
  succeeded: number;
  failed: number;
  skipped: number;
  canceled: number;
  /** Succeeded and skipped. */
  complete: number;
};

export const TASK_STATUSES: ReadonlyArray<TaskStatus>;

/** A status the list does not know reads as `"pending"`. */
export function normalizeStatus(status: unknown): TaskStatus;

/** What the steps add up to, and the step that status is about. */
export function describeSteps<Step extends { status: TaskStatus }>(
  steps: ReadonlyArray<Step>,
): {
  status: "pending" | "running" | "succeeded" | "failed" | "canceled";
  counts: TaskCounts;
  index: number;
  step: Step | undefined;
};

export function toMillis(value: unknown): number | undefined;

/** How long a step took, or has taken. */
export function stepDuration(
  step: TimedStep,
  now: number | null,
): number | undefined;

/** Short and unit-led: "<1s", "12s", "1m 5s", "2h 3m". */
export function formatDuration(ms: number): string;

/** The value of a `<time datetime>` for a length of time, such as "PT1M5S". */
export function isoDuration(ms: number): string;

/** Send progress at most once per `delay` ms, newest message wins. */
export function createThrottledSpeaker(
  speak: (text: string, assertive: boolean) => void,
  delay: number | (() => number),
): {
  progress: (text: string) => void;
  now: (text: string, assertive?: boolean) => void;
  cancel: () => void;
};
