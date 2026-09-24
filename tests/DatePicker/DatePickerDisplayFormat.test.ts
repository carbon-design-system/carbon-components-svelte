import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import DatePicker from "./DatePickerDisplayFormat.test.svelte";
import { visibleInput } from "./helpers";

describe("DatePicker displayFormat", () => {
  it("shows the display format while value keeps dateFormat", async () => {
    render(DatePicker);

    const input = await visibleInput();
    await vi.waitFor(() => expect(input).toHaveValue("March 15, 2024"));
    expect(screen.getByTestId("value")).toHaveTextContent("2024-03-15");
  });

  it("submits a single machine-format field", async () => {
    render(DatePicker);
    await visibleInput();

    const form = getForm();
    expect(form.querySelectorAll("[name]")).toHaveLength(1);
    expect(new FormData(form).get("meeting")).toBe("2024-03-15");
  });

  it("repaints when displayFormat changes and keeps the value", async () => {
    const { rerender } = render(DatePicker);
    const input = await visibleInput();
    await vi.waitFor(() => expect(input).toHaveValue("March 15, 2024"));

    await rerender({ displayFormat: "M j, Y" });
    await vi.waitFor(() => expect(input).toHaveValue("Mar 15, 2024"));
    expect(screen.getByTestId("value")).toHaveTextContent("2024-03-15");
  });

  it("can be turned off and on again without losing the label or value", async () => {
    const { rerender } = render(DatePicker);
    await visibleInput();

    await rerender({ enabled: false });
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Date")).toHaveValue("2024-03-15"),
    );
    expect(document.querySelectorAll("input[type='hidden']")).toHaveLength(0);

    await rerender({ enabled: true });
    const input = await visibleInput();
    await vi.waitFor(() => expect(input).toHaveValue("March 15, 2024"));
    expect(screen.getByTestId("value")).toHaveTextContent("2024-03-15");
    const ids = Array.from(document.querySelectorAll("[id]"), (n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("forwards DOM events from the visible input", async () => {
    const onfocus = vi.fn();
    const onkeydown = vi.fn();
    render(DatePicker, { onfocus, onkeydown });
    const input = await visibleInput();

    await user.click(input);
    await user.keyboard("a");
    expect(onfocus).toHaveBeenCalled();
    expect(onkeydown).toHaveBeenCalled();
    expect(onkeydown.mock.calls[0][0].key).toBe("a");
  });

  it("mirrors disabled onto the visible input", async () => {
    const { rerender } = render(DatePicker);
    const input = await visibleInput();

    await rerender({ disabled: true });
    await vi.waitFor(() => expect(input).toBeDisabled());
  });

  it("is ignored for range pickers", async () => {
    render(DatePicker, { datePickerType: "range" });

    const input = screen.getByLabelText("Date");
    await screen.findByLabelText("calendar-container");
    expect(input).toHaveAttribute("type", "text");
    expect(document.querySelectorAll("input[type='hidden']")).toHaveLength(0);
  });
});
