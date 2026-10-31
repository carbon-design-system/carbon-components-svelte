import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import ColorInput from "./ColorInput.test.svelte";

const field = () => screen.getByRole("textbox", { name: "Brand color" });
const trigger = () => screen.getByRole("button", { name: "Choose a color" });
const area = () =>
  screen.getByRole("slider", { name: "Saturation and brightness" });
const value = () => screen.getByTestId("value").textContent;

describe("ColorInput", () => {
  it("shows the value in a labelled field, with a swatch button", () => {
    render(ColorInput, { value: "#0f62fe" });

    expect(field()).toHaveValue("#0f62fe");
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(
      trigger().querySelector<HTMLElement>(".bx--color-input__swatch-face")
        ?.style.backgroundColor,
    ).toBe("rgb(15, 98, 254)");
    // The picker is not built until it opens.
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("draws an empty swatch for no color", () => {
    render(ColorInput, { value: "" });

    expect(
      trigger().querySelector(".bx--color-input__swatch-face--empty"),
    ).not.toBeNull();
  });

  it("opens the picker in a dialog and focuses the area", async () => {
    render(ColorInput);

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("dialog", { name: "Choose a color" }),
    ).toBeVisible();
    expect(area()).toHaveFocus();
  });

  it("closes on Escape and returns focus to the swatch button", async () => {
    render(ColorInput);
    await user.click(trigger());

    await user.keyboard("{Escape}");

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("closes on an outside click", async () => {
    render(ColorInput);
    await user.click(trigger());
    // The outside-click listener starts on the next frame.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    await user.click(screen.getByRole("button", { name: "After" }));

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when focus moves past the popover", async () => {
    render(ColorInput);
    await user.click(trigger());

    await fireEvent.focusOut(area(), {
      relatedTarget: screen.getByRole("button", { name: "After" }),
    });

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("writes a pick into the field and dispatches change", async () => {
    const { component } = render(ColorInput, { value: "#0f62fe" });
    await user.click(trigger());

    await user.keyboard("{Home}");

    expect(value()).toMatch(/^#[0-9a-f]{6}$/);
    expect(field()).toHaveValue(value());
    expect(component.changes).toContain(value());
  });

  it("keeps recent colors while the popover is closed", async () => {
    render(ColorInput, {
      swatches: [{ value: "#da1e28", label: "Red" }],
    });
    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Red" }));
    await user.keyboard("{Escape}");

    await user.click(trigger());

    const list = screen.getByRole("listbox", { name: "Recent colors" });
    expect(within(list).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByTestId("recent")).toHaveTextContent("#da1e28");
  });

  describe("typing", () => {
    it("normalizes a typed color to the format", async () => {
      const { component } = render(ColorInput, { value: "" });

      await user.type(field(), "DA1E28{Tab}");

      expect(value()).toBe("#da1e28");
      expect(field()).toHaveValue("#da1e28");
      expect(component.changes).toEqual(["#da1e28"]);
    });

    it("converts a typed color into the format", async () => {
      render(ColorInput, { value: "", format: "rgb" });

      await user.type(field(), "#da1e28{Tab}");

      expect(value()).toBe("rgb(218, 30, 40)");
    });

    it("clears the value when the field is emptied", async () => {
      render(ColorInput, { value: "#0f62fe" });

      await user.clear(field());
      await user.tab();

      expect(value()).toBe("");
    });

    it("marks text that is not a color invalid and keeps the value", async () => {
      render(ColorInput, { value: "#0f62fe" });

      await user.clear(field());
      await user.type(field(), "blueish{Tab}");

      expect(field()).toBeInvalid();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Enter a valid color",
      );
      expect(value()).toBe("#0f62fe");
    });
  });

  it("drops alpha from a typed color without alpha", async () => {
    render(ColorInput, { value: "", alpha: false });

    await user.type(field(), "#0f62fe80{Tab}");

    expect(value()).toBe("#0f62fe");
  });

  it("disables the swatch button with the field", () => {
    render(ColorInput, { disabled: true });

    expect(field()).toBeDisabled();
    expect(trigger()).toBeDisabled();
  });

  it("does not open a read-only field", async () => {
    render(ColorInput, { readonly: true });

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("describes the field with helper text and shows the status text", () => {
    render(ColorInput, { helperText: "Used for links", invalid: false });

    expect(field()).toHaveAccessibleDescription("Used for links");
  });
});
