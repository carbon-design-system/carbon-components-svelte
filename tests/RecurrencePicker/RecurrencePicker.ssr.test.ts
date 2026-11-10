// @vitest-environment node
import RecurrencePicker from "carbon-components-svelte/RecurrencePicker/RecurrencePicker.svelte";
import { RANDOM_ID, renderRaw, renderSSR } from "../utils/ssr";

const props = {
  value: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;WKST=SU;UNTIL=20261231",
  startDate: new Date(2026, 10, 3),
  previewCount: 3,
  id: "repeat",
};

describe("RecurrencePicker server render", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the summary, the weekday buttons and the next dates", () => {
    const { document } = renderSSR(RecurrencePicker, props);

    expect(
      document.querySelector(".bx--recurrence-picker__summary")?.textContent,
    ).toBe("Every 2 weeks on Tuesday and Thursday, until Dec 31, 2026");
    expect(
      [...document.querySelectorAll("[aria-pressed=true]")].map((b) =>
        b.getAttribute("aria-label"),
      ),
    ).toEqual(["Tuesday", "Thursday"]);
    expect(
      [...document.querySelectorAll(".bx--recurrence-picker__preview li")].map(
        (li) => li.textContent,
      ),
    ).toEqual(["Tue, Nov 3, 2026", "Thu, Nov 5, 2026", "Tue, Nov 17, 2026"]);
  });

  it("does not depend on the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2020, 0, 1));
    const before = renderSSR(RecurrencePicker, props).html;
    const none = renderSSR(RecurrencePicker, { id: "repeat" }).html;
    vi.setSystemTime(new Date(2031, 6, 15));

    expect(renderSSR(RecurrencePicker, props).html).toBe(before);
    expect(renderSSR(RecurrencePicker, { id: "repeat" }).html).toBe(none);
  });

  it.each([
    "",
    "FREQ=WEEKLY;BYDAY=TU",
    "FREQ=MONTHLY;BYDAY=1TU;COUNT=3",
    "FREQ=DAILY;UNTIL=20261231",
  ])("derives every id from `id` for %j", (value) => {
    const html = renderRaw(RecurrencePicker, { ...props, value });

    expect(html.match(RANDOM_ID)).toBeNull();
  });
});
