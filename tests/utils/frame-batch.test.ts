import { createFrameJob } from "../../src/utils/frame-batch.js";

describe("createFrameJob", () => {
  let queue: Array<{ id: number; callback: FrameRequestCallback }>;
  let nextId: number;

  function flushFrame() {
    const frames = queue;
    queue = [];
    for (const { callback } of frames) callback(0);
  }

  beforeEach(() => {
    queue = [];
    nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = nextId++;
      queue.push({ id, callback });
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      queue = queue.filter((frame) => frame.id !== id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs every job's first stage before any job's second", () => {
    const log: string[] = [];
    const jobs = ["a", "b"].map((name) =>
      createFrameJob([
        () => {
          log.push(`${name}:read`);
          return name;
        },
        (carried) => log.push(`${carried}:write`),
      ]),
    );
    for (const job of jobs) job.schedule();

    expect(queue).toHaveLength(1);
    flushFrame();
    expect(log).toEqual(["a:read", "b:read", "a:write", "b:write"]);
  });

  it("passes each stage's result to the next", () => {
    const seen: number[] = [];
    const job = createFrameJob([() => 1, (n) => n + 1, (n) => seen.push(n)]);
    job.schedule();
    flushFrame();

    expect(seen).toEqual([2]);
  });

  it("runs a job once per frame however often it is scheduled", () => {
    const stage = vi.fn();
    const job = createFrameJob([stage]);
    job.schedule();
    job.schedule();
    flushFrame();
    expect(stage).toHaveBeenCalledTimes(1);

    job.schedule();
    flushFrame();
    expect(stage).toHaveBeenCalledTimes(2);
  });

  it("drops a cancelled job and its frame when it was the only one", () => {
    const stage = vi.fn();
    const job = createFrameJob([stage]);
    job.schedule();
    job.cancel();

    expect(queue).toHaveLength(0);
    flushFrame();
    expect(stage).not.toHaveBeenCalled();
  });

  it("lets a stage cancel a later job in the same frame", () => {
    const later = vi.fn();
    const laterJob = createFrameJob([later]);
    const earlierJob = createFrameJob([() => laterJob.cancel()]);
    earlierJob.schedule();
    laterJob.schedule();
    flushFrame();

    expect(later).not.toHaveBeenCalled();
  });

  it("keeps running the other jobs when one throws, and reports the error", () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const after = vi.fn();
      const failing = createFrameJob([
        () => {
          throw new Error("boom");
        },
        after,
      ]);
      const healthy = createFrameJob([() => 1, after]);
      failing.schedule();
      healthy.schedule();
      flushFrame();

      expect(after).toHaveBeenCalledTimes(1);
      expect(() => vi.runAllTimers()).toThrow("boom");
    } finally {
      vi.useRealTimers();
    }
  });
});
