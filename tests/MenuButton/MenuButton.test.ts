import { fireEvent, render, screen } from "@testing-library/svelte";
import ComboButtonFixture from "../ComboButton/ComboButton.test.svelte";
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
    const onMouseenter = vi.fn();
    render(MenuButtonFixture, { props: { onMouseenter } });

    await fireEvent.mouseEnter(screen.getByRole("button", { name: "Actions" }));

    expect(onMouseenter).toHaveBeenCalledTimes(1);
  });

  it("renders the disabled state on the trigger", () => {
    render(MenuButtonFixture, { props: { disabled: true } });

    expect(screen.getByRole("button", { name: "Actions" })).toBeDisabled();
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

  it("opens with Space and focuses the first item", async () => {
    render(MenuButtonFixture);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();
  });

  it("dispatches close with an escape-key trigger and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    render(MenuButtonFixture, { props: { onClose } });

    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onClose).toHaveBeenCalledWith({ trigger: "escape-key" });
  });

  it("renders the labelChildren slot instead of labelText, using labelText as the accessible name", () => {
    render(MenuButtonSlot);

    expect(screen.getByText("Custom trigger content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
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

    it("toggles, closes on Escape to the trigger, and never takes mouse focus", async () => {
      render(MenuButtonIconOnly);

      const trigger = screen.getByRole("button", { name: "Row actions" });
      const onFocus = vi.fn();
      trigger.addEventListener("focus", onFocus);

      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveClass("bx--overflow-menu--open");
      expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();
      expect(onFocus).not.toHaveBeenCalled();

      await user.click(trigger);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      await user.click(trigger);
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
    });

    it("renders the disabled state on the trigger", () => {
      render(MenuButtonIconOnly, { props: { disabled: true } });

      expect(
        screen.getByRole("button", { name: "Row actions" }),
      ).toBeDisabled();
    });
  });
});

// MenuButton and ComboButton share a trigger that opens the same Menu, so
// their size, select and mouse-focus behavior is asserted once for both.
describe.each([
  {
    name: "MenuButton",
    Fixture: MenuButtonFixture,
    buttonNames: ["Actions"],
    triggerName: "Actions",
    itemName: "Copy",
    tabKeys: "{Tab}",
  },
  {
    name: "ComboButton",
    Fixture: ComboButtonFixture,
    buttonNames: ["Save", "Additional actions"],
    triggerName: "Additional actions",
    itemName: "Save as",
    tabKeys: "{Tab}{Tab}",
  },
] as const)(
  "$name trigger and menu",
  ({ Fixture, buttonNames, triggerName, itemName, tabKeys }) => {
    it.each([
      { size: "xs", buttonClass: "bx--btn--sm", menuClass: "bx--menu--xs" },
      { size: "sm", buttonClass: "bx--btn--sm", menuClass: undefined },
      { size: "md", buttonClass: "bx--btn--field", menuClass: "bx--menu--md" },
      { size: "lg", buttonClass: undefined, menuClass: "bx--menu--lg" },
    ] as const)(
      "propagates size $size to the buttons and the menu row height",
      async ({ size, buttonClass, menuClass }) => {
        render(Fixture, { props: { size } });

        const buttons = buttonNames.map((name) =>
          screen.getByRole("button", { name }),
        );

        for (const button of buttons) {
          for (const unwanted of [
            "bx--btn--sm",
            "bx--btn--field",
            "bx--btn--lg",
            "bx--btn--xl",
          ]) {
            if (unwanted !== buttonClass)
              expect(button).not.toHaveClass(unwanted);
          }
          if (buttonClass) expect(button).toHaveClass(buttonClass);
        }

        await user.click(screen.getByRole("button", { name: triggerName }));

        const menu = screen.getByRole("menu");
        for (const unwanted of [
          "bx--menu--xs",
          "bx--menu--md",
          "bx--menu--lg",
        ]) {
          if (unwanted !== menuClass) expect(menu).not.toHaveClass(unwanted);
        }
        if (menuClass) expect(menu).toHaveClass(menuClass);
      },
    );

    it("dispatches close with a select trigger when an item is chosen", async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      render(Fixture, { props: { onSelect, onClose } });

      await user.click(screen.getByRole("button", { name: triggerName }));
      await user.click(screen.getByRole("menuitem", { name: itemName }));

      expect(onSelect).toHaveBeenCalledWith(itemName);
      expect(onClose).toHaveBeenCalledWith({ trigger: "select" });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("never focuses the trigger via a real mouse click, only via keyboard", async () => {
      render(Fixture);

      const trigger = screen.getByRole("button", { name: triggerName });
      const onFocus = vi.fn();
      trigger.addEventListener("focus", onFocus);

      // mousedown's default would focus the trigger. The menu opens by
      // moving focus to its first item, so assert on the focus event itself,
      // not just the focus state after the fact.
      await user.click(trigger);
      await user.click(trigger);
      expect(onFocus).not.toHaveBeenCalled();

      // Keyboard users still get normal focus via Tab.
      await user.keyboard(tabKeys);
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveFocus();
    });

    it("blurs the trigger after a mouse-driven close, but not a keyboard-driven one", async () => {
      // A real click reports event.detail 1+; a keyboard-activated (Enter/
      // Space) one reports 0. Start each case already open so the closing
      // click is what's under test, independent of how it was opened.
      const { unmount } = render(Fixture, { props: { open: true } });
      let trigger = screen.getByRole("button", { name: triggerName });
      trigger.focus();
      await fireEvent.click(trigger, { detail: 1 });
      expect(trigger).not.toHaveFocus();
      unmount();

      render(Fixture, { props: { open: true } });
      trigger = screen.getByRole("button", { name: triggerName });
      trigger.focus();
      await fireEvent.click(trigger, { detail: 0 });
      expect(trigger).toHaveFocus();
    });
  },
);

describe("MenuButton and ComboButton in RTL", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("direction");
  });

  // `data-carbon-align` and the portal's alignment are physical: `start` is
  // the left edge, `end` the right.
  const alignments = () => {
    const menu = screen.getByRole("menu");
    const portal = menu.closest("[data-floating-portal]");
    return [
      menu.getAttribute("data-carbon-align"),
      portal?.getAttribute("data-floating-intrinsic-align"),
    ];
  };

  it.each([
    ["MenuButton", "Row actions", "start", "end"],
    ["ComboButton", "Additional actions", "end", "start"],
  ])(
    "aligns the %s menu with the trigger's inline start or end",
    async (name, trigger, ltr, rtl) => {
      render(name === "MenuButton" ? MenuButtonIconOnly : ComboButtonFixture);
      const button = screen.getByRole("button", { name: trigger });

      await user.click(button);
      expect(alignments()).toEqual([ltr, ltr]);
      await user.click(button);

      document.documentElement.style.direction = "rtl";
      await user.click(button);
      expect(alignments()).toEqual([rtl, rtl]);
    },
  );
});
