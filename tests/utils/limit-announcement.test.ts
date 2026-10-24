// @vitest-environment node
import { get } from "svelte/store";
import {
  createLimitAnnouncement,
  LIMIT_ANNOUNCEMENT_DELAY_MS,
} from "../../src/utils/limit-announcement.js";

describe("createLimitAnnouncement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the limit once the count rests on it for 1s", () => {
    const announcement = createLimitAnnouncement(0);
    announcement.track(5, 5, "Limit reached");
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS - 1);
    expect(get(announcement)).toBe("");

    vi.advanceTimersByTime(1);
    expect(get(announcement)).toBe("Limit reached");

    announcement.track(4, 5, "Limit reached");
    expect(get(announcement)).toBe("");
  });

  it("stays silent when the count leaves the limit within the wait", () => {
    const announcement = createLimitAnnouncement(0);
    announcement.track(5, 5, "Limit reached");
    announcement.track(4, 5, "Limit reached");
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS);

    expect(get(announcement)).toBe("");
  });

  it("does not announce a count that starts at the limit", () => {
    const announcement = createLimitAnnouncement(5);
    announcement.track(5, 5, "Limit reached");
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS);

    expect(get(announcement)).toBe("");
  });

  it("reads the text current when the wait ends", () => {
    const announcement = createLimitAnnouncement(0);
    announcement.track(5, 5, "Limit reached");
    announcement.track(5, 5, "Limite atteinte");
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS);

    expect(get(announcement)).toBe("Limite atteinte");
  });

  it.each([
    [0, 0],
    [3, undefined],
    [3, null],
  ])("never announces count %s with maxCount %s", (count, maxCount) => {
    const announcement = createLimitAnnouncement(-1);
    announcement.track(count, maxCount, "Limit reached");
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS);

    expect(get(announcement)).toBe("");
  });

  it("drops a pending announcement on cancel", () => {
    const announcement = createLimitAnnouncement(0);
    announcement.track(5, 5, "Limit reached");
    announcement.cancel();
    vi.advanceTimersByTime(LIMIT_ANNOUNCEMENT_DELAY_MS);

    expect(get(announcement)).toBe("");
  });
});
