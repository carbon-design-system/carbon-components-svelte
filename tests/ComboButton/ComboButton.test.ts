import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboButtonSlot from "./ComboButton.slot.test.svelte";
import ComboButtonFixture from "./ComboButton.test.svelte";

describe("ComboButton", () => {
  it("fires the primary action click independently of the menu trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboButtonFixture);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(consoleLog).toHaveBeenCalledWith("click");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches click:trigger when the menu trigger is clicked, independent of click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboButtonFixture);

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(consoleLog).toHaveBeenCalledWith("click:trigger");
    expect(consoleLog).not.toHaveBeenCalledWith("click");
  });

  it("forwards mouseenter from both the primary action and the trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboButtonFixture);

    const primaryAction = screen.getByRole("button", { name: "Save" });
    const trigger = screen.getByRole("button", { name: "Additional actions" });

    await fireEvent.mouseEnter(primaryAction);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");

    consoleLog.mockClear();
    await fireEvent.mouseEnter(trigger);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("dispatches mouseenter:trigger only from the trigger, not the primary action", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboButtonFixture);

    const primaryAction = screen.getByRole("button", { name: "Save" });
    const trigger = screen.getByRole("button", { name: "Additional actions" });

    await fireEvent.mouseEnter(primaryAction);
    expect(consoleLog).not.toHaveBeenCalledWith("mouseenter:trigger");

    await fireEvent.mouseEnter(trigger);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter:trigger");
  });

  it("opens and closes the menu from the icon-only trigger", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);

    await user.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens and focuses the first item from the trigger", async () => {
    render(ComboButtonFixture);

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(screen.getByRole("menuitem", { name: "Save as" })).toHaveFocus();
  });

  it("dispatches close and forwards the trigger reason when an item is selected", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ComboButtonFixture);

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Save as" }));

    expect(consoleLog).toHaveBeenCalledWith("select", "Save as");
    expect(consoleLog).toHaveBeenCalledWith("close", { trigger: "select" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("disables both the primary action and trigger buttons", () => {
    render(ComboButtonFixture, { props: { disabled: true } });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Additional actions" }),
    ).toBeDisabled();
  });

  it.each([
    { size: "xs", buttonClass: "bx--btn--sm", menuClass: "bx--menu--xs" },
    { size: "sm", buttonClass: "bx--btn--sm", menuClass: undefined },
    { size: "md", buttonClass: "bx--btn--field", menuClass: "bx--menu--md" },
    { size: "lg", buttonClass: undefined, menuClass: "bx--menu--lg" },
  ] as const)("propagates size $size to both buttons and the menu row height", async ({
    size,
    buttonClass,
    menuClass,
  }) => {
    render(ComboButtonFixture, { props: { size } });

    const primaryAction = screen.getByRole("button", { name: "Save" });
    const trigger = screen.getByRole("button", {
      name: "Additional actions",
    });

    for (const unwanted of [
      "bx--btn--sm",
      "bx--btn--field",
      "bx--btn--lg",
      "bx--btn--xl",
    ]) {
      if (unwanted !== buttonClass) {
        expect(primaryAction).not.toHaveClass(unwanted);
        expect(trigger).not.toHaveClass(unwanted);
      }
    }
    if (buttonClass) {
      expect(primaryAction).toHaveClass(buttonClass);
      expect(trigger).toHaveClass(buttonClass);
    }

    await user.click(trigger);

    const menu = screen.getByRole("menu");
    for (const unwanted of ["bx--menu--xs", "bx--menu--md", "bx--menu--lg"]) {
      if (unwanted !== menuClass) expect(menu).not.toHaveClass(unwanted);
    }
    if (menuClass) expect(menu).toHaveClass(menuClass);
  });

  it("keeps both buttons the same height at every size (no Button `lg`/`xl` baseline misalignment)", () => {
    render(ComboButtonFixture, { props: { size: "lg" } });

    const primaryAction = screen.getByRole("button", { name: "Save" });
    const trigger = screen.getByRole("button", { name: "Additional actions" });

    // Button's own "lg"/"xl" classes render at 64px/80px for labeled buttons
    // but are ignored for icon-only buttons, and apply baseline (not center)
    // alignment - ComboButton must never reach for them.
    expect(primaryAction).not.toHaveClass("bx--btn--lg");
    expect(trigger).not.toHaveClass("bx--btn--lg");
  });

  it("defaults to the md size", async () => {
    render(ComboButtonFixture);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "bx--btn--field",
    );

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(screen.getByRole("menu")).toHaveClass("bx--menu--md");
  });

  it("hides the trigger tooltip once the menu is open", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveClass("bx--tooltip__trigger");

    await user.click(trigger);

    expect(trigger).not.toHaveClass("bx--tooltip__trigger");
  });

  it("renders the labelChildren slot instead of labelText, using labelText as the accessible name", () => {
    render(ComboButtonSlot);

    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders the trigger without a tooltip when iconDescription is an empty string", () => {
    render(ComboButtonFixture, { props: { iconDescription: "" } });

    const [, trigger] = screen.getAllByRole("button");
    expect(trigger).toHaveClass("bx--btn--icon-only");
    expect(trigger).not.toHaveClass("bx--tooltip__trigger");
    expect(trigger).not.toHaveClass("bx--tooltip--a11y");
    expect(
      trigger.querySelector(".bx--assistive-text"),
    ).not.toBeInTheDocument();
  });

  it("keeps the tooltip position independent of the menu direction", () => {
    render(ComboButtonFixture, {
      props: { direction: "top", tooltipPosition: "right" },
    });

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveClass("bx--btn--icon-only--right");
    expect(trigger).not.toHaveClass("bx--btn--icon-only--top");
  });

  it("never focuses the trigger via a real mouse click, only via keyboard", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });

    // Open: mousedown's default focus behavior is suppressed, so focus goes
    // straight to the first menu item instead of landing on the trigger.
    await user.click(trigger);
    expect(trigger).not.toHaveFocus();

    // Close: same story - the trigger was never focused, so there's nothing
    // to show a lingering focus ring.
    await user.click(trigger);
    expect(trigger).not.toHaveFocus();

    // Keyboard users still get normal focus via Tab.
    await user.tab();
    await user.tab();
    expect(trigger).toHaveFocus();
  });

  it("blurs the trigger after a mouse-driven close, but not a keyboard-driven one", async () => {
    // A real click reports event.detail 1+; a keyboard-activated (Enter/
    // Space) one reports 0. Start each case already open so the closing
    // click is what's under test, independent of how it was opened.
    const { unmount } = render(ComboButtonFixture, { props: { open: true } });
    let trigger = screen.getByRole("button", { name: "Additional actions" });
    trigger.focus();
    await fireEvent.click(trigger, { detail: 1 });
    expect(trigger).not.toHaveFocus();
    unmount();

    render(ComboButtonFixture, { props: { open: true } });
    trigger = screen.getByRole("button", { name: "Additional actions" });
    trigger.focus();
    await fireEvent.click(trigger, { detail: 0 });
    expect(trigger).toHaveFocus();
  });
});
