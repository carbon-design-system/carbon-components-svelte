// @ts-check

/**
 * @typedef {"pending" | "running" | "succeeded" | "failed" | "skipped" | "canceled"} TaskStatus
 * @typedef {{ status: TaskStatus; startedAt?: number | Date; endedAt?: number | Date }} TimedStep
 */

/** @type {ReadonlyArray<TaskStatus>} */
export const TASK_STATUSES = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
  "canceled",
];

/**
 * A status the list does not know reads as `"pending"`, so a typo in app
 * data never leaves a row with no icon and no status text.
 * @param {unknown} status
 * @returns {TaskStatus}
 */
export function normalizeStatus(status) {
  return /** @type {ReadonlyArray<unknown>} */ (TASK_STATUSES).includes(status)
    ? /** @type {TaskStatus} */ (status)
    : "pending";
}

/**
 * What the steps add up to. A running step makes the whole `"running"`,
 * even when another step already failed (a bulk run that goes on after an
 * error). With nothing running, a failure beats a cancel, and a cancel
 * beats the rest. Some steps done and none running reads `"running"`: the
 * gap between one step and the next.
 * @template {{ status: TaskStatus }} Step
 * @param {ReadonlyArray<Step>} steps
 * @returns {{
 *   status: "pending" | "running" | "succeeded" | "failed" | "canceled";
 *   counts: { total: number; pending: number; running: number; succeeded: number; failed: number; skipped: number; canceled: number; complete: number };
 *   index: number;
 *   step: Step | undefined;
 * }}
 */
export function describeSteps(steps) {
  const counts = {
    total: steps.length,
    pending: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    canceled: 0,
    complete: 0,
  };
  let failedIndex = -1;
  let canceledIndex = -1;
  let runningIndex = -1;

  for (let index = 0; index < steps.length; index++) {
    const status = normalizeStatus(steps[index].status);
    counts[status]++;
    if (status === "failed" && failedIndex < 0) failedIndex = index;
    if (status === "canceled" && canceledIndex < 0) canceledIndex = index;
    if (status === "running") runningIndex = index;
  }
  counts.complete = counts.succeeded + counts.skipped;

  /** @type {"pending" | "running" | "succeeded" | "failed" | "canceled"} */
  let status = "running";
  if (counts.running > 0) status = "running";
  else if (counts.failed > 0) status = "failed";
  else if (counts.canceled > 0) status = "canceled";
  else if (counts.total > 0 && counts.complete === counts.total)
    status = "succeeded";
  else if (counts.complete === 0) status = "pending";

  // The step the status is about: the first failure, the first step the
  // cancel stopped, or the latest runner.
  const index =
    status === "failed"
      ? failedIndex
      : status === "canceled"
        ? canceledIndex
        : runningIndex;
  return { status, counts, index, step: steps[index] };
}

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
export function toMillis(value) {
  const ms = value instanceof Date ? value.getTime() : value;
  return typeof ms === "number" && Number.isFinite(ms) ? ms : undefined;
}

/**
 * How long a step took, or has taken. A running step needs `now`, so a
 * server render and the first client render, which have none, show no time.
 * @param {TimedStep} step
 * @param {number | null} now
 * @returns {number | undefined}
 */
export function stepDuration(step, now) {
  const started = toMillis(step.startedAt);
  if (started === undefined) return undefined;
  const ended = toMillis(step.endedAt);
  if (ended !== undefined) return Math.max(0, ended - started);
  if (step.status === "running" && now != null) {
    return Math.max(0, now - started);
  }
  return undefined;
}

/**
 * Short and unit-led: "<1s", "12s", "1m 5s", "2h 3m". Not padded like a
 * clock, so a screen reader says "1 minute 5 seconds", not "one oh five".
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1000) return "<1s";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * The value of a `<time datetime>` for a length of time, such as "PT1M5S".
 * @param {number} ms
 * @returns {string}
 */
export function isoDuration(ms) {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
}

/**
 * Sends progress at most once per `delay` ms: the first message goes at
 * once, later ones wait, and only the newest is sent, so 50 steps that
 * finish in a second say one thing. A finished state goes through `now`,
 * which sends at once and drops what was waiting. This is the shape of
 * `announce(…, { throttle })` in the announcer, kept local until that lands.
 * @param {(text: string, assertive: boolean) => void} speak
 * @param {number | (() => number)} delay
 */
export function createThrottledSpeaker(speak, delay) {
  let last = -Infinity;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {string | undefined} */
  let waiting;

  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    waiting = undefined;
  }

  /**
   * @param {string} text
   * @param {boolean} assertive
   */
  function send(text, assertive) {
    last = Date.now();
    speak(text, assertive);
  }

  return {
    /** @param {string} text */
    progress(text) {
      const gap = typeof delay === "function" ? delay() : delay;
      const wait = last + gap - Date.now();
      if (wait <= 0 && timer === undefined) {
        send(text, false);
        return;
      }
      waiting = text;
      if (timer !== undefined) return;
      timer = setTimeout(
        () => {
          timer = undefined;
          const next = waiting;
          waiting = undefined;
          if (next !== undefined) send(next, false);
        },
        Math.max(0, wait),
      );
    },
    /**
     * @param {string} text
     * @param {boolean} [assertive]
     */
    now(text, assertive = false) {
      cancel();
      send(text, assertive);
    },
    cancel,
  };
}
