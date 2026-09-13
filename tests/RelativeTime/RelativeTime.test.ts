import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import RelativeTime from "./RelativeTime.test.svelte";
import RelativeTimeLive from "./RelativeTimeLive.test.svelte";

describe("RelativeTime", () => {
  it("renders relative text with an ISO datetime and a non-empty title", () => {
    render(RelativeTime);

    const el = screen.getByTestId("basic");
    expect(el).toHaveTextContent("5 minutes ago");
    expect(el).toHaveAttribute("datetime");
    expect(el.getAttribute("title")).not.toBe("");
  });

  it("respects numeric always vs the default auto", () => {
    render(RelativeTime);

    expect(screen.getByTestId("numeric-always")).toHaveTextContent("1 day ago");
    expect(screen.getByTestId("numeric-auto")).toHaveTextContent("yesterday");
  });

  it("respects the short style", () => {
    render(RelativeTime);

    expect(screen.getByTestId("short-style")).toHaveTextContent("5 min. ago");
  });

  it("exposes formatted through the default slot", () => {
    render(RelativeTime);

    expect(screen.getByTestId("slot-fixture")).toHaveTextContent(
      "Updated 5 minutes ago",
    );
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

      vi.advanceTimersByTime(31_000);
      await tick();

      expect(screen.getByTestId("live")).toHaveTextContent("1 minute ago");

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
