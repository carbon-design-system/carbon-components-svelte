import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuItemPreventDefault from "./MenuItem.preventDefault.test.svelte";
import MenuItemRadio from "./MenuItem.radio.test.svelte";
import MenuItemSelectable from "./MenuItem.selectable.test.svelte";
import MenuItemShortcut from "./MenuItem.shortcut.test.svelte";
import MenuItemSlot from "./MenuItem.slot.test.svelte";
import MenuItemFixture from "./MenuItem.test.svelte";

/** MenuItem's hover-open/close delay for a submenu. */
const HOVER_DELAY_MS = 150;

describe("MenuItem", () => {
  it("renders an icon to the left of the label", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Add item" });
    const icon = item.querySelector(".bx--menu-option__icon svg");
    expect(icon).toBeInTheDocument();
  });

  it("does not render an icon wrapper when icon is unset", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Plain" });
    expect(
      item.querySelector(".bx--menu-option__icon"),
    ).not.toBeInTheDocument();
  });

  it("applies the danger class for kind danger", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass(
      "bx--menu-option--danger",
    );
  });

  it("renders a divider as a separator between items", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const separator = screen.getByRole("separator");
    expect(separator).toHaveClass("bx--menu-divider");
  });

  it("prevents Space's default action (page scroll) when selecting an item", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const item = screen.getByRole("menuitem", { name: "Add item" });
    item.focus();

    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    item.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  describe("submenu", () => {
    it("renders a caret and aria attributes for an item with nested children", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const parent = screen.getByRole("menuitem", { name: "Export as" });
      expect(parent).toHaveAttribute("aria-haspopup", "true");
      expect(parent).toHaveAttribute("aria-expanded", "false");
      expect(
        parent.querySelector(".bx--menu-option__info svg"),
      ).toBeInTheDocument();
    });

    it("opens the submenu on click without selecting or closing the root menu", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitem", { name: "Export as" }));

      expect(screen.getByRole("menuitem", { name: "PDF" })).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Export as" }),
      ).toHaveAttribute("aria-expanded", "true");
      // Root menu is still open.
      expect(
        screen.getByRole("menuitem", { name: "Add item" }),
      ).toBeInTheDocument();
    });

    it("opens the submenu with ArrowRight and focuses the first item", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();
    });

    it("closes the submenu with ArrowLeft and refocuses the parent item", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowLeft}");

      expect(
        screen.queryByRole("menuitem", { name: "PDF" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Export as" })).toHaveFocus();
    });

    it("skips a disabled nested item during arrow key navigation", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowDown}");

      expect(screen.getByRole("menuitem", { name: "JPG" })).toHaveFocus();
    });

    it("selecting a nested item closes the entire menu tree", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitem", { name: "Export as" }));
      await user.click(screen.getByRole("menuitem", { name: "PDF" }));

      expect(consoleLog).toHaveBeenCalledWith("select", "PDF");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("opens the submenu on hover after a delay", async () => {
      vi.useFakeTimers();
      try {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });

        await fireEvent.mouseEnter(parent);
        expect(
          screen.queryByRole("menuitem", { name: "PDF" }),
        ).not.toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not close the submenu when the pointer moves into it before the close delay elapses", async () => {
      vi.useFakeTimers();
      try {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();

        await fireEvent.mouseLeave(parent);
        const submenu = screen.getByRole("menu", { name: "Export as" });
        await fireEvent.mouseEnter(submenu);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("renders the labelChildren slot instead of labelText, using labelText as the title", async () => {
      render(MenuItemSlot);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(screen.getByText("Custom label content")).toBeInTheDocument();
      const parent = screen.getByRole("menuitem", {
        name: "Custom label content",
      });
      expect(parent.querySelector(".bx--menu-option__label")).toHaveAttribute(
        "title",
        "Export as",
      );
    });

    it("does not close the submenu when the pointer crosses through the safe triangle", async () => {
      vi.useFakeTimers();
      try {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        const submenu = screen.getByRole("menu", { name: "Export as" });
        parent.getBoundingClientRect = () =>
          ({ top: 100, left: 0, right: 100, bottom: 120, height: 20 }) as DOMRect;
        submenu.getBoundingClientRect = () =>
          ({ top: 100, left: 100, right: 300, bottom: 300, height: 200 }) as DOMRect;

        await fireEvent.mouseLeave(parent);
        // Inside the wedge between the trigger and the submenu's vertical center.
        await fireEvent.mouseMove(parent, { clientX: 110, clientY: 200 });
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("closes the submenu when the pointer moves away from the safe triangle", async () => {
      vi.useFakeTimers();
      try {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        const submenu = screen.getByRole("menu", { name: "Export as" });
        parent.getBoundingClientRect = () =>
          ({ top: 100, left: 0, right: 100, bottom: 120, height: 20 }) as DOMRect;
        submenu.getBoundingClientRect = () =>
          ({ top: 100, left: 100, right: 300, bottom: 300, height: 200 }) as DOMRect;

        await fireEvent.mouseLeave(parent);
        // Far outside the wedge.
        await fireEvent.mouseMove(parent, { clientX: 105, clientY: 400 });
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.queryByRole("menuitem", { name: "PDF" }),
        ).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("selectable", () => {
    it("renders role menuitemcheckbox and toggles selected on click without closing the menu", async () => {
      render(MenuItemSelectable);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      const item = screen.getByRole("menuitemcheckbox", { name: "Show grid" });
      expect(item).toHaveAttribute("aria-checked", "false");

      await user.click(item);

      expect(item).toHaveAttribute("aria-checked", "true");
      expect(
        item.querySelector(".bx--menu-option__icon svg"),
      ).toBeInTheDocument();
      // Selecting a checkbox item keeps the menu open.
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("does not render a checkmark when unselected", async () => {
      render(MenuItemSelectable, { props: { selected: false } });

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      const item = screen.getByRole("menuitemcheckbox", { name: "Show grid" });

      expect(item.querySelector(".bx--menu-option__icon svg")).toBeNull();
      // The icon gutter is still reserved so the label stays aligned.
      expect(item.querySelector(".bx--menu-option__icon")).toBeInTheDocument();
    });
  });

  describe("shortcutText and icon slot", () => {
    it("renders shortcut text at the trailing edge of the item", async () => {
      render(MenuItemShortcut);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      const item = screen.getByRole("menuitem", { name: /^Save/ });

      expect(item.querySelector(".bx--menu-option__info")).toHaveTextContent(
        "Ctrl+S",
      );
    });

    it("renders custom markup from the icon slot", async () => {
      render(MenuItemShortcut);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("radio", () => {
    it("renders role menuitemradio and only checks the selected option", async () => {
      render(MenuItemRadio, { props: { selectedId: "center" } });

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const left = screen.getByRole("menuitemradio", { name: "Left" });
      const center = screen.getByRole("menuitemradio", { name: "Center" });
      expect(left).toHaveAttribute("aria-checked", "false");
      expect(center).toHaveAttribute("aria-checked", "true");
    });

    it("selecting an option updates the group and closes the menu", async () => {
      render(MenuItemRadio, { props: { selectedId: "left" } });

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemradio", { name: "Right" }));

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("preventDefault", () => {
    it("keeps the menu open when a click handler calls preventDefault", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MenuItemPreventDefault);

      await user.click(screen.getByRole("menuitem", { name: "Stay open" }));

      expect(consoleLog).toHaveBeenCalledWith("click", "Stay open");
      expect(consoleLog).not.toHaveBeenCalledWith("close");
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("closes the menu normally when preventDefault is not called", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MenuItemPreventDefault);

      await user.click(screen.getByRole("menuitem", { name: "Close menu" }));

      expect(consoleLog).toHaveBeenCalledWith("click", "Close menu");
      expect(consoleLog).toHaveBeenCalledWith("close");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
