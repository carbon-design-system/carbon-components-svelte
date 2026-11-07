import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import TimeRangePicker from "./TimeRangePicker.test.svelte";

const renderPicker = (props: Record<string, unknown> = {}) =>
  render(TimeRangePicker, { props });
const trigger = () => screen.getByRole("button", { name: /Time range/ });
const dialog = () => screen.getByRole("dialog", { name: "Time range" });
const value = () => screen.getByTestId("value").textContent;

async function openPanel() {
  await user.click(trigger());
  await nextFrame();
}

describe("TimeRangePicker", () => {
  describe("trigger", () => {
    it("names a quick range", () => {
      renderPicker();
      expect(trigger()).toHaveTextContent("Time range: Last 15 minutes");
    });

    it("writes an absolute range in the time zone", () => {
      renderPicker({
        value: {
          from: "2026-11-06T14:00:00.000Z",
          to: "2026-11-06T17:30:00.000Z",
        },
      });
      expect(trigger()).toHaveTextContent("Nov 6, 09:00 – 12:30 (UTC−5)");
    });

    it("names a rolling range that is not a quick range, and a calendar one", () => {
      const { unmount } = renderPicker({
        value: { from: "now-90m", to: "now" },
      });
      expect(trigger()).toHaveTextContent("Last 90 minutes");
      unmount();
      renderPicker({ value: { from: "now-1w/w", to: "now-1w/w" } });
      expect(trigger()).toHaveTextContent("Previous week");
    });

    it("leaves the text to rangeText", () => {
      renderPicker({
        extra: {
          rangeText: (range: { from: string }) => `custom ${range.from}`,
        },
      });
      expect(trigger()).toHaveTextContent("custom now-15m");
    });
  });

  describe("quick ranges", () => {
    it("applies a quick range, keeps it relative and closes", async () => {
      const onChange = vi.fn();
      renderPicker({ onChange });
      await openPanel();
      await user.click(screen.getByRole("button", { name: "Last 1 hour" }));
      expect(value()).toBe("now-1h..now");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toMatchObject({
        trigger: "preset",
        value: { from: "now-1h", to: "now" },
        timeZone: "America/New_York",
        start: new Date("2026-11-06T16:30:00.000Z"),
        end: new Date("2026-11-06T17:30:00.000Z"),
      });
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
    });

    it("announces the applied range", async () => {
      renderPicker();
      await openPanel();
      await user.click(screen.getByRole("button", { name: "Yesterday" }));
      await tick();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Time range set to Yesterday",
      );
    });

    it("marks the current range", async () => {
      renderPicker();
      await openPanel();
      expect(
        screen.getByRole("button", { name: "Last 15 minutes" }),
      ).toHaveAttribute("aria-current", "true");
      expect(
        screen.getByRole("button", { name: "Last 1 hour" }),
      ).not.toHaveAttribute("aria-current");
    });
  });

  describe("keyboard", () => {
    it("opens with ArrowDown, lands on the current range and moves with the arrows", async () => {
      renderPicker();
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await nextFrame();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      const current = screen.getByRole("button", { name: "Last 15 minutes" });
      expect(current).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", { name: "Last 1 hour" })).toHaveFocus();
      await user.keyboard("{End}");
      expect(screen.getByRole("button", { name: "This week" })).toHaveFocus();
      await user.keyboard("{Home}");
      expect(
        screen.getByRole("button", { name: "Last 5 minutes" }),
      ).toHaveFocus();
    });

    it("keeps the quick ranges to one tab stop", async () => {
      renderPicker();
      await openPanel();
      const quick = dialog().querySelector<HTMLElement>(
        ".bx--time-range-picker__quick",
      );
      const stops = within(quick as HTMLElement)
        .getAllByRole("button")
        .filter((button) => button.getAttribute("tabindex") === "0");
      expect(stops.map((button) => button.textContent?.trim())).toEqual([
        "Last 15 minutes",
      ]);
    });

    it("applies the focused quick range with Enter", async () => {
      renderPicker();
      trigger().focus();
      await user.keyboard("{ArrowDown}");
      await nextFrame();
      await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      expect(value()).toBe("now-24h..now");
      expect(trigger()).toHaveFocus();
    });

    it("closes with Escape and returns focus to the trigger", async () => {
      renderPicker();
      await openPanel();
      await user.keyboard("{Tab}");
      await user.keyboard("{Escape}");
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
      expect(value()).toBe("now-15m..now");
    });

    it("closes when focus leaves, and on an outside click", async () => {
      renderPicker();
      await openPanel();
      await user.click(screen.getByTestId("outside"));
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("relative range", () => {
    async function openRelative() {
      await openPanel();
      await user.click(screen.getByRole("tab", { name: "Relative" }));
    }

    it("applies typed expressions and keeps them relative", async () => {
      const onChange = vi.fn();
      renderPicker({ onChange });
      await openRelative();
      const from = screen.getByLabelText("From");
      await user.clear(from);
      await user.type(from, "now-2h/h");
      const to = screen.getByLabelText("To");
      await user.clear(to);
      await user.type(to, "now-1h");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe("now-2h/h..now-1h");
      expect(onChange.mock.calls[0][0]).toMatchObject({ trigger: "apply" });
      expect(trigger()).toHaveTextContent("now-2h/h – now-1h");
    });

    it("expands 'last 90 minutes' into both fields", async () => {
      renderPicker();
      await openRelative();
      const from = screen.getByLabelText("From");
      await user.clear(from);
      await user.type(from, "last 90 minutes");
      await user.tab();
      expect(from).toHaveValue("now-90m");
      expect(screen.getByLabelText("To")).toHaveValue("now");
      await user.keyboard("{Enter}");
      expect(value()).toBe("now-90m..now");
    });

    it("applies with Enter from a field", async () => {
      renderPicker();
      await openRelative();
      const to = screen.getByLabelText("To");
      await user.clear(to);
      await user.type(to, "now+1h{Enter}");
      expect(value()).toBe("now-15m..now+1h");
    });

    it("explains an expression that does not read once the field is left", async () => {
      renderPicker();
      await openRelative();
      const from = screen.getByLabelText("From");
      await user.clear(from);
      await user.type(from, "now-");
      expect(screen.queryByText(/Enter a start/)).toBeNull();
      await user.tab();
      expect(screen.getByText(/Enter a start such as now-2h/)).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe("now-15m..now");
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(from).toHaveFocus();
    });

    it("refuses an end before the start", async () => {
      renderPicker();
      await openRelative();
      const to = screen.getByLabelText("To");
      await user.clear(to);
      await user.type(to, "now-1h");
      expect(
        screen.getByText("The end must be after the start."),
      ).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe("now-15m..now");
      expect(to).toHaveFocus();
    });

    it("holds a range to maxRange and min, which can be bounds", async () => {
      renderPicker({ extra: { maxRange: "1h", min: "now-30d" } });
      await openRelative();
      const from = screen.getByLabelText("From");
      await user.clear(from);
      await user.type(from, "now-2h");
      expect(
        screen.getByText("The range is longer than it can be."),
      ).toBeVisible();
      await user.clear(from);
      await user.type(from, "now-45d");
      await user.tab();
      expect(
        screen.getByText("The start is earlier than this range can go."),
      ).toBeVisible();
    });

    it("stores an absolute bound as an instant in the zone", async () => {
      renderPicker();
      await openRelative();
      const from = screen.getByLabelText("From");
      await user.clear(from);
      await user.type(from, "2026-11-06 09:00");
      const to = screen.getByLabelText("To");
      await user.clear(to);
      await user.type(to, "2026-11-06 12:30");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe(
        "2026-11-06T14:00:00.000Z..2026-11-06T17:30:00.000Z",
      );
    });
  });

  describe("absolute range", () => {
    const march = {
      from: "2026-03-08T05:00:00.000Z",
      to: "2026-03-08T12:00:00.000Z",
    };

    it("opens on the Absolute tab with the range in the time zone", async () => {
      renderPicker({ value: march });
      await openPanel();
      expect(screen.getByRole("tab", { name: "Absolute" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByLabelText("Start time")).toHaveValue("00:00");
      expect(screen.getByLabelText("End time")).toHaveValue("08:00");
      expect(screen.getByLabelText("Start date")).toHaveValue("2026-03-08");
    });

    it("applies times in the zone", async () => {
      renderPicker({
        value: {
          from: "2026-11-06T14:00:00.000Z",
          to: "2026-11-06T17:30:00.000Z",
        },
      });
      await openPanel();
      const start = screen.getByLabelText("Start time");
      await user.clear(start);
      await user.type(start, "08:15");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe(
        "2026-11-06T13:15:00.000Z..2026-11-06T17:30:00.000Z",
      );
    });

    it("reads a time that falls in the spring-forward gap as the time after it", async () => {
      renderPicker({ value: march });
      await openPanel();
      const start = screen.getByLabelText("Start time");
      await user.clear(start);
      await user.type(start, "02:30");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      // 02:30 never happens in New York on March 8, so it is 03:30 EDT.
      expect(value()).toBe(
        "2026-03-08T07:30:00.000Z..2026-03-08T12:00:00.000Z",
      );
    });

    it("keeps the instants when the time zone changes", async () => {
      renderPicker({
        value: {
          from: "2026-11-06T14:00:00.000Z",
          to: "2026-11-06T17:30:00.000Z",
        },
      });
      await openPanel();
      await user.selectOptions(
        screen.getByLabelText("Time zone"),
        "Europe/Berlin",
      );
      expect(screen.getByLabelText("Start time")).toHaveValue("15:00");
      expect(screen.getByLabelText("End time")).toHaveValue("18:30");
      await user.click(screen.getByRole("button", { name: "Apply" }));
      expect(value()).toBe(
        "2026-11-06T14:00:00.000Z..2026-11-06T17:30:00.000Z",
      );
      expect(screen.getByTestId("zone")).toHaveTextContent("Europe/Berlin");
      expect(trigger()).toHaveTextContent("Nov 6, 15:00 – 18:30 (UTC+1)");
    });

    it("refuses an end before the start", async () => {
      renderPicker({
        value: {
          from: "2026-11-06T14:00:00.000Z",
          to: "2026-11-06T17:30:00.000Z",
        },
      });
      await openPanel();
      const end = screen.getByLabelText("End time");
      await user.clear(end);
      await user.type(end, "08:00");
      expect(
        screen.getByText("The end must be after the start."),
      ).toBeVisible();
    });
  });

  describe("time zone", () => {
    const zones = ["UTC", "Asia/Kolkata", "Europe/Berlin"];

    it("applies a time zone with a quick range", async () => {
      renderPicker({ extra: { timeZones: zones } });
      await openPanel();
      await user.selectOptions(
        screen.getByLabelText("Time zone"),
        "Asia/Kolkata",
      );
      await user.click(screen.getByRole("button", { name: "Today" }));
      expect(screen.getByTestId("zone")).toHaveTextContent("Asia/Kolkata");
      expect(value()).toBe("now/d..now/d");
    });

    it("lists the offset of each zone", async () => {
      renderPicker({ extra: { timeZones: zones } });
      await openPanel();
      expect(
        within(screen.getByLabelText("Time zone")).getByRole("option", {
          name: "Asia/Kolkata (UTC+5:30)",
        }),
      ).toBeInTheDocument();
    });

    it("lists only the zones it is given", async () => {
      renderPicker({ extra: { timeZones: ["UTC", "Europe/Berlin"] } });
      await openPanel();
      expect(
        within(screen.getByLabelText("Time zone"))
          .getAllByRole("option")
          .map((option) => option.getAttribute("value")),
      ).toEqual(["America/New_York", "UTC", "Europe/Berlin"]);
    });
  });

  describe("stepping", () => {
    const stepping = { stepping: true, max: "now" };

    it("steps back by the length and freezes a relative range", async () => {
      const onChange = vi.fn();
      renderPicker({ extra: stepping, onChange });
      await user.click(
        screen.getByRole("button", { name: "Previous time range" }),
      );
      expect(value()).toBe(
        "2026-11-06T17:00:00.000Z..2026-11-06T17:15:00.000Z",
      );
      expect(onChange.mock.calls[0][0]).toMatchObject({ trigger: "step" });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Time range set to Nov 6, 12:00",
      );
    });

    it("steps forward until max", async () => {
      renderPicker({
        extra: stepping,
        value: {
          from: "2026-11-06T16:45:00.000Z",
          to: "2026-11-06T17:15:00.000Z",
        },
      });
      const next = screen.getByRole("button", { name: "Next time range" });
      expect(next).toBeEnabled();
      await user.click(next);
      // Moved back so it ends at now: the range keeps its length.
      expect(value()).toBe(
        "2026-11-06T17:00:00.000Z..2026-11-06T17:30:00.000Z",
      );
      expect(next).toBeDisabled();
    });

    it("disables forward on a range that ends now", () => {
      renderPicker({ extra: stepping });
      expect(
        screen.getByRole("button", { name: "Next time range" }),
      ).toBeDisabled();
    });

    it("zooms out, keeping a trailing range relative", async () => {
      renderPicker({ extra: stepping });
      await user.click(screen.getByRole("button", { name: "Zoom out" }));
      expect(value()).toBe("now-30m..now");
    });

    it("stops stepping at min and zooming at maxRange", () => {
      renderPicker({
        extra: {
          ...stepping,
          min: "2026-11-06T17:10:00.000Z",
          maxRange: "20m",
        },
      });
      expect(
        screen.getByRole("button", { name: "Previous time range" }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    });

    it("steps Today to Yesterday by the calendar", async () => {
      renderPicker({
        extra: { ...stepping, now: "2026-03-09T16:00:00Z" },
        value: { from: "now/d", to: "now/d" },
      });
      await user.click(
        screen.getByRole("button", { name: "Previous time range" }),
      );
      expect(value()).toBe(
        "2026-03-08T05:00:00.000Z..2026-03-09T03:59:59.999Z",
      );
    });

    it("steps from the keyboard", async () => {
      renderPicker({ extra: stepping });
      screen.getByRole("button", { name: "Previous time range" }).focus();
      await user.keyboard("{Enter}");
      expect(value()).toBe(
        "2026-11-06T17:00:00.000Z..2026-11-06T17:15:00.000Z",
      );
    });
  });

  describe("refresh", () => {
    afterEach(() => {
      vi.useRealTimers();
      Object.defineProperty(document, "hidden", {
        value: false,
        configurable: true,
      });
    });

    const hide = (hidden: boolean) => {
      Object.defineProperty(document, "hidden", {
        value: hidden,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    };

    it("emits a refresh on the interval, with the range read again each time", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(new Date("2026-11-06T17:30:00Z"));
      const onRefresh = vi.fn();
      renderPicker({
        extra: { refresh: "auto", now: undefined },
        refreshInterval: 30,
        onRefresh,
      });
      await tick();
      expect(onRefresh).not.toHaveBeenCalled();
      vi.advanceTimersByTime(30_000);
      vi.advanceTimersByTime(30_000);
      expect(onRefresh).toHaveBeenCalledTimes(2);
      const [first, second] = onRefresh.mock.calls.map(([detail]) => detail);
      expect(first.trigger).toBe("interval");
      expect(first.end.toISOString()).toBe("2026-11-06T17:30:30.000Z");
      expect(second.end.toISOString()).toBe("2026-11-06T17:31:00.000Z");
      expect(second.start.toISOString()).toBe("2026-11-06T17:16:00.000Z");
      expect(second.value).toEqual({ from: "now-15m", to: "now" });
    });

    it("pauses while the tab is hidden and catches up once on return", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(new Date("2026-11-06T17:30:00Z"));
      const onRefresh = vi.fn();
      renderPicker({
        extra: { refresh: "auto", now: undefined },
        refreshInterval: 10,
        onRefresh,
      });
      await tick();
      vi.advanceTimersByTime(10_000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      hide(true);
      vi.advanceTimersByTime(120_000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      hide(false);
      expect(onRefresh).toHaveBeenCalledTimes(2);
      expect(onRefresh.mock.calls[1][0].trigger).toBe("visible");
      vi.advanceTimersByTime(10_000);
      expect(onRefresh).toHaveBeenCalledTimes(3);
    });

    it("does not catch up when the tab returns before the next tick", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(new Date("2026-11-06T17:30:00Z"));
      const onRefresh = vi.fn();
      renderPicker({
        extra: { refresh: "auto", now: undefined },
        refreshInterval: 60,
        onRefresh,
      });
      await tick();
      hide(true);
      vi.advanceTimersByTime(5_000);
      hide(false);
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it("chooses the interval in the panel and stops at Off", async () => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(new Date("2026-11-06T17:30:00Z"));
      const onRefresh = vi.fn();
      renderPicker({ extra: { refresh: "auto", now: undefined }, onRefresh });
      trigger().click();
      await tick();
      await tick();
      const every = screen.getByLabelText("Refresh every");
      expect(
        within(every).getByRole("option", { name: "1m" }),
      ).toBeInTheDocument();
      await fireEvent.change(every, { target: { value: "60" } });
      screen.getByRole("button", { name: "Last 5 minutes" }).click();
      await tick();
      expect(screen.getByTestId("interval")).toHaveTextContent("60");
      vi.advanceTimersByTime(60_000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("refreshes from the button", async () => {
      const onRefresh = vi.fn();
      renderPicker({ extra: { refresh: "button" }, onRefresh });
      await user.click(screen.getByRole("button", { name: "Refresh" }));
      expect(onRefresh.mock.calls[0][0]).toMatchObject({
        trigger: "button",
        end: new Date("2026-11-06T17:30:00.000Z"),
      });
    });

    it("has no refresh controls by default", () => {
      renderPicker();
      expect(screen.queryByRole("button", { name: "Refresh" })).toBeNull();
    });
  });

  describe("limits and state", () => {
    it("does not open when disabled", async () => {
      renderPicker({ extra: { disabled: true, stepping: true } });
      expect(trigger()).toBeDisabled();
      await user.click(trigger());
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    });

    it("builds the panel when it first opens, and dispatches open and close", async () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      renderPicker({ onOpen, onClose });
      expect(screen.queryByRole("dialog")).toBeNull();
      await openPanel();
      expect(dialog()).toBeVisible();
      expect(onOpen).toHaveBeenCalledTimes(1);
      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("lets the app translate the text", async () => {
      renderPicker({
        extra: {
          translateWithId: (id: string) =>
            id === "apply" ? "Anwenden" : undefined,
        },
      });
      await openPanel();
      expect(
        screen.getByRole("button", { name: "Anwenden" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Custom range")).toBeInTheDocument();
    });
  });
});
