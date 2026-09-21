import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ToggleButtonGroupConditional from "./ToggleButtonGroup.conditional.test.svelte";
import ToggleButtonGroupFixture from "./ToggleButtonGroup.test.svelte";

describe("ToggleButtonGroup keyboard navigation", () => {
  it("has exactly one tab stop, defaulting to the first button", () => {
    render(ToggleButtonGroupFixture);

    const buttons = screen.getAllByRole("button");
    const tabbable = buttons.filter(
      (button) => button.getAttribute("tabindex") === "0",
    );
    expect(tabbable).toEqual([buttons[0]]);
  });

  it("defaults the tab stop to the first pressed button", () => {
    render(ToggleButtonGroupFixture, { props: { selected: ["italic"] } });

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("moves focus with ArrowLeft/ArrowRight, wraps at the ends, and never toggles", async () => {
    render(ToggleButtonGroupFixture);

    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    const underline = screen.getByRole("button", { name: "Underline" });

    await user.tab();
    expect(bold).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(italic).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(bold).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(underline).toHaveFocus();

    await user.keyboard("{End}");
    expect(underline).toHaveFocus();

    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();

    for (const button of [bold, italic, underline]) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("skips a disabled button when moving focus", async () => {
    render(ToggleButtonGroupFixture, { props: { boldDisabled: true } });

    const italic = screen.getByRole("button", { name: "Italic" });
    const underline = screen.getByRole("button", { name: "Underline" });

    await user.tab();
    expect(italic).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(underline).toHaveFocus();
  });

  it("uses ArrowUp/ArrowDown when vertical", async () => {
    render(ToggleButtonGroupFixture, { props: { orientation: "vertical" } });

    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });

    await user.tab();
    expect(bold).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(italic).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(bold).toHaveFocus();
  });

  it("keeps a valid tab stop when the focused button unmounts", async () => {
    const { component } = render(ToggleButtonGroupConditional);

    const b = screen.getByRole("button", { name: "B" });
    b.focus();
    expect(b).toHaveFocus();

    component.showMiddle = false;
    await tick();

    const buttons = screen.getAllByRole("button");
    const tabbable = buttons.filter(
      (button) => button.getAttribute("tabindex") === "0",
    );
    expect(tabbable).toHaveLength(1);
  });
});
