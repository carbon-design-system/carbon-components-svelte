import { act, render, screen, waitFor, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import BookingSlots from "./BookingSlots.test.svelte";
import { morningOn, NOW, SLOTS, slow } from "./helpers";

const day = (name: string) => screen.getByRole("gridcell", { name });
const group = (name: string) => screen.getByRole("radiogroup", { name });
const NOV_11 = "Wednesday, November 11, 2026";

describe("BookingSlots", () => {
  it("enables only the days that have times", () => {
    render(BookingSlots, { slots: SLOTS, now: NOW });

    expect(day(NOV_11)).not.toHaveAttribute("aria-disabled");
    expect(day("Monday, November 9, 2026")).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(day("Tuesday, November 10, 2026")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(day("Friday, November 6, 2026")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows the times of a chosen day as a radio group in the zone", async () => {
    render(BookingSlots, { slots: SLOTS, now: NOW });
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(
      screen.getByText("Select a date to see available times"),
    ).toBeVisible();

    await user.click(day(NOV_11));

    const times = within(group("Available times on Wednesday, Nov 11"));
    expect(
      times.getAllByRole("radio").map((r) => r.textContent?.trim()),
    ).toEqual(["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM"]);
    expect(screen.getByText("Times shown in America/New_York")).toBeVisible();
    expect(screen.getByText("30 min")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "4 times available on Wednesday, Nov 11",
    );
  });

  it("chooses a time, binds the instant and dispatches change", async () => {
    render(BookingSlots, { slots: SLOTS, now: NOW, date: "2026-11-11" });

    await user.click(screen.getByRole("radio", { name: "9:30 AM" }));

    expect(screen.getByRole("radio", { name: "9:30 AM" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "9:00 AM" })).not.toBeChecked();
    expect(screen.getByTestId("value")).toHaveTextContent(
      "2026-11-11T14:30:00.000Z",
    );
    expect(JSON.parse(screen.getByTestId("changes").textContent ?? "")).toEqual(
      [
        {
          value: "2026-11-11T14:30:00.000Z",
          end: "2026-11-11T15:00:00.000Z",
          date: "2026-11-11",
          timeZone: "America/New_York",
        },
      ],
    );
  });

  it("keeps the chosen time while another day is browsed", async () => {
    render(BookingSlots, {
      slots: SLOTS,
      now: NOW,
      value: "2026-11-11T14:30:00.000Z",
    });
    expect(screen.getByTestId("date")).toHaveTextContent("2026-11-11");
    expect(screen.getByRole("radio", { name: "9:30 AM" })).toBeChecked();

    await user.click(day("Friday, November 13, 2026"));

    expect(screen.getByRole("radio", { name: "9:30 AM" })).not.toBeChecked();
    expect(screen.getByTestId("value")).toHaveTextContent(
      "2026-11-11T14:30:00.000Z",
    );
  });

  it("moves with the arrow keys and chooses where it lands", async () => {
    render(BookingSlots, { slots: SLOTS, now: NOW, date: "2026-11-11" });
    screen.getByRole("radio", { name: "9:00 AM" }).focus();

    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(screen.getByRole("radio", { name: "10:00 AM" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "10:00 AM" })).toBeChecked();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "9:00 AM" })).toBeChecked();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "10:30 AM" })).toBeChecked();
  });

  it("keeps one tab stop in the grid", () => {
    render(BookingSlots, {
      slots: SLOTS,
      now: NOW,
      value: "2026-11-11T15:00:00.000Z",
    });
    const stops = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("tabindex") === "0");

    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveTextContent("10:00 AM");
  });

  it("flips the arrows in a right-to-left page", async () => {
    document.documentElement.dir = "rtl";
    try {
      render(BookingSlots, { slots: SLOTS, now: NOW, date: "2026-11-11" });
      screen.getByRole("radio", { name: "9:30 AM" }).focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByRole("radio", { name: "10:00 AM" })).toHaveFocus();
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  describe("time zones", () => {
    it("shows the same slots in the zone of the viewer", () => {
      render(BookingSlots, {
        slots: SLOTS,
        now: NOW,
        date: "2026-11-11",
        timeZone: "Europe/Berlin",
      });

      expect(
        within(group("Available times on Wednesday, Nov 11"))
          .getAllByRole("radio")
          .map((radio) => radio.textContent?.trim()),
      ).toEqual(["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"]);
    });

    it("moves a late slot to the next day when the zone passes midnight", async () => {
      // 23:30 on Nov 11 in New York is 05:30 on Nov 12 in Berlin.
      const late = [
        { start: "2026-11-12T04:30:00Z" },
        ...morningOn("2026-11-13"),
      ];
      render(BookingSlots, {
        slots: late,
        now: NOW,
        value: "2026-11-12T04:30:00.000Z",
        timeZones: ["America/New_York", "Europe/Berlin"],
      });
      expect(screen.getByTestId("date")).toHaveTextContent("2026-11-11");
      expect(screen.getByRole("radio", { name: "11:30 PM" })).toBeChecked();

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Time zone" }),
        "Europe/Berlin",
      );

      expect(
        JSON.parse(screen.getByTestId("zone-changes").textContent ?? ""),
      ).toEqual([{ timeZone: "Europe/Berlin" }]);
      expect(screen.getByTestId("date")).toHaveTextContent("2026-11-12");
      expect(group("Available times on Thursday, Nov 12")).toBeVisible();
      expect(screen.getByRole("radio", { name: "5:30 AM" })).toBeChecked();
      expect(screen.getByText("Times shown in Europe/Berlin")).toBeVisible();
      expect(screen.getByTestId("value")).toHaveTextContent(
        "2026-11-12T04:30:00.000Z",
      );
    });

    it("adds the zone to the hour that happens twice", () => {
      const repeated = [
        { start: "2026-11-01T05:30:00Z" },
        { start: "2026-11-01T06:30:00Z" },
        { start: "2026-11-01T07:30:00Z" },
      ];
      render(BookingSlots, {
        slots: repeated,
        now: "2026-10-30T12:00:00Z",
        date: "2026-11-01",
      });

      const times = screen
        .getAllByRole("radio")
        .map((radio) => radio.textContent?.trim());
      expect(times[0]).toMatch(/^1:30 AM E[DS]T$/);
      expect(times[1]).toMatch(/^1:30 AM E[DS]T$/);
      expect(times[0]).not.toBe(times[1]);
      expect(times[2]).toBe("2:30 AM");
    });

    it("offers the current zone in the selector", () => {
      render(BookingSlots, {
        slots: SLOTS,
        now: NOW,
        timeZone: "Asia/Tokyo",
        timeZones: ["America/New_York", "Europe/Berlin"],
      });

      const options = within(
        screen.getByRole("combobox", { name: "Time zone" }),
      )
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(options).toEqual([
        "Asia/Tokyo",
        "America/New_York",
        "Europe/Berlin",
      ]);
    });
  });

  describe("next available", () => {
    it("jumps from a day with no times to the next day that has some", async () => {
      render(BookingSlots, { slots: SLOTS, now: NOW, date: "2026-11-12" });
      expect(
        screen.getByText("No times available", { ignore: "[role=status]" }),
      ).toBeVisible();

      await user.click(
        screen.getByRole("button", { name: "Next available: Fri, Nov 13" }),
      );

      expect(screen.getByTestId("date")).toHaveTextContent("2026-11-13");
      expect(group("Available times on Friday, Nov 13")).toBeVisible();
      expect(screen.getByRole("radio", { name: "9:00 AM" })).toHaveFocus();
    });

    it("jumps before a day is chosen, even into the next month", async () => {
      render(BookingSlots, {
        slots: morningOn("2026-12-02"),
        now: NOW,
      });

      await user.click(
        screen.getByRole("button", { name: "Next available: Wed, Dec 2" }),
      );

      expect(screen.getByRole("grid", { name: "December 2026" })).toBeVisible();
      expect(group("Available times on Wednesday, Dec 2")).toBeVisible();
    });

    it("offers no jump when nothing is left", () => {
      render(BookingSlots, {
        slots: morningOn("2026-11-09"),
        now: NOW,
        date: "2026-11-12",
      });

      expect(
        screen.getByText("No times available", { ignore: "[role=status]" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: /Next available/ }),
      ).toBeNull();
    });
  });

  describe("notice and the clock", () => {
    it("does not offer a time that has passed", () => {
      render(BookingSlots, {
        slots: SLOTS,
        now: "2026-11-11T15:00:00Z",
        date: "2026-11-11",
      });

      expect(
        screen.getAllByRole("radio").map((radio) => radio.textContent?.trim()),
      ).toEqual(["10:00 AM", "10:30 AM"]);
    });

    it("hides times that are inside the minimum notice", () => {
      render(BookingSlots, {
        slots: SLOTS,
        now: "2026-11-11T14:00:00Z",
        minNotice: 60,
        date: "2026-11-11",
      });

      expect(
        screen.getAllByRole("radio").map((radio) => radio.textContent?.trim()),
      ).toEqual(["10:00 AM", "10:30 AM"]);
    });
  });

  describe("loading by month", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("asks for the month in the zone, then the next one ahead", async () => {
      const loadSlots = vi.fn(({ month }: { month: string }) =>
        Promise.resolve(month === "2026-11" ? SLOTS : morningOn("2026-12-02")),
      );
      render(BookingSlots, { loadSlots, now: NOW });

      await waitFor(() => expect(loadSlots).toHaveBeenCalledTimes(2));
      const [first, second] = loadSlots.mock.calls.map(
        ([request]) => request as unknown as Record<string, unknown>,
      );
      expect(first).toMatchObject({
        month: "2026-11",
        timeZone: "America/New_York",
        from: new Date("2026-11-01T04:00:00Z"),
        to: new Date("2026-12-01T05:00:00Z"),
      });
      expect(first.signal).toBeInstanceOf(AbortSignal);
      expect(second).toMatchObject({ month: "2026-12" });
    });

    it("does not fetch the next month when prefetch is off", async () => {
      const loadSlots = vi.fn(() => Promise.resolve(SLOTS));
      render(BookingSlots, { loadSlots, now: NOW, prefetch: false });

      await waitFor(() => expect(loadSlots).toHaveBeenCalledTimes(1));
      await act();
      expect(loadSlots).toHaveBeenCalledTimes(1);
    });

    it("shows the next month at once when it was fetched ahead", async () => {
      const loadSlots = vi.fn(({ month }: { month: string }) =>
        Promise.resolve(month === "2026-11" ? SLOTS : morningOn("2026-12-02")),
      );
      render(BookingSlots, { loadSlots, now: NOW });
      await waitFor(() => expect(loadSlots).toHaveBeenCalledTimes(2));
      await act();

      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(day("Wednesday, December 2, 2026")).not.toHaveAttribute(
        "aria-disabled",
      );
      expect(
        loadSlots.mock.calls.filter(([r]) => r.month === "2026-12"),
      ).toHaveLength(1);
    });

    it("shows a loading state until the month arrives", async () => {
      vi.useFakeTimers();
      const loadSlots = vi.fn(() => slow(SLOTS, 1000));
      render(BookingSlots, { loadSlots, now: NOW, date: "2026-11-11" });
      await act(() => vi.advanceTimersByTime(0));

      expect(
        screen.getByText("Loading availability", { ignore: "[role=status]" }),
      ).toBeVisible();
      expect(screen.queryByRole("radiogroup")).toBeNull();
      expect(day(NOV_11)).toHaveAttribute("aria-disabled", "true");

      await act(() => vi.advanceTimersByTime(1000));

      expect(screen.queryByText("Loading availability")).toBeNull();
      expect(group("Available times on Wednesday, Nov 11")).toBeVisible();
    });

    it("keeps an earlier answer when the viewer changes the zone", async () => {
      const loadSlots = vi.fn((_request: object) => Promise.resolve(SLOTS));
      render(BookingSlots, {
        loadSlots,
        now: NOW,
        date: "2026-11-11",
        timeZones: ["America/New_York", "Europe/Berlin"],
        prefetch: false,
      });
      await waitFor(() => expect(loadSlots).toHaveBeenCalledTimes(1));
      await screen.findByRole("radiogroup");

      await user.selectOptions(
        screen.getByRole("combobox", { name: "Time zone" }),
        "Europe/Berlin",
      );

      await waitFor(() => expect(loadSlots).toHaveBeenCalledTimes(2));
      expect(loadSlots.mock.calls[1][0]).toMatchObject({
        timeZone: "Europe/Berlin",
        from: new Date("2026-10-31T23:00:00Z"),
      });
      expect(group("Available times on Wednesday, Nov 11")).toBeVisible();
    });

    it("reports a failure and loads again on request", async () => {
      let calls = 0;
      const loadSlots = vi.fn(() => {
        calls += 1;
        return calls === 1
          ? Promise.reject(new Error("offline"))
          : Promise.resolve(SLOTS);
      });
      render(BookingSlots, {
        loadSlots,
        now: NOW,
        date: "2026-11-11",
        prefetch: false,
      });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Availability could not be loaded",
      );
      expect(screen.getByTestId("errors")).toHaveTextContent("1");

      await user.click(screen.getByRole("button", { name: "Try again" }));

      expect(
        await screen.findByRole("radiogroup", {
          name: "Available times on Wednesday, Nov 11",
        }),
      ).toBeVisible();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("searches the following months for the next available day", async () => {
      const loadSlots = vi.fn(({ month }: { month: string }) =>
        Promise.resolve(month === "2027-01" ? morningOn("2027-01-12") : []),
      );
      render(BookingSlots, { loadSlots, now: NOW });

      expect(
        await screen.findByRole("button", {
          name: "Next available: Tue, Jan 12",
        }),
      ).toBeVisible();
      expect(loadSlots.mock.calls.map(([request]) => request.month)).toEqual([
        "2026-11",
        "2026-12",
        "2027-01",
      ]);
    });

    it("loads again when the source changes", async () => {
      const first = vi.fn(() => Promise.resolve(SLOTS));
      const second = vi.fn(() => Promise.resolve(morningOn("2026-11-16")));
      const { rerender } = render(BookingSlots, {
        loadSlots: first,
        now: NOW,
        prefetch: false,
      });
      await waitFor(() =>
        expect(day(NOV_11)).not.toHaveAttribute("aria-disabled"),
      );

      await rerender({ loadSlots: second });
      await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
      await act();

      expect(day(NOV_11)).toHaveAttribute("aria-disabled", "true");
      expect(day("Monday, November 16, 2026")).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });

  it("disables the calendar and the times", () => {
    render(BookingSlots, {
      slots: SLOTS,
      now: NOW,
      date: "2026-11-11",
      disabled: true,
    });

    expect(day(NOV_11)).toHaveAttribute("aria-disabled", "true");
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});

describe("BookingSlots week view", () => {
  it("renders a group of times for each day of the week", () => {
    render(BookingSlots, {
      slots: SLOTS,
      now: NOW,
      date: "2026-11-11",
      view: "week",
    });

    expect(group("Available times on Monday, Nov 9")).toBeInTheDocument();
    expect(group("Available times on Wednesday, Nov 11")).toBeInTheDocument();
    expect(group("Available times on Friday, Nov 13")).toBeInTheDocument();
    expect(screen.getAllByRole("radiogroup")).toHaveLength(3);
  });
});
