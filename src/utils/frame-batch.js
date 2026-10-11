// @ts-check

/**
 * Staged work that every caller scheduled in a frame runs together.
 *
 * A job that reads layout, writes styles, then reads layout again forces a
 * layout on every read after a write. Run one after another, N jobs force N
 * layouts. Here the jobs run stage by stage: every job's first stage, then
 * every job's second stage, and so on. Put each job's reads in one stage and
 * its writes in the next, and N jobs force one layout between them.
 *
 * Each stage receives what the job's previous stage returned.
 *
 * @typedef {(carry: any) => any} FrameStage
 * @typedef {{ schedule: () => void, cancel: () => void }} FrameJob
 */

/**
 * @typedef {{
 *   stages: ReadonlyArray<FrameStage>,
 *   carry: unknown,
 *   cancelled: boolean,
 * }} Run
 */

/** @type {Map<FrameJob, Run>} */
const pending = new Map();

/**
 * The runs of the frame in progress, so a stage can cancel a later job.
 * @type {Map<FrameJob, Run>}
 */
let running = new Map();

/** @type {number | null} */
let frame = null;

function runFrame() {
  frame = null;
  running = new Map(pending);
  pending.clear();
  const runs = [...running.values()];
  /** @type {unknown[]} */
  const errors = [];
  const stageCount = Math.max(0, ...runs.map((run) => run.stages.length));
  for (let index = 0; index < stageCount; index++) {
    for (const run of runs) {
      const stage = run.stages[index];
      if (run.cancelled || !stage) continue;
      try {
        run.carry = stage(run.carry);
      } catch (error) {
        // A throwing job stops, and doesn't stop the others.
        run.cancelled = true;
        errors.push(error);
      }
    }
  }
  running = new Map();
  for (const error of errors) {
    setTimeout(() => {
      throw error;
    });
  }
}

/**
 * Create a job whose `stages` run in the next animation frame, together with
 * every other scheduled job's. Scheduling again before then changes nothing.
 * `cancel()` drops a scheduled job, including from inside a frame's stages.
 * Without `requestAnimationFrame` (server rendering) nothing runs.
 *
 * @param {ReadonlyArray<FrameStage>} stages
 * @returns {FrameJob}
 * @example
 * ```js
 * const job = createFrameJob([
 *   () => measure(), // reads
 *   (sizes) => apply(sizes), // writes
 * ]);
 * job.schedule();
 * ```
 */
export function createFrameJob(stages) {
  /** @type {FrameJob} */
  const job = {
    schedule() {
      if (pending.has(job) || typeof requestAnimationFrame !== "function") {
        return;
      }
      pending.set(job, { stages, carry: undefined, cancelled: false });
      if (frame === null) frame = requestAnimationFrame(runFrame);
    },
    cancel() {
      const run = pending.get(job) ?? running.get(job);
      if (run) run.cancelled = true;
      pending.delete(job);
      if (pending.size === 0 && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    },
  };
  return job;
}
