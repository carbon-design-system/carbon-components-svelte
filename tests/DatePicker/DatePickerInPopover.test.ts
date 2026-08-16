import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DatePickerInPopover from "./DatePickerInPopover.test.svelte";

describe("DatePicker inside Popover", () => {
  it("does not close the popover when a portaled calendar's month-nav arrow is clicked", async () => {
    const onClose = vi.fn();
    render(DatePickerInPopover, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    await user.click(input);

    const calendar = await screen.findByLabelText("calendar-container");
    const popover = document.querySelector(".bx--popover");
    expect(popover?.contains(calendar)).toBe(false);

    const nextMonthArrow = calendar.querySelector<HTMLElement>(
      ".flatpickr-next-month",
    );
    if (!nextMonthArrow) throw new Error("expected a next-month arrow");

    await user.click(nextMonthArrow);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes the popover for a genuine outside click", async () => {
    const onClose = vi.fn();
    render(DatePickerInPopover, { props: { onClose } });

    const input = screen.getByLabelText("Date");
    await user.click(input);
    await screen.findByLabelText("calendar-container");

    await user.click(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
