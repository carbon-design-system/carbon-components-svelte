import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import DatePickerHost from "./DatePickerHost.test.svelte";
import { clickNextMonth, openCalendar } from "./helpers";

describe("DatePicker inside Popover", () => {
  it("does not close the popover when a portaled calendar's month-nav arrow is clicked", async () => {
    const onClose = vi.fn();
    render(DatePickerHost, { props: { container: "popover", onClose } });

    const calendar = await openCalendar();
    const popover = document.querySelector(".bx--popover");
    expect(popover?.contains(calendar)).toBe(false);

    await clickNextMonth(calendar);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes the popover for a genuine outside click", async () => {
    const onClose = vi.fn();
    render(DatePickerHost, { props: { container: "popover", onClose } });

    await openCalendar();

    await user.click(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
