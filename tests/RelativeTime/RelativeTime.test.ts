import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import RelativeTime from "./RelativeTime.test.svelte";
import RelativeTimeLive from "./RelativeTimeLive.test.svelte";
import RelativeTimeLivePair from "./RelativeTimeLivePair.test.svelte";

describe("RelativeTime", () => {
  it("renders relative text with an ISO datetime and the absolute time as title", () => {
    render(RelativeTime);

    const el = screen.getByTestId("basic");
    expect(el).toHaveTextContent("5 minutes ago");
    expect(el).toHaveAttribute("datetime", "2026-09-13T11:55:00.000Z");
    // Newer ICU versions put a narrow no-break space before AM/PM.
    expect(el.getAttribute("title")?.replace(/\s/g, " ")).toBe(
      "Sep 13, 2026, 11:55 AM",
    );
  });

  it.each([
    ["numeric-always", "1 day ago"],
    ["numeric-auto", "yesterday"],
    ["short-style", "5 min. ago"],
    ["slot-fixture", "Updated 5 minutes ago"],
  ])("renders the %s fixture as %s", (testId, text) => {
    render(RelativeTime);

    expect(screen.getByTestId(testId)).toHaveTextContent(text);
  });

  it("renders an empty time element with no datetime for an invalid date", () => {
    render(RelativeTime);

    const el = screen.getByTestId("invalid");
    expect(el).not.toHaveAttribute("datetime");
    expect(el).toHaveTextContent("");
  });

  it("lets a consumer's title override the default absolute time", () => {
    render(RelativeTime);

    expect(screen.getByTestId("custom-title")).toHaveAttribute(
      "title",
      "Custom",
    );
  });

  describe("live", () => {
    const now = Date.parse("2026-09-13T12:00:00Z");

    beforeEach(() => {
      vi.useFakeTimers({ now });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("refreshes on an adaptive timer and clears it on unmount", async () => {
      const { unmount } = render(RelativeTimeLive, {
        props: { date: now - 30_000 },
      });

      expect(screen.getByTestId("live")).toHaveTextContent("30 seconds ago");
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(31_000);
      await tick();

      expect(screen.getByTestId("live")).toHaveTextContent("1 minute ago");
      expect(vi.getTimerCount()).toBe(1);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
      [
        "date changes",
        { date: now - 3 * 60 * 60_000 },
        30 * 60_000,
        { date: now + 30 * 60_000 - 10_000 },
        "10 seconds ago",
      ],
      [
        "live turns on",
        { date: now - 60_000, live: false },
        10 * 60_000,
        { live: true },
        "11 minutes ago",
      ],
      [
        "now is removed",
        { date: now - 60_000, now },
        10 * 60_000,
        { now: undefined },
        "11 minutes ago",
      ],
    ])(
      "re-reads the clock when %s between ticks",
      async (_, props, elapsed, next, text) => {
        const { rerender } = render(RelativeTimeLive, { props });

        vi.advanceTimersByTime(elapsed);
        await rerender(next);

        expect(screen.getByTestId("live")).toHaveTextContent(text);
      },
    );

    it("shares one timer across instances in the same cadence", () => {
      const { unmount } = render(RelativeTimeLivePair, {
        props: { dateA: now - 30_000, dateB: now - 20_000 },
      });

      expect(vi.getTimerCount()).toBe(1);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("formatter cache", () => {
    const OriginalRelativeTimeFormat = Intl.RelativeTimeFormat;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reuses a single Intl.RelativeTimeFormat instance for identical locale and options", () => {
      class MockRelativeTimeFormat extends OriginalRelativeTimeFormat {}
      const spy = vi
        .spyOn(Intl, "RelativeTimeFormat")
        .mockImplementation(MockRelativeTimeFormat);

      render(RelativeTime);

      const calls = spy.mock.calls.filter(([locale]) => locale === "sv");
      expect(calls.length).toBeLessThanOrEqual(1);
    });
  });
});
