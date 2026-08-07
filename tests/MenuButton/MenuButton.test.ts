import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuButtonIconOnly from "./MenuButton.iconOnly.test.svelte";
import MenuButtonSlot from "./MenuButton.slot.test.svelte";
import MenuButtonFixture from "./MenuButton.test.svelte";

describe("MenuButton", () => {
  it("opens the menu on trigger click and closes on a second click", async () => {
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("forwards mouseenter from the trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    await fireEvent.mouseEnter(screen.getByRole("button", { name: "Actions" }));

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("renders the disabled state on the trigger", () => {
    render(MenuButtonFixture, { props: { disabled: true } });

    expect(screen.getByRole("button", { name: "Actions" })).toBeDisabled();
  });

  it("applies the kind class to the trigger", () => {
    render(MenuButtonFixture, { props: { kind: "ghost" } });

    expect(screen.getByRole("button", { name: "Actions" })).toHaveClass(
      "bx--btn--ghost",
    );
  });

  it.each([
    { size: "xs", buttonClass: "bx--btn--xs", menuClass: "bx--menu--xs" },
    { size: "sm", buttonClass: "bx--btn--sm", menuClass: undefined },
    { size: "md", buttonClass: "bx--btn--field", menuClass: "bx--menu--md" },
    { size: "lg", buttonClass: "bx--btn--lg-48", menuClass: "bx--menu--lg" },
  ] as const)(
    "propagates size $size to the trigger and the menu row height",
    async ({ size, buttonClass, menuClass }) => {
      render(MenuButtonFixture, { props: { size } });

      const trigger = screen.getByRole("button", { name: "Actions" });

      for (const unwanted of [
        "bx--btn--xs",
        "bx--btn--sm",
        "bx--btn--field",
        "bx--btn--lg-48",
        "bx--btn--lg",
        "bx--btn--xl",
      ]) {
        if (unwanted !== buttonClass) expect(trigger).not.toHaveClass(unwanted);
      }
      if (buttonClass) expect(trigger).toHaveClass(buttonClass);

      await user.click(trigger);

      const menu = screen.getByRole("menu");
      for (const unwanted of ["bx--menu--xs", "bx--menu--md", "bx--menu--lg"]) {
        if (unwanted !== menuClass) expect(menu).not.toHaveClass(unwanted);
      }
      if (menuClass) expect(menu).toHaveClass(menuClass);
    },
  );

  it("keeps the trigger off Button's old, baseline-aligned 64px `lg` class", () => {
    render(MenuButtonFixture, { props: { size: "lg" } });

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveClass("bx--btn--lg-48");
    expect(trigger).not.toHaveClass("bx--btn--lg");
  });

  it("rotates the trigger's chevron by toggling the open modifier class", async () => {
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).not.toHaveClass("bx--menu-button__trigger--open");

    await user.click(trigger);
    expect(trigger).toHaveClass("bx--menu-button__trigger--open");
  });

  it("opens and focuses the first item with the keyboard", async () => {
    render(MenuButtonFixture);

    await user.tab();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();
  });

  it("opens with Space and selects the focused item with a second Space", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();

    await user.keyboard(" ");
    expect(consoleLog).toHaveBeenCalledWith("select", "Cut");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches close with a select trigger when an item is chosen", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));

    expect(consoleLog).toHaveBeenCalledWith("select", "Copy");
    expect(consoleLog).toHaveBeenCalledWith("close", { trigger: "select" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches close with an escape-key trigger and returns focus to the trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("close", {
      trigger: "escape-key",
    });
  });

  it("renders the labelChildren slot instead of labelText, using labelText as the accessible name", () => {
    render(MenuButtonSlot);

    expect(screen.getByText("Custom trigger content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
  });

  it("never focuses the trigger via a real mouse click, only via keyboard", async () => {
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });

    await user.click(trigger);
    expect(trigger).not.toHaveFocus();

    await user.click(trigger);
    expect(trigger).not.toHaveFocus();

    await user.tab();
    expect(trigger).toHaveFocus();
  });

  it("blurs the trigger after a mouse-driven close, but not a keyboard-driven one", async () => {
    // A real click reports event.detail 1+; a keyboard-activated (Enter/
    // Space) one reports 0. Start each case already open so the closing
    // click is what's under test, independent of how it was opened.
    const { unmount } = render(MenuButtonFixture, { props: { open: true } });
    let trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await fireEvent.click(trigger, { detail: 1 });
    expect(trigger).not.toHaveFocus();
    unmount();

    render(MenuButtonFixture, { props: { open: true } });
    trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await fireEvent.click(trigger, { detail: 0 });
    expect(trigger).toHaveFocus();
  });

  describe("icon-only", () => {
    it("names the trigger from labelText without rendering it as label content", () => {
      render(MenuButtonIconOnly);

      expect(
        screen.getByRole("button", { name: "Row actions" }),
      ).toBeInTheDocument();
      // The icon's <title> carries the same text; it is not visible content.
      expect(
        screen.queryByText("Row actions", { ignore: "title" }),
      ).not.toBeInTheDocument();
    });

    it("attaches the menu with the overflow-menu shadow bridge", async () => {
      render(MenuButtonIconOnly);

      await user.click(screen.getByRole("button", { name: "Row actions" }));

      const menu = screen.getByRole("menu");
      expect(menu).toHaveAttribute("data-carbon-menu-button-icon-only");
      expect(menu).toHaveAttribute("data-carbon-align", "start");
    });

    it.each([
      { size: "sm", sizeClass: "bx--overflow-menu--sm" },
      { size: "lg", sizeClass: "bx--overflow-menu--xl" },
    ] as const)(
      "renders the overflow menu trigger with the $size size class",
      ({ size, sizeClass }) => {
        render(MenuButtonIconOnly, { props: { size } });

        const trigger = screen.getByRole("button", { name: "Row actions" });

        expect(trigger).toHaveClass("bx--overflow-menu");
        expect(trigger).toHaveClass(sizeClass);
      },
    );

    it("renders the disabled state on the trigger", () => {
      render(MenuButtonIconOnly, { props: { disabled: true } });

      expect(
        screen.getByRole("button", { name: "Row actions" }),
      ).toBeDisabled();
    });
  });
});
