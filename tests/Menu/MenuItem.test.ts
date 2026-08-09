import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuItemRadioGroupFixture from "./MenuItem.radioGroup.test.svelte";
import MenuItemSelectableFixture from "./MenuItem.selectable.test.svelte";
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

  it("renders shortcutText in the info region", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Save ⌘S" });
    expect(item.querySelector(".bx--menu-option__info")).toHaveTextContent(
      "⌘S",
    );
  });

  it("does not render an info region when shortcutText is unset", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Plain" });
    expect(
      item.querySelector(".bx--menu-option__info"),
    ).not.toBeInTheDocument();
  });

  it("renders the shortcutText slot", async () => {
    render(MenuItemSlot);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Save ⌘S" });
    expect(item.querySelector(".bx--menu-option__info kbd")).toHaveTextContent(
      "⌘S",
    );
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

    it("prevents ArrowLeft's default action (page scroll) when closing the submenu", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");

      const submenuItem = screen.getByRole("menuitem", { name: "PDF" });
      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true,
      });
      submenuItem.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
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
  });

  describe("selectable", () => {
    const getSelectedIds = () =>
      JSON.parse(screen.getByTestId("selected-ids").textContent || "[]");

    it("renders checkbox items and seeds the bound value from a selected item", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(
        screen.getByRole("group", { name: "Columns" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Size" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(getSelectedIds()).toEqual(["size"]);
    });

    it("toggles aria-checked and the bound selectedIds on click", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));

      expect(getSelectedIds()).toEqual(["size", "name"]);

      // Selecting closes the menu, so reopen it to toggle the item back off.
      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveAttribute("aria-checked", "true");

      await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));
      expect(getSelectedIds()).toEqual(["size"]);
    });

    it("selects with Enter", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitemcheckbox", { name: "Name" }).focus();
      await user.keyboard("{Enter}");

      expect(getSelectedIds()).toEqual(["size", "name"]);
    });

    it("moves focus onto checkbox items with arrow keys", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(screen.getByRole("menuitem", { name: "Plain" })).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Size" }),
      ).toHaveFocus();
    });

    it("keeps the menu open when click is prevented and still toggles selection", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Date" }));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(getSelectedIds()).toEqual(["size", "date"]);
    });
  });

  describe("radio group", () => {
    const getSelectedId = () => screen.getByTestId("selected-id").textContent;

    it("renders radio items and seeds the bound value from a selected item", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(
        screen.getByRole("group", { name: "Density" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemradio", { name: "Compact" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("menuitemradio", { name: "Comfortable" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(getSelectedId()).toBe("comfortable");
    });

    it("unchecks the previous item when another one is selected", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemradio", { name: "Compact" }));

      expect(getSelectedId()).toBe("compact");

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(
        screen.getByRole("menuitemradio", { name: "Compact" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "Comfortable" }),
      ).toHaveAttribute("aria-checked", "false");
    });

    it("selects with Space", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitemradio", { name: "Compact" }).focus();
      await user.keyboard(" ");

      expect(getSelectedId()).toBe("compact");
    });

    it("moves focus onto radio items with arrow keys", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.keyboard("{ArrowDown}");

      expect(
        screen.getByRole("menuitemradio", { name: "Compact" }),
      ).toHaveFocus();
    });

    it("keeps nested and root menus open when a radio click is prevented", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitem", { name: "View" }));
      await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

      expect(
        screen.getByRole("menuitemradio", { name: "Dark" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "Light" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Plain" }),
      ).toBeInTheDocument();
    });
  });
});
