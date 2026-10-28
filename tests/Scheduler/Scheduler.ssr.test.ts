// @vitest-environment node
import Scheduler from "carbon-components-svelte/Scheduler/Scheduler.svelte";
import { renderSSR } from "../utils/ssr";
import { la } from "./scheduler-fixtures";

const props = {
  date: la(2026, 10, 28, 12),
  timeZone: "America/Los_Angeles",
  locale: "en-US",
  events: [
    {
      id: "a",
      title: "Standup",
      start: la(2026, 10, 27, 9),
      end: la(2026, 10, 27, 9, 30),
    },
    {
      id: "b",
      title: "Offsite",
      start: la(2026, 10, 28),
      end: la(2026, 10, 30),
      allDay: true,
    },
  ],
};

describe("Scheduler on the server", () => {
  it("renders the week and its events without the clock", () => {
    const { document } = renderSSR(Scheduler, props);

    expect(
      document.querySelector(".bx--scheduler")?.getAttribute("aria-label"),
    ).toBe("Oct 25 to Oct 31, 2026");
    expect(
      [...document.querySelectorAll("[data-event-id]")].map((el) =>
        el.getAttribute("data-event-id"),
      ),
    ).toEqual(["b", "a"]);
    // The current time is read after mount, so the first paint has no line
    // and no "today" in a day's name.
    expect(document.querySelector(".bx--scheduler__now")).toBeNull();
    expect(document.body.innerHTML).not.toContain(", today");
  });

  it("starts with one tab stop on the day being shown", () => {
    const { document } = renderSSR(Scheduler, props);
    const stops = [...document.querySelectorAll('[data-cell][tabindex="0"]')];
    expect(stops.map((el) => el.getAttribute("aria-label"))).toEqual([
      "Wednesday, October 28, 2026",
    ]);
  });

  it("renders the month view", () => {
    const { document } = renderSSR(Scheduler, { ...props, view: "month" });
    expect(document.querySelectorAll('[role="gridcell"]')).toHaveLength(35);
  });
});
