import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
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
  });
});
