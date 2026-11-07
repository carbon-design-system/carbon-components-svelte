// @vitest-environment node
import TimeRangePicker from "carbon-components-svelte/TimeRangePicker/TimeRangePicker.svelte";
import { renderSSR } from "../utils/ssr";

const now = "2026-11-06T17:30:00.000Z";

function triggerText(props: Record<string, unknown>) {
  const { document } = renderSSR(TimeRangePicker, { now, ...props });
  return document
    .querySelector(".bx--list-box__label")
    ?.textContent?.replace(/\s+/g, " ")
    .trim();
}

describe("TimeRangePicker server render", () => {
  it("names a relative range without a clock or a zone", () => {
    expect(triggerText({ value: { from: "now-15m", to: "now" } })).toBe(
      "Time range: Last 15 minutes",
    );
    expect(triggerText({ value: { from: "now-1d/d", to: "now-1d/d" } })).toBe(
      "Time range: Yesterday",
    );
  });

  it("writes an absolute range in the time zone it is given", () => {
    const value = {
      from: "2026-11-06T14:00:00.000Z",
      to: "2026-11-06T17:30:00.000Z",
    };
    expect(triggerText({ value, timeZone: "America/New_York" })).toBe(
      "Time range: Nov 6, 09:00 – 12:30 (UTC−5)",
    );
    expect(triggerText({ value, timeZone: "Asia/Tokyo" })).toBe(
      "Time range: Nov 6, 23:00 – Nov 7, 02:30 (UTC+9)",
    );
  });

  it("uses UTC, not the server's zone, when none is given", () => {
    const value = {
      from: "2026-11-06T14:00:00.000Z",
      to: "2026-11-06T17:30:00.000Z",
    };
    expect(triggerText({ value })).toBe(
      "Time range: Nov 6, 14:00 – 17:30 (UTC)",
    );
  });

  it("renders the closed control with no panel and no timers", () => {
    const { document } = renderSSR(TimeRangePicker, {
      now,
      stepping: true,
      refresh: "auto",
      refreshInterval: 30,
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(
      document
        .querySelector(".bx--list-box__field")
        ?.getAttribute("aria-expanded"),
    ).toBe("false");
    expect(
      [...document.querySelectorAll("button")].map(
        (button) =>
          button.getAttribute("aria-label") ??
          button.textContent?.replace(/\s+/g, " ").trim(),
      ),
    ).toContain("Zoom out");
  });

  it("derives the panel's ids from the id, so the server and the browser agree", () => {
    const { document } = renderSSR(TimeRangePicker, {
      id: "latency",
      open: true,
      refresh: "auto",
    });
    expect(
      document.querySelector("#latency")?.getAttribute("aria-controls"),
    ).toBe("latency-panel");
    expect(document.querySelector("#latency-panel")).not.toBeNull();
    for (const inner of ["from", "to", "zone", "refresh", "absolute"]) {
      expect(document.querySelector(`#latency-${inner}`)).not.toBeNull();
    }
  });
});
