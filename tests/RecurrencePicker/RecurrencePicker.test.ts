import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import RecurrencePicker from "./RecurrencePicker.test.svelte";

// The first hook waits for Vite to transform the picker's whole graph (the
// DatePicker, NumberInput and Select), which takes over 10 s on a cold
// Svelte 3 shard.
vi.setConfig({ hookTimeout: 60_000 });

const mount = (props: Record<string, unknown> = {}) =>
  render(RecurrencePicker, { props });
const bound = () => screen.getByTestId("bound").textContent;
const select = (name: string | RegExp) =>
  screen.getByRole<HTMLSelectElement>("combobox", { name });
const days = () =>
  screen
    .getAllByRole("button", { pressed: true })
    .map((button) => button.getAttribute("aria-label"));
const summary = () => document.querySelector(".bx--recurrence-picker__summary");

describe("RecurrencePicker", () => {
  it("is an event that does not repeat by default", () => {
    mount();

    expect(select("Repeat")).toHaveValue("");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(summary()).toBeNull();
    expect(bound()).toBe("");
  });

  it("writes a weekly rule on the start date's weekday", async () => {
    mount();

    await user.selectOptions(select("Repeat"), "WEEKLY");

    expect(bound()).toBe("FREQ=WEEKLY;BYDAY=TU");
    expect(days()).toEqual(["Tuesday"]);
    expect(summary()).toHaveTextContent("Every week on Tuesday");
  });

  it("adds weekdays and keeps one pressed", async () => {
    mount({ value: "FREQ=WEEKLY;BYDAY=TU" });

    await user.click(screen.getByRole("button", { name: "Thursday" }));
    expect(bound()).toBe("FREQ=WEEKLY;BYDAY=TU,TH");
    expect(summary()).toHaveTextContent("Every week on Tuesday and Thursday");

    await user.click(screen.getByRole("button", { name: "Tuesday" }));
    await user.click(screen.getByRole("button", { name: "Thursday" }));
    expect(bound()).toBe("FREQ=WEEKLY;BYDAY=TH");
  });

  it("writes the interval, and the week start when it changes the result", async () => {
    mount({ value: "FREQ=WEEKLY;BYDAY=TU,TH" });

    await user.clear(screen.getByRole("textbox", { name: "Repeat every" }));
    await user.type(screen.getByRole("textbox", { name: "Repeat every" }), "2");
    await user.tab();

    // en-US weeks start on Sunday, and Monday is the RFC default.
    expect(bound()).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;WKST=SU");
    expect(summary()).toHaveTextContent(
      "Every 2 weeks on Tuesday and Thursday",
    );
    expect(screen.getByText("weeks")).toBeInTheDocument();
  });

  // 0 is Sunday. The first day of the week comes from the locale's region.
  it.each([
    ["en-US", [0, 1, 2, 3, 4, 5, 6]],
    ["de", [1, 2, 3, 4, 5, 6, 0]],
    ["ar-EG", [6, 0, 1, 2, 3, 4, 5]],
  ])("starts the weekday buttons on the first day of %s", (locale, order) => {
    mount({ fieldProps: { locale }, value: "FREQ=WEEKLY;BYDAY=TU" });

    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    });
    const names = within(screen.getByRole("toolbar"))
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));
    // 2023-01-01 was a Sunday.
    expect(names).toEqual(
      order.map((day) => weekday.format(new Date(Date.UTC(2023, 0, 1 + day)))),
    );
  });

  it("offers the monthly patterns of the start date", async () => {
    mount();

    await user.selectOptions(select("Repeat"), "MONTHLY");

    const options = within(select("Monthly pattern"));
    expect(options.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "On day 3",
      "On the first Tuesday",
      "On the last day of the month",
    ]);
    expect(bound()).toBe("FREQ=MONTHLY;BYMONTHDAY=3");

    await user.selectOptions(select("Monthly pattern"), "nth");
    expect(bound()).toBe("FREQ=MONTHLY;BYDAY=1TU");
    expect(summary()).toHaveTextContent("Every month on the first Tuesday");

    await user.selectOptions(select("Monthly pattern"), "lastDay");
    expect(bound()).toBe("FREQ=MONTHLY;BYMONTHDAY=-1");
  });

  it("offers the last weekday when the start date is the last one", async () => {
    mount({ fieldProps: { startDate: new Date(2026, 10, 24) } });

    await user.selectOptions(select("Repeat"), "MONTHLY");

    expect(
      within(select("Monthly pattern"))
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual([
      "On day 24",
      "On the fourth Tuesday",
      "On the last Tuesday",
      "On the last day of the month",
    ]);
  });

  it("ends after a number of times", async () => {
    mount({ value: "FREQ=DAILY" });

    await user.selectOptions(select("Ends"), "count");
    expect(bound()).toBe("FREQ=DAILY;COUNT=10");
    await user.clear(screen.getByRole("textbox", { name: "Number of times" }));
    await user.type(
      screen.getByRole("textbox", { name: "Number of times" }),
      "4",
    );
    await user.tab();

    expect(bound()).toBe("FREQ=DAILY;COUNT=4");
    expect(summary()).toHaveTextContent("Every day, 4 times");
  });

  it("ends on a date a week after the start, and shows it in the summary", async () => {
    mount({ value: "FREQ=DAILY" });

    await user.selectOptions(select("Ends"), "until");

    expect(bound()).toBe("FREQ=DAILY;UNTIL=20261110");
    expect(summary()).toHaveTextContent("Every day, until Nov 10, 2026");
  });

  it("follows value from outside", async () => {
    const { rerender } = mount({ value: "FREQ=DAILY" });
    expect(select("Repeat")).toHaveValue("DAILY");

    await rerender({ value: "FREQ=YEARLY;COUNT=3" });
    expect(select("Repeat")).toHaveValue("YEARLY");
    expect(select("Ends")).toHaveValue("count");
    expect(summary()).toHaveTextContent("Every year on November 3, 3 times");

    await rerender({ value: "" });
    expect(select("Repeat")).toHaveValue("");
  });

  it("keeps a rule it cannot edit, and says so", async () => {
    mount({ value: "FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR" });

    expect(
      screen.getByText(/options the picker cannot edit/),
    ).toBeInTheDocument();
    expect(bound()).toBe("FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR");

    await user.selectOptions(select("Repeat"), "DAILY");
    expect(bound()).toBe("FREQ=DAILY");
    expect(screen.queryByText(/cannot edit/)).toBeNull();
  });

  it("keeps a monthly pattern the start date does not offer", () => {
    mount({ value: "FREQ=MONTHLY;BYMONTHDAY=15" });

    expect(select("Monthly pattern")).toHaveValue("other");
    expect(
      within(select("Monthly pattern"))
        .getAllByRole("option")
        .map((o) => o.textContent)[0],
    ).toBe("On day 15");
  });

  it("lists the next dates and names the weekday", () => {
    mount({
      value: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH",
      fieldProps: { previewCount: 3 },
    });

    expect(
      [...document.querySelectorAll(".bx--recurrence-picker__preview li")].map(
        (item) => item.textContent,
      ),
    ).toEqual(["Tue, Nov 3, 2026", "Thu, Nov 5, 2026", "Tue, Nov 17, 2026"]);
  });

  it("writes the summary in another language through summaryText and text", () => {
    mount({
      value: "FREQ=WEEKLY;BYDAY=TU",
      fieldProps: {
        locale: "de",
        text: { frequency: "Wiederholen", weekly: "Wöchentlich" },
        summaryText: (
          rule: { interval: number },
          { format }: { format: { weekday: (d: "TU") => string } },
        ) => `Alle ${rule.interval} Wochen am ${format.weekday("TU")}`,
      },
    });

    expect(select("Wiederholen")).toHaveValue("WEEKLY");
    expect(summary()).toHaveTextContent("Alle 1 Wochen am Dienstag");
  });

  it("reports a change once, with the rule", async () => {
    const onChange = vi.fn();
    mount({ onChange });

    await user.selectOptions(select("Repeat"), "DAILY");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual({
      value: "FREQ=DAILY",
      rule: { freq: "DAILY", interval: 1 },
    });
  });

  it("disables every control", () => {
    mount({ value: "FREQ=WEEKLY;BYDAY=TU", fieldProps: { disabled: true } });

    expect(select("Repeat")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tuesday" })).toBeDisabled();
  });
});
