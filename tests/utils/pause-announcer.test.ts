import { get } from "svelte/store";
import { createPauseAnnouncer } from "../../src/utils/pause-announcer.js";

describe("createPauseAnnouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("speaks only after typing pauses, and only the last message", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.schedule("Strength: weak");
    vi.advanceTimersByTime(600);
    announcer.schedule("Strength: fair");
    vi.advanceTimersByTime(600);
    expect(get(announcer)).toBe("");
    vi.advanceTimersByTime(400);
    expect(get(announcer)).toBe("Strength: fair");
  });

  it("speaks a pending message at once on flush", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.schedule("Strength: good");
    announcer.flush();
    expect(get(announcer)).toBe("Strength: good");
  });

  it("says nothing for a change that is undone inside the pause", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.prime("Strength: weak");
    announcer.schedule("Strength: fair");
    vi.advanceTimersByTime(300);
    announcer.schedule("Strength: weak");
    vi.advanceTimersByTime(2000);
    expect(get(announcer)).toBe("");
  });

  it("does not announce the baseline set by prime", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.prime("Strength: good");
    announcer.schedule("Strength: good");
    vi.advanceTimersByTime(2000);
    expect(get(announcer)).toBe("");
  });

  it("clears the region and starts over when the field is emptied", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.schedule("Strength: weak");
    vi.advanceTimersByTime(1000);
    announcer.schedule("");
    expect(get(announcer)).toBe("");
    announcer.schedule("Strength: weak");
    vi.advanceTimersByTime(1000);
    expect(get(announcer)).toBe("Strength: weak");
  });

  it("drops a pending message on cancel", () => {
    const announcer = createPauseAnnouncer(1000);
    announcer.schedule("Strength: good");
    announcer.cancel();
    vi.advanceTimersByTime(2000);
    expect(get(announcer)).toBe("");
  });
});
