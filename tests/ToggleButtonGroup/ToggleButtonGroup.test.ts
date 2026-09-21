import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ToggleButtonGroupIconOnly from "./ToggleButtonGroup.iconOnly.test.svelte";
import ToggleButtonGroupFixture from "./ToggleButtonGroup.test.svelte";

/** Open tooltips currently rendered in the portal. */
function openTooltips() {
  return Array.from(document.querySelectorAll(".bx--tooltip-portal__content"));
}

describe("ToggleButtonGroup", () => {
  it("renders a toolbar with the accessible name from labelText", () => {
    render(ToggleButtonGroupFixture);

    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
    expect(toolbar).toBeInTheDocument();
  });

  it("prefers an explicit aria-label over labelText", () => {
    render(ToggleButtonGroupFixture, {
      props: { ariaLabel: "Formatting toolbar" },
    });

    expect(
      screen.getByRole("toolbar", { name: "Formatting toolbar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("toolbar", { name: "Text formatting" }),
    ).not.toBeInTheDocument();
  });

  it("toggles a button on click and dispatches change with the new array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ToggleButtonGroupFixture);

    const bold = screen.getByRole("button", { name: "Bold" });
    await user.click(bold);

    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(consoleLog).toHaveBeenCalledWith("change", ["bold"]);
  });

  it("two-way binds selected", async () => {
    const { component } = render(ToggleButtonGroupFixture);

    const bold = screen.getByRole("button", { name: "Bold" });
    await user.click(bold);

    expect(component.selected).toEqual(["bold"]);
  });

  it("does not dispatch change when selected is set programmatically", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(ToggleButtonGroupFixture);

    component.selected = ["italic"];
    await tick();

    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
  });

  it("supports multiple simultaneous selections", async () => {
    render(ToggleButtonGroupFixture);

    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    await user.click(bold);
    await user.click(italic);

    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(italic).toHaveAttribute("aria-pressed", "true");
  });

  describe("single selection mode", () => {
    it("pressing a different button replaces the pressed one", async () => {
      render(ToggleButtonGroupFixture, {
        props: { selectionMode: "single", selected: ["bold"] },
      });

      const italic = screen.getByRole("button", { name: "Italic" });
      await user.click(italic);

      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(italic).toHaveAttribute("aria-pressed", "true");
    });

    it("pressing the pressed button clears it", async () => {
      const { component } = render(ToggleButtonGroupFixture, {
        props: { selectionMode: "single", selected: ["bold"] },
      });

      const bold = screen.getByRole("button", { name: "Bold" });
      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "false");
      expect(component.selected).toEqual([]);
    });

    it("required keeps the pressed button pressed and dispatches nothing", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(ToggleButtonGroupFixture, {
        props: { selectionMode: "single", required: true, selected: ["bold"] },
      });

      const bold = screen.getByRole("button", { name: "Bold" });
      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "true");
      expect(component.selected).toEqual(["bold"]);
      expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
    });
  });

  it("required in multiple mode keeps the last pressed button pressed", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(ToggleButtonGroupFixture, {
      props: { required: true, selected: ["bold"] },
    });

    const bold = screen.getByRole("button", { name: "Bold" });
    await user.click(bold);

    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(component.selected).toEqual(["bold"]);
    expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
  });

  it("disables every button when the group is disabled", () => {
    render(ToggleButtonGroupFixture, { props: { disabled: true } });

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("does not toggle a disabled button", () => {
    render(ToggleButtonGroupFixture, { props: { boldDisabled: true } });

    const bold = screen.getByRole("button", { name: "Bold" });
    expect(bold).toBeDisabled();
    expect(bold).toHaveAttribute("aria-pressed", "false");
  });

  it("uses iconDescription as the accessible label for an icon-only button", () => {
    render(ToggleButtonGroupIconOnly);

    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
  });

  describe("icon-only tooltips", () => {
    it("opens a portalled tooltip on hover after the enter delay and closes after the leave delay", async () => {
      vi.useFakeTimers();
      try {
        render(ToggleButtonGroupIconOnly);
        const bold = screen.getByRole("button", { name: "Bold" });

        await fireEvent.mouseEnter(bold);
        expect(openTooltips()).toHaveLength(0);

        await vi.advanceTimersByTimeAsync(120);
        expect(openTooltips()).toHaveLength(1);
        expect(openTooltips()[0]).toHaveTextContent("Bold");

        await fireEvent.mouseLeave(bold);
        await vi.advanceTimersByTimeAsync(320);
        expect(openTooltips()).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it("hands off to an adjacent icon-only button instantly, closing the previous one", async () => {
      vi.useFakeTimers();
      try {
        render(ToggleButtonGroupIconOnly);
        const bold = screen.getByRole("button", { name: "Bold" });
        const italic = screen.getByRole("button", { name: "Italic" });

        await fireEvent.mouseEnter(bold);
        await vi.advanceTimersByTimeAsync(120);
        expect(openTooltips()).toHaveLength(1);
        expect(openTooltips()[0]).toHaveTextContent("Bold");

        // A quick scan across segments (each mouseleave firing before the
        // next mouseenter) must reveal the new one immediately, never
        // leaving both, or neither, open.
        await fireEvent.mouseLeave(bold);
        await fireEvent.mouseEnter(italic);
        await tick();
        expect(openTooltips()).toHaveLength(1);
        expect(openTooltips()[0]).toHaveTextContent("Italic");
      } finally {
        vi.useRealTimers();
      }
    });

    it("opens on keyboard focus and closes on blur", async () => {
      render(ToggleButtonGroupIconOnly);
      const bold = screen.getByRole("button", { name: "Bold" });

      await fireEvent.focus(bold);
      await tick();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Bold");

      await fireEvent.blur(bold);
      await tick();
      expect(openTooltips()).toHaveLength(0);
    });

    it("defaults the tooltip direction to bottom when horizontal", async () => {
      render(ToggleButtonGroupIconOnly);
      const bold = screen.getByRole("button", { name: "Bold" });

      await fireEvent.focus(bold);
      await tick();
      const portal = document.querySelector(".bx--tooltip-portal");
      expect(portal).toHaveAttribute("data-direction", "bottom");
    });

    it("defaults the tooltip direction to right when vertical, so it doesn't land on the next segment", async () => {
      render(ToggleButtonGroupIconOnly, {
        props: { orientation: "vertical" },
      });
      const bold = screen.getByRole("button", { name: "Bold" });

      await fireEvent.focus(bold);
      await tick();
      const portal = document.querySelector(".bx--tooltip-portal");
      expect(portal).toHaveAttribute("data-direction", "right");
    });

    it("lets an explicit tooltipPosition override the vertical default", async () => {
      render(ToggleButtonGroupIconOnly, {
        props: { orientation: "vertical", tooltipPosition: "top" },
      });
      const bold = screen.getByRole("button", { name: "Bold" });

      await fireEvent.focus(bold);
      await tick();
      const portal = document.querySelector(".bx--tooltip-portal");
      expect(portal).toHaveAttribute("data-direction", "top");
    });
  });
});
