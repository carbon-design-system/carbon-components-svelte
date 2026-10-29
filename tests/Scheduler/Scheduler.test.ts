import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import Scheduler from "./Scheduler.test.svelte";
import { type Item, la } from "./scheduler-fixtures";

// Wednesday 2026-10-28 in Los Angeles. The week of Oct 25 ends the day
// before the clocks fall back.
const events: Item[] = [
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
  {
    id: "c",
    title: "Lunch",
    start: la(2026, 10, 28, 12),
    end: la(2026, 10, 28, 13),
  },
];

const lunch = () => screen.getByRole("button", { name: /^Lunch/ });
const iso = (value: unknown) => (value as Date).toISOString();
const cursorCell = () =>
  document.querySelector<HTMLElement>(
    '[data-cell][tabindex="0"]',
  ) as HTMLElement;

describe("Scheduler", () => {
  it("marks a read-only event with an icon and its name", async () => {
    const { rerender } = render(Scheduler, {
      props: {
        events: [{ ...events[2], readonly: true }],
      },
    });
    const event = screen.getByRole("button", {
      name: "Lunch, 12:00 PM to 1:00 PM, Wednesday, October 28, 2026, read-only",
    });
    const icon = event.querySelector(".bx--scheduler__event-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");

    // A read-only grid locks every event, so none needs the mark.
    await rerender({ readonly: true });
    expect(event.querySelector(".bx--scheduler__event-icon")).toBeNull();
  });

  it("shows the week, the events and their accessible names", () => {
    render(Scheduler, { props: { events } });

    expect(
      screen.getByRole("group", { name: "Oct 25 to Oct 31, 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Standup, 9:00 AM to 9:30 AM, Tuesday, October 27, 2026",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Offsite, all day, Wednesday, October 28, 2026 to Thursday, October 29, 2026",
      }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("group", { name: /^Tuesday, October 27, 2026/ }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
  });

  it("starts the week on the locale's day and follows its clock", () => {
    const { unmount } = render(Scheduler, {
      props: { events, locale: "de" },
    });
    const first = document.querySelector(".bx--scheduler__plane [data-day]");
    expect(first?.getAttribute("aria-label")).toMatch(/^Montag, 26\. Oktober/);
    expect(screen.getByText("13 Uhr")).toBeInTheDocument();
    unmount();

    render(Scheduler, {
      props: { events, weekStartsOn: 3, hourFormat: "24" },
    });
    const start = document.querySelector(".bx--scheduler__plane [data-day]");
    expect(start?.getAttribute("aria-label")).toMatch(/^Wednesday/);
    expect(
      document.querySelectorAll(".bx--scheduler__hour")[12],
    ).toHaveTextContent(/^13$/);
  });

  it("names the 25-hour day", () => {
    render(Scheduler, {
      props: { date: la(2026, 11, 1, 12), weekStartsOn: 0 },
    });
    expect(
      screen.getByRole("group", {
        name: "Sunday, November 1, 2026, 25 hour day",
      }),
    ).toBeInTheDocument();
  });

  it("marks today after it mounts and draws the time line", async () => {
    vi.useFakeTimers({ now: new Date("2026-10-27T18:35:00Z") });
    try {
      render(Scheduler, { props: { events } });
      await tick();
      expect(
        screen.getByRole("group", { name: "Tuesday, October 27, 2026, today" }),
      ).toBeInTheDocument();
      const line = document.querySelector<HTMLElement>(".bx--scheduler__now");
      expect(line?.style.top).toBe(`${((11 * 60 + 35) * 100) / 1440}%`);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lays out overlapping events as lanes", () => {
    const crowd: Item[] = [0, 1, 2].map((i) => ({
      id: `x${i}`,
      title: `Crowd ${i}`,
      start: la(2026, 10, 28, 10),
      end: la(2026, 10, 28, 11),
    }));
    render(Scheduler, { props: { events: crowd } });
    const lanes = crowd.map((_, i) => {
      const item = screen
        .getByRole("button", { name: new RegExp(`^Crowd ${i},`) })
        .closest("li") as HTMLElement;
      return [
        item.style.getPropertyValue("--ccs-scheduler-column"),
        item.style.getPropertyValue("--ccs-scheduler-columns"),
      ];
    });
    expect(lanes).toEqual([
      ["0", "3"],
      ["1", "3"],
      ["2", "3"],
    ]);
  });

  it("splits an overnight event across both days", () => {
    render(Scheduler, {
      props: {
        events: [
          {
            id: "n",
            title: "Release",
            start: la(2026, 10, 28, 22),
            end: la(2026, 10, 29, 2),
          },
        ],
      },
    });
    expect(screen.getAllByRole("button", { name: /^Release/ })).toHaveLength(2);
  });

  describe("keyboard", () => {
    it("moves and resizes the focused event by a snap step", async () => {
      const onChange = vi.fn();
      render(Scheduler, { props: { events, onChange } });
      lunch().focus();

      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      const move = onChange.mock.lastCall?.[0];
      expect(move.kind).toBe("move");
      expect(move.trigger).toBe("keyboard");
      expect(iso(move.start)).toBe("2026-10-28T19:15:00.000Z");
      expect(iso(move.end)).toBe("2026-10-28T20:15:00.000Z");
      expect(lunch()).toHaveAccessibleName(/12:15 PM to 1:15 PM/);

      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      const resize = onChange.mock.lastCall?.[0];
      expect(resize.kind).toBe("resize");
      expect(iso(resize.end)).toBe("2026-10-28T20:30:00.000Z");
    });

    it("leaves the events alone when change is canceled or the grid is read-only", async () => {
      const onChange = vi.fn();
      const { rerender } = render(Scheduler, {
        props: { events, onChange, cancelChange: true },
      });
      lunch().focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(lunch()).toHaveAccessibleName(/12:00 PM to 1:00 PM/);

      onChange.mockClear();
      await rerender({ cancelChange: false, readonly: true });
      lunch().focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("picks a slot, extends it and creates on Enter", async () => {
      const onCreate = vi.fn();
      render(Scheduler, { props: { events, onCreate } });
      expect(cursorCell()).toHaveAccessibleName(/^Wednesday, October 28/);
      cursorCell().focus();

      await user.keyboard("{ArrowDown}{Enter}");
      expect(onCreate).toHaveBeenLastCalledWith({
        start: new Date("2026-10-28T15:30:00.000Z"),
        end: new Date("2026-10-28T16:00:00.000Z"),
        allDay: false,
        trigger: "keyboard",
      });

      await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Enter}");
      const range = onCreate.mock.lastCall?.[0];
      expect(iso(range.start)).toBe("2026-10-28T15:30:00.000Z");
      expect(iso(range.end)).toBe("2026-10-28T17:00:00.000Z");

      await user.keyboard("{ArrowRight}");
      expect(cursorCell()).toHaveAccessibleName(/^Thursday, October 29/);
    });

    it("does not create in a read-only scheduler, and drops a canceled selection", async () => {
      const onCreate = vi.fn();
      const { rerender } = render(Scheduler, {
        props: { onCreate, readonly: true },
      });
      cursorCell().focus();
      await user.keyboard("{Enter}");
      expect(onCreate).not.toHaveBeenCalled();

      await rerender({ readonly: false, cancelCreate: true });
      cursorCell().focus();
      await user.keyboard("{Enter}");
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("selection")).toHaveTextContent("none");
    });

    it("walks between events with the arrows and opens one with Enter", async () => {
      const onClickEvent = vi.fn();
      render(Scheduler, { props: { events, onClickEvent } });
      screen.getByRole("button", { name: /^Standup/ }).focus();
      await user.keyboard("{ArrowRight}");
      expect(lunch()).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(onClickEvent).toHaveBeenCalledWith({
        event: events[2],
        trigger: "keyboard",
      });
    });

    it("swaps the inline arrows in RTL", async () => {
      document.documentElement.dir = "rtl";
      try {
        render(Scheduler, { props: { events } });
        cursorCell().focus();
        // Physical left is the next day under RTL.
        await user.keyboard("{ArrowLeft}");
        expect(cursorCell()).toHaveAccessibleName(/^Thursday/);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
  });

  describe("pointer", () => {
    // The plane is 1440px tall and 700px wide, so a y is a minute and an x
    // of 50 + 100 * n is the middle of day n.
    function setup(props: Record<string, unknown> = {}) {
      const onCreate = vi.fn();
      const onChange = vi.fn();
      const onClickEvent = vi.fn();
      render(Scheduler, {
        props: { events, onCreate, onChange, onClickEvent, ...props },
      });
      const plane = document.querySelector(
        ".bx--scheduler__plane",
      ) as HTMLElement;
      vi.spyOn(plane, "getBoundingClientRect").mockReturnValue(
        rect({ width: 700, height: 1440 }),
      );
      return { plane, onCreate, onChange, onClickEvent };
    }
    const press = (el: Element, x: number, y: number) =>
      fireEvent.pointerDown(el, {
        clientX: x,
        clientY: y,
        pointerId: 1,
        button: 0,
      });
    const move = (el: Element, x: number, y: number) =>
      fireEvent.pointerMove(el, { clientX: x, clientY: y, pointerId: 1 });
    const release = (el: Element) => fireEvent.pointerUp(el, { pointerId: 1 });

    it("creates a one-slot event from a click and a longer one from a drag", async () => {
      const { plane, onCreate } = setup();
      await press(plane, 350, 610);
      await release(plane);
      expect(onCreate).toHaveBeenLastCalledWith({
        start: new Date("2026-10-28T17:00:00.000Z"),
        end: new Date("2026-10-28T17:30:00.000Z"),
        allDay: false,
        trigger: "pointer",
      });
      expect(screen.getByTestId("selection")).toHaveTextContent("selected");

      await press(plane, 350, 600);
      await move(plane, 350, 680);
      await release(plane);
      const range = onCreate.mock.lastCall?.[0];
      expect(iso(range.start)).toBe("2026-10-28T17:00:00.000Z");
      expect(iso(range.end)).toBe("2026-10-28T18:30:00.000Z");
    });

    it("moves an event to the day and snapped time under the pointer", async () => {
      const { plane, onChange } = setup();
      await press(lunch(), 350, 735);
      await move(plane, 450, 855);
      await release(plane);
      const change = onChange.mock.lastCall?.[0];
      expect(change.kind).toBe("move");
      expect(iso(change.start)).toBe("2026-10-29T21:00:00.000Z");
      expect(iso(change.end)).toBe("2026-10-29T22:00:00.000Z");
    });

    it("resizes from the bottom edge and opens the event on a plain press", async () => {
      const { plane, onChange, onClickEvent } = setup();
      const grip = lunch().querySelector("[data-resize]") as HTMLElement;
      await press(grip, 350, 778);
      await move(plane, 350, 840);
      await release(plane);
      expect(onChange.mock.lastCall?.[0].kind).toBe("resize");
      expect(iso(onChange.mock.lastCall?.[0].end)).toBe(
        "2026-10-28T21:00:00.000Z",
      );

      await press(lunch(), 350, 735);
      await release(plane);
      expect(onClickEvent).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("leaves a read-only grid alone", async () => {
      const { plane, onChange, onCreate } = setup({ readonly: true });
      await press(lunch(), 350, 735);
      await move(plane, 450, 855);
      await release(plane);
      await press(plane, 350, 610);
      await release(plane);
      expect(onChange).not.toHaveBeenCalled();
      expect(onCreate).not.toHaveBeenCalled();
    });

    it("cancels a drag on Escape", async () => {
      const { plane, onChange } = setup();
      await press(lunch(), 350, 735);
      await move(plane, 450, 855);
      await fireEvent.keyDown(window, { key: "Escape" });
      await release(plane);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("toolbar and views", () => {
    it("moves by a period and switches view", async () => {
      render(Scheduler, { props: { events } });
      await user.click(screen.getByRole("button", { name: "Next" }));
      expect(screen.getByText("Nov 1 to Nov 7, 2026")).toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Month" }));
      expect(screen.getByTestId("view")).toHaveTextContent("month");
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("shows a month as a grid of days, and a limit with a more link", async () => {
      const crowd: Item[] = [0, 1, 2].map((i) => ({
        id: `m${i}`,
        title: `Task ${i}`,
        start: la(2026, 10, 28, 9 + i),
        end: la(2026, 10, 28, 10 + i),
      }));
      const onClickDay = vi.fn();
      render(Scheduler, {
        props: {
          events: crowd,
          view: "month",
          monthEventLimit: 2,
          onClickDay,
          cancelDay: true,
        },
      });
      expect(screen.getAllByRole("row")).toHaveLength(1 + 5);
      expect(screen.getAllByRole("gridcell")).toHaveLength(35);
      await user.click(
        screen.getByRole("button", {
          name: "+1 more event on Wednesday, October 28, 2026",
        }),
      );
      expect(onClickDay).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("view")).toHaveTextContent("month");
    });

    it("opens the day from a more link unless canceled", async () => {
      const crowd: Item[] = [0, 1].map((i) => ({
        id: `m${i}`,
        title: `Task ${i}`,
        start: la(2026, 10, 28, 9 + i),
        end: la(2026, 10, 28, 10 + i),
      }));
      render(Scheduler, {
        props: { events: crowd, view: "month", monthEventLimit: 1 },
      });
      await user.click(
        screen.getByRole("button", {
          name: "+1 more event on Wednesday, October 28, 2026",
        }),
      );
      expect(screen.getByTestId("view")).toHaveTextContent("day");
    });
  });
});
