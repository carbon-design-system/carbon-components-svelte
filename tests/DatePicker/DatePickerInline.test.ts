import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DatePicker from "./DatePickerInline.test.svelte";
import { findDay } from "./helpers";

describe("DatePicker inline", () => {
  it("renders the calendar without opening it and marks the root", async () => {
    const { container } = render(DatePicker);

    const calendar = await screen.findByLabelText("calendar-container");
    expect(calendar).toHaveClass("inline", "bx--date-picker__calendar");
    expect(container.querySelector(".bx--date-picker")).toHaveClass(
      "bx--date-picker--inline",
    );
  });

  it("dispatches change but never open or close", async () => {
    const onevent = vi.fn();
    render(DatePicker, { onevent });
    const calendar = await screen.findByLabelText("calendar-container");

    await user.click(screen.getByLabelText("Date"));
    await user.click(findDay(calendar, "10"));
    await tick();
    await tick();

    expect(screen.getByTestId("value")).toHaveTextContent("03/10/2024");
    const events = onevent.mock.calls.map(([name]) => name);
    expect(events).toContain("change");
    expect(events).not.toContain("open");
    expect(events).not.toContain("close");
  });

  it("stays visible after an outside click and Escape", async () => {
    render(DatePicker);
    const calendar = await screen.findByLabelText("calendar-container");

    await user.click(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    await user.click(screen.getByLabelText("Date"));
    await user.keyboard("{Escape}");

    expect(calendar).toBeInTheDocument();
    expect(calendar).toHaveClass("inline");
  });

  it("ignores portalMenu", async () => {
    const { container } = render(DatePicker, { portalMenu: true });

    const calendar = await screen.findByLabelText("calendar-container");
    expect(container.querySelector(".bx--date-picker")).toContainElement(
      calendar,
    );
  });

  it("switches between inline and popup after mount, keeping the value", async () => {
    const { rerender } = render(DatePicker);
    const inlineCalendar = await screen.findByLabelText("calendar-container");

    await rerender({ inline: false });
    await vi.waitFor(() => {
      const calendar = screen.getByLabelText("calendar-container");
      expect(calendar).not.toBe(inlineCalendar);
      expect(calendar).not.toHaveClass("inline");
    });
    expect(screen.getByLabelText("Date")).toHaveValue("03/15/2024");

    await rerender({ inline: true });
    await vi.waitFor(() =>
      expect(screen.getByLabelText("calendar-container")).toHaveClass("inline"),
    );
    expect(screen.getByTestId("value")).toHaveTextContent("03/15/2024");
  });
});
