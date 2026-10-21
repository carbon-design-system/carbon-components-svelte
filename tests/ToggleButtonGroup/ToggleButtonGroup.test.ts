import { fireEvent, render, screen } from "@testing-library/svelte";
import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
import { type ComponentProps, tick } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import ToggleButtonGroupIconOnly from "./ToggleButtonGroup.iconOnly.test.svelte";
import ToggleButtonGroupFixture from "./ToggleButtonGroup.test.svelte";

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
  });

  it("toggles a button on click and dispatches change with the new array", async () => {
    const onChange = vi.fn();
    render(ToggleButtonGroupFixture, { props: { onChange } });

    const bold = screen.getByRole("button", { name: "Bold" });
    await user.click(bold);

    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenCalledWith(["bold"]);
  });

  it("does not dispatch change when selected is set programmatically", async () => {
    const onChange = vi.fn();
    const { component } = render(ToggleButtonGroupFixture, {
      props: { onChange },
    });

    component.selected = ["italic"];
    await tick();

    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(onChange).not.toHaveBeenCalled();
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

    it("presses only the first of several selected values and collapses to one on click", async () => {
      const { component } = render(ToggleButtonGroupFixture, {
        props: { selectionMode: "single", selected: ["italic", "bold"] },
      });

      const bold = screen.getByRole("button", { name: "Bold" });
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(bold).toHaveAttribute("aria-pressed", "false");

      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "true");
      expect(component.selected).toEqual(["bold"]);
    });

    it("required keeps the pressed button pressed and dispatches nothing", async () => {
      const onChange = vi.fn();
      const { component } = render(ToggleButtonGroupFixture, {
        props: {
          selectionMode: "single",
          required: true,
          selected: ["bold"],
          onChange,
        },
      });

      const bold = screen.getByRole("button", { name: "Bold" });
      await user.click(bold);

      expect(bold).toHaveAttribute("aria-pressed", "true");
      expect(component.selected).toEqual(["bold"]);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it("required in multiple mode keeps the last pressed button pressed", async () => {
    const onChange = vi.fn();
    const { component } = render(ToggleButtonGroupFixture, {
      props: { required: true, selected: ["bold"], onChange },
    });

    const bold = screen.getByRole("button", { name: "Bold" });
    await user.click(bold);

    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(component.selected).toEqual(["bold"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("required in multiple mode lets a button off while another stays pressed", async () => {
    const onChange = vi.fn();
    render(ToggleButtonGroupFixture, {
      props: { required: true, selected: ["bold", "italic"], onChange },
    });

    await user.click(screen.getByRole("button", { name: "Bold" }));

    expect(onChange).toHaveBeenCalledWith(["italic"]);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("disables every button when the group is disabled", () => {
    render(ToggleButtonGroupFixture, { props: { disabled: true } });

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
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

    it.each<{
      name: string;
      props: ComponentProps<typeof ToggleButtonGroupIconOnly>;
      dir: string;
    }>([
      { name: "bottom when horizontal", props: {}, dir: "bottom" },
      {
        name: "right when vertical, so it doesn't land on the next segment",
        props: { orientation: "vertical" },
        dir: "right",
      },
      {
        name: "the explicit tooltipPosition over the vertical default",
        props: { orientation: "vertical", tooltipPosition: "top" },
        dir: "top",
      },
    ])("sets the tooltip direction to $name", async ({ props, dir }) => {
      render(ToggleButtonGroupIconOnly, { props });

      await fireEvent.focus(screen.getByRole("button", { name: "Bold" }));
      await tick();
      expect(document.querySelector(".bx--tooltip-portal")).toHaveAttribute(
        "data-direction",
        dir,
      );
    });
  });

  it("does not throw when a standalone icon-only button gets focus", async () => {
    render(ToggleButton, {
      props: { value: "bold", icon: TextBold, iconDescription: "Bold" },
    });
    const button = screen.getByRole("button");
    await fireEvent.focus(button);
    await fireEvent.mouseEnter(button);
    await fireEvent.blur(button);
    expect(button).toBeInTheDocument();
  });
});
