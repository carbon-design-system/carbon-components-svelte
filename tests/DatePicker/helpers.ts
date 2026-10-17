import { screen } from "@testing-library/svelte";
import { user } from "../utils/user";

/**
 * Waits for the labeled "Date" input to become visible (`type="text"`, as
 * opposed to the hidden machine-format input) and returns it.
 */
export async function visibleInput() {
  await vi.waitFor(() =>
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "text"),
  );
  return screen.getByLabelText("Date");
}

/** Finds a flatpickr day cell (excluding adjacent months) by its exact label. */
export function findDay(calendar: HTMLElement, label: string) {
  const day = getDays(calendar).find((node) => node.textContent === label);
  assert(day);
  return day;
}

/** Finds a flatpickr day cell (excluding adjacent months) by its day number. */
export function getDayByNumber(calendar: HTMLElement, day: number) {
  return findDay(calendar, String(day));
}

/** Returns the calendar's current-month day cells, in document order. */
export function getDays(calendar: HTMLElement) {
  return Array.from(
    calendar.querySelectorAll<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
    ),
  );
}

/** Returns the first current-month day cell. */
export function firstDay(calendar: HTMLElement) {
  const [day] = getDays(calendar);
  assert(day, "expected a selectable day");
  return day;
}

/** Finds a current-month day cell by day of month through its `aria-label`. */
export function dayByLabel(calendar: HTMLElement, day: number) {
  const now = new Date();
  const label = new Date(
    now.getFullYear(),
    now.getMonth(),
    day,
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const cell = calendar.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  assert(cell, `expected day ${day}`);
  return cell;
}

/** Clicks the labeled input and returns the awaited `calendar-container`. */
export async function openCalendar(label = "Date") {
  await user.click(screen.getByLabelText(label));
  return screen.findByLabelText("calendar-container");
}

/** Whether the calendar header renders the year before the month. */
export function yearFirst(root: ParentNode) {
  const month = root.querySelector(".cur-month");
  const year = root.querySelector(".numInputWrapper");
  assert(month);
  assert(year);
  return (
    year.compareDocumentPosition(month) === Node.DOCUMENT_POSITION_FOLLOWING
  );
}

/** Clicks the calendar's next-month arrow. */
export async function clickNextMonth(calendar: HTMLElement) {
  const next = calendar.querySelector<HTMLElement>(".flatpickr-next-month");
  assert(next, "expected a next-month arrow");
  await user.click(next);
}
