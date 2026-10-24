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

    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();

    await user.keyboard("{End}");
    expect(underline).toHaveFocus();

    for (const button of [bold, italic, underline]) {
      expect(button).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("swaps ArrowLeft and ArrowRight in RTL", async () => {
    document.documentElement.style.direction = "rtl";
    render(ToggleButtonGroupFixture);

    try {
      await user.tab();
      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();

      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(screen.getByRole("button", { name: "Underline" })).toHaveFocus();
    } finally {
      document.documentElement.style.removeProperty("direction");
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

  it("moves the tab stop off a button that becomes disabled", async () => {
    const { component } = render(ToggleButtonGroupFixture);

    component.boldDisabled = true;
    await tick();

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("makes a clicked button the only tab stop", async () => {
    render(ToggleButtonGroupFixture);

    await user.click(screen.getByRole("button", { name: "Underline" }));

    const buttons = screen.getAllByRole("button");
    const tabbable = buttons.filter(
      (button) => button.getAttribute("tabindex") === "0",
    );
    expect(tabbable).toEqual([
      screen.getByRole("button", { name: "Underline" }),
    ]);
  });

  it("ignores grid and moves with Up/Down through roving focus when vertical", async () => {
    render(ToggleButtonGroupFixture, {
      props: { grid: true, orientation: "vertical" },
    });

    expect(screen.getByRole("toolbar")).not.toHaveClass(
      "bx--toggle-button-group--grid",
    );

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
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

  it("prevents the page from scrolling when an arrow key moves focus", async () => {
    render(ToggleButtonGroupFixture, { props: { orientation: "vertical" } });
    const bold = screen.getByRole("button", { name: "Bold" });
    bold.focus();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    bold.dispatchEvent(event);
    await tick();

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole("button", { name: "Italic" })).toHaveFocus();
  });

  it.each(
    [
      { key: "ArrowRight", grid: false },
      { key: "ArrowDown", grid: true },
    ].flatMap((row) =>
      ["altKey", "ctrlKey", "metaKey"].map((modifier) => ({
        ...row,
        modifier,
      })),
    ),
  )(
    "leaves $key with $modifier held to the browser (grid: $grid)",
    async ({ key, grid, modifier }) => {
      render(ToggleButtonGroupFixture, { props: { grid } });
      const bold = screen.getByRole("button", { name: "Bold" });
      bold.focus();

      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        [modifier]: true,
      });
      bold.dispatchEvent(event);
      await tick();

      expect(event.defaultPrevented).toBe(false);
      expect(bold).toHaveFocus();
      expect(bold).toHaveAttribute("tabindex", "0");
    },
  );

  it("keeps a valid tab stop when the focused button unmounts", async () => {
    const { component } = render(ToggleButtonGroupConditional);

    const b = screen.getByRole("button", { name: "B" });
    b.focus();
    expect(b).toHaveFocus();

    component.showMiddle = false;
    await tick();

    const a = screen.getByRole("button", { name: "A" });
    const c = screen.getByRole("button", { name: "C" });
    expect(screen.getAllByRole("button")).toEqual([a, c]);
    expect(a).toHaveAttribute("tabindex", "0");
    expect(c).toHaveAttribute("tabindex", "-1");
  });
});
