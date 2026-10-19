import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import RadioButtonGroup from "./RadioButtonGroup.test.svelte";

describe("RadioButtonGroup allowDeselect", () => {
  it("keeps the selection on click when allowDeselect is not set", async () => {
    render(RadioButtonGroup, { props: { selected: "1" } });

    const radio1 = screen.getByRole("radio", { name: "Option 1" });
    await user.click(radio1);

    expect(radio1).toBeChecked();
  });

  it("clears the selection when clicking the already-selected radio", async () => {
    const { component } = render(RadioButtonGroup, {
      props: { selected: "1", allowDeselect: true },
    });

    const radio1 = screen.getByRole("radio", { name: "Option 1" });
    expect(radio1).toBeChecked();

    await user.click(radio1);

    expect(radio1).not.toBeChecked();
    expect(component.selected).toBeUndefined();
  });

  it("dispatches change with a null detail when the selection clears", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroup, {
      props: { selected: "1", allowDeselect: true, onChange },
    });

    await user.click(screen.getByRole("radio", { name: "Option 1" }));

    expect(onChange.mock.calls).toEqual([[null]]);
  });

  it("starts clearing the selection when allowDeselect is set after mount", async () => {
    const { component, rerender } = render(RadioButtonGroup, {
      props: { selected: "1" },
    });

    await rerender({ allowDeselect: true });
    await user.click(screen.getByRole("radio", { name: "Option 1" }));

    expect(component.selected).toBeUndefined();
  });

  it("still selects a different radio when allowDeselect is set", async () => {
    render(RadioButtonGroup, {
      props: { selected: "1", allowDeselect: true },
    });

    const radio2 = screen.getByRole("radio", { name: "Option 2" });
    await user.click(radio2);

    expect(radio2).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 1" })).not.toBeChecked();
  });
});
