// @vitest-environment node
import BookingSlots from "carbon-components-svelte/BookingSlots/BookingSlots.svelte";
import { slotsFromWindows } from "carbon-components-svelte/BookingSlots/booking-slots.js";
import { renderSSR } from "../utils/ssr";

const slots = slotsFromWindows([
  { start: "2026-11-11T14:00:00Z", end: "2026-11-11T16:00:00Z" },
  { start: "2026-11-13T14:00:00Z", end: "2026-11-13T15:00:00Z" },
]);
const props = { now: "2026-11-06T12:00:00Z", timeZone: "America/Toronto" };

describe("BookingSlots server render", () => {
  it("renders the chosen day's times in the zone, from a fixed now", () => {
    const { document } = renderSSR(BookingSlots, {
      ...props,
      slots,
      date: "2026-11-11",
    });

    const group = document.querySelector('[role="radiogroup"]');
    expect(group?.getAttribute("aria-label")).toBe(
      "Available times on Wednesday, Nov 11",
    );
    expect(
      [...document.querySelectorAll('[role="radio"]')].map((radio) =>
        radio.textContent?.trim(),
      ),
    ).toEqual(["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM"]);
    expect(document.body.textContent).toContain(
      "Times shown in America/Toronto",
    );
  });

  it("marks the chosen time and gives the grid one tab stop", () => {
    const { document } = renderSSR(BookingSlots, {
      ...props,
      slots,
      value: "2026-11-11T15:00:00.000Z",
    });

    const radios = [...document.querySelectorAll('[role="radio"]')];
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual([
      "false",
      "false",
      "true",
      "false",
    ]);
    expect(radios.map((r) => r.getAttribute("tabindex"))).toEqual([
      "-1",
      "-1",
      "0",
      "-1",
    ]);
  });

  it("disables the days without times and renders the same twice", () => {
    const first = renderSSR(BookingSlots, { ...props, slots });
    const second = renderSSR(BookingSlots, { ...props, slots });
    const disabled = (day: string) =>
      first.document
        .querySelector(`[role="gridcell"][aria-label="${day}"]`)
        ?.getAttribute("aria-disabled");

    expect(disabled("Wednesday, November 11, 2026")).toBeNull();
    expect(disabled("Thursday, November 12, 2026")).toBe("true");
    expect(second.html).toBe(first.html);
  });

  it("shows the hint and a jump before a day is chosen", () => {
    const { document } = renderSSR(BookingSlots, { ...props, slots });

    expect(document.body.textContent).toContain(
      "Select a date to see available times",
    );
    expect(document.body.textContent).toContain("Next available: Wed, Nov 11");
  });

  it("does not call loadSlots on the server", () => {
    const loadSlots = vi.fn(() => Promise.resolve(slots));
    renderSSR(BookingSlots, { ...props, loadSlots });

    expect(loadSlots).not.toHaveBeenCalled();
  });
});
