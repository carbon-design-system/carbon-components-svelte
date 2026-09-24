import { screen } from "@testing-library/svelte";

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
  const day = Array.from(
    calendar.querySelectorAll<HTMLElement>(
      ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)",
    ),
  ).find((node) => node.textContent === label);
  assert(day);
  return day;
}

/** Finds a flatpickr day cell (excluding adjacent months) by its day number. */
export function getDayByNumber(calendar: HTMLElement, day: number) {
  return Array.from(
    calendar.querySelectorAll<HTMLElement>(".flatpickr-day"),
  ).find(
    (el) =>
      el.textContent?.trim() === String(day) &&
      !el.classList.contains("prevMonthDay") &&
      !el.classList.contains("nextMonthDay"),
  );
}
