import { render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import RadioButtonStandalone from "./RadioButtonStandalone.test.svelte";

describe("RadioButton (Standalone)", () => {
  it("should allow checked prop to be updated programmatically when standalone", async () => {
    const { component } = render(RadioButtonStandalone, {
      props: { checked: false },
    });

    const input = screen.getByRole("radio");
    assert(input instanceof HTMLInputElement);
    expect(input).not.toBeChecked();

    component.checked = true;
    await flushMacrotask();

    expect(input).toBeChecked();

    component.checked = false;
    await flushMacrotask();

    expect(input).not.toBeChecked();
  });

  it("should bind checked state when user clicks standalone radio button", async () => {
    const { component } = render(RadioButtonStandalone, {
      props: { checked: false },
    });

    const input = screen.getByRole("radio");
    expect(component.checked).toBe(false);

    await user.click(input);

    expect(component.checked).toBe(true);
    expect(input).toBeChecked();
  });

  it("should support initial checked state for standalone radio button", () => {
    const { component } = render(RadioButtonStandalone, {
      props: { checked: true },
    });

    const input = screen.getByRole("radio");
    expect(input).toBeChecked();
    expect(component.checked).toBe(true);
  });
});
