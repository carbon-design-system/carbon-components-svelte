import {
  createThrottledSpeaker,
  describeSteps,
  formatDuration,
  isoDuration,
  stepDuration,
} from "carbon-components-svelte/TaskStatusList/task-status.js";
import type { TaskStatus } from "carbon-components-svelte/TaskStatusList/task-status.js";

const steps = (...statuses: TaskStatus[]) =>
  statuses.map((status) => ({ status }));

describe("describeSteps", () => {
  it.each([
    [[], "pending"],
    [["pending", "pending"], "pending"],
    [["succeeded", "pending"], "running"],
    [["succeeded", "running", "pending"], "running"],
    [["succeeded", "skipped"], "succeeded"],
    [["succeeded", "failed", "pending"], "failed"],
    // A step still running keeps the whole running, as in a bulk run
    // that goes on after an error.
    [["failed", "running"], "running"],
    [["succeeded", "canceled", "canceled"], "canceled"],
    [["failed", "canceled"], "failed"],
  ] as const)("%j adds up to %s", (statuses, status) => {
    expect(describeSteps(steps(...statuses)).status).toBe(status);
  });

  it("names the step the status is about", () => {
    const failed = describeSteps(steps("succeeded", "failed", "failed"));
    expect(failed.index).toBe(1);
    expect(failed.counts).toMatchObject({ complete: 1, failed: 2, total: 3 });

    const running = describeSteps(steps("succeeded", "running", "running"));
    expect(running.index).toBe(2);

    const canceled = describeSteps(steps("succeeded", "canceled", "canceled"));
    expect(canceled.index).toBe(1);
    expect(describeSteps(steps("succeeded")).step).toBeUndefined();
  });

  it("reads an unknown status as pending", () => {
    const { counts } = describeSteps([{ status: "done" as TaskStatus }]);
    expect(counts.pending).toBe(1);
  });
});

describe("stepDuration", () => {
  it("measures a finished step from its two times", () => {
    expect(
      stepDuration(
        { status: "succeeded", startedAt: 1000, endedAt: new Date(13_000) },
        null,
      ),
    ).toBe(12_000);
  });

  it("measures a running step against now, and shows nothing without it", () => {
    const step = { status: "running", startedAt: 1000 } as const;
    expect(stepDuration(step, 6000)).toBe(5000);
    expect(stepDuration(step, null)).toBeUndefined();
    expect(stepDuration({ status: "pending" }, 6000)).toBeUndefined();
  });
});

describe("formatDuration", () => {
  it.each([
    [400, "<1s", "PT0S"],
    [12_400, "12s", "PT12S"],
    [65_000, "1m 5s", "PT1M5S"],
    [3_780_000, "1h 3m", "PT1H3M"],
    [3_600_000, "1h 0m", "PT1H"],
  ])("writes %i ms as %s", (ms, text, iso) => {
    expect(formatDuration(ms)).toBe(text);
    expect(isoDuration(ms)).toBe(iso);
  });
});

describe("createThrottledSpeaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says the first message at once, then the newest once per gap", () => {
    const speak = vi.fn();
    const speaker = createThrottledSpeaker(speak, 1000);

    // 50 steps finishing 20 ms apart.
    for (let step = 1; step <= 50; step++) {
      speaker.progress(`${step} of 50`);
      vi.advanceTimersByTime(20);
    }
    vi.advanceTimersByTime(1000);

    expect(speak.mock.calls.map(([text]) => text)).toEqual([
      "1 of 50",
      "50 of 50",
    ]);
  });

  it("says a finished state at once and drops what was waiting", () => {
    const speak = vi.fn();
    const speaker = createThrottledSpeaker(speak, () => 1000);

    speaker.progress("1 of 2");
    speaker.progress("2 of 2 running");
    speaker.now("Failed at step 2", true);
    vi.advanceTimersByTime(5000);

    expect(speak.mock.calls).toEqual([
      ["1 of 2", false],
      ["Failed at step 2", true],
    ]);
  });
});
