import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuFixture from "./Menu.test.svelte";

describe("Menu", () => {
  it("opens and renders items in a portal, not nested in the anchor", async () => {
    render(MenuFixture);

    const trigger = screen.getByRole("button", { name: "Trigger" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);

    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(trigger.contains(menu)).toBe(false);

    const floatingPortal = menu.closest("[data-floating-portal]");
    expect(floatingPortal).toBeInTheDocument();
    expect(floatingPortal?.parentElement).toBe(document.body);

    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("applies the aria-label from labelText", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menu")).toHaveAttribute(
      "aria-label",
      "Example menu",
    );
  });

  it("applies the direction attribute", async () => {
    render(MenuFixture, { props: { direction: "top" } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menu")).toHaveAttribute(
      "data-floating-menu-direction",
      "top",
    );
  });

  it("focuses the first item on open and dispatches the open event", async () => {
    const onOpen = vi.fn();
    render(MenuFixture, { props: { onOpen } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();
    expect(onOpen).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("focuses the menu itself and still dispatches open when every item is disabled", async () => {
    const onOpen = vi.fn();
    render(MenuFixture, { props: { allDisabled: true, onOpen } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menu")).toHaveFocus();
    expect(onOpen).toHaveBeenCalledTimes(1);

    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();
  });

  it("focuses the first item without scrolling the page into view", async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    try {
      render(MenuFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const items = screen.getAllByRole("menuitem");
      const itemFocusCall = focusSpy.mock.calls.find(
        (_, index) => focusSpy.mock.instances[index] === items[0],
      );
      expect(itemFocusCall?.[0]).toEqual({ preventScroll: true });
    } finally {
      focusSpy.mockRestore();
    }
  });

  it("does not steal focus back from an outside element on an unrelated rerender while open", async () => {
    const { rerender } = render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();

    const outsideInput = document.createElement("input");
    outsideInput.setAttribute("aria-label", "Outside input");
    document.body.appendChild(outsideInput);
    outsideInput.focus();
    expect(outsideInput).toHaveFocus();

    // Trigger a rerender unrelated to `open` itself (menu stays open).
    await rerender({ size: "lg" });

    expect(outsideInput).toHaveFocus();

    document.body.removeChild(outsideInput);
  });

  it("navigates items with arrow keys without wrapping", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    // The first item is already focused on open.
    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[2]).toHaveFocus();

    // Clamps at the last item instead of wrapping.
    await user.keyboard("{ArrowDown}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(items[1]).toHaveFocus();
  });

  it("supports Home and End to jump to the first/last item", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("moves focus onto disabled items with the arrow keys", async () => {
    const onItemClick = vi.fn();
    render(MenuFixture, { props: { disabledIndex: 1, onItemClick } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[1]).toHaveAttribute("aria-disabled", "true");
    expect(items[0]).toHaveFocus();

    // Disabled items stay focusable, as in the WAI-ARIA APG menu pattern.
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(items[1]).toHaveFocus();

    // Enter and Space on the disabled item neither select nor close.
    const space = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    items[1].dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    await user.keyboard("{Enter}");
    expect(onItemClick).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("moves Home and End onto disabled first and last items", async () => {
    render(MenuFixture, { props: { disabledIndex: 2 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("moves focus to the item matching a typed character", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    // The first item ("First") is already focused on open.
    expect(items[0]).toHaveFocus();

    // Types "t" to jump straight to "Third".
    await user.keyboard("t");
    expect(items[2]).toHaveFocus();
  });

  it("moves focus onto a disabled item when searching by typed character", async () => {
    render(MenuFixture, { props: { disabledIndex: 1 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[1]).toHaveAttribute("aria-disabled", "true");

    await user.keyboard("s");
    expect(items[1]).toHaveFocus();
  });

  it("focuses the first non-disabled item on open", async () => {
    render(MenuFixture, { props: { disabledIndex: 0 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    expect(items[0]).toHaveAttribute("aria-disabled", "true");
    expect(items[1]).toHaveFocus();
  });

  it("dispatches click and closes the menu when an item is selected", async () => {
    const onItemClick = vi.fn();
    const onClose = vi.fn();
    render(MenuFixture, { props: { onItemClick, onClose } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.click(items[0]);

    expect(onItemClick).toHaveBeenCalledWith("First");
    expect(onClose).toHaveBeenCalledWith({ trigger: "select" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("returns focus to the anchor after selecting an item with the keyboard", async () => {
    render(MenuFixture);

    const trigger = screen.getByRole("button", { name: "Trigger" });
    await user.click(trigger);
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("leaves focus where an item's click handler moved it", async () => {
    render(MenuFixture, { props: { moveFocusOnClick: true } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });

  it("does not select or close when clicking a disabled item", async () => {
    const onItemClick = vi.fn();
    render(MenuFixture, { props: { disabledIndex: 0, onItemClick } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.click(items[0]);

    expect(onItemClick).not.toHaveBeenCalledWith("First");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("does not move focus onto a disabled item when clicked", async () => {
    render(MenuFixture, { props: { disabledIndex: 1 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");
    // Focus starts on the first (non-disabled) item.
    expect(items[0]).toHaveFocus();

    await user.click(items[1]);

    expect(items[1]).not.toHaveFocus();
  });

  it.each(["{Escape}", "{Tab}"])(
    "closes and returns focus to the anchor on %s",
    async (key) => {
      const onClose = vi.fn();
      render(MenuFixture, { props: { onClose } });

      const trigger = screen.getByRole("button", { name: "Trigger" });
      await user.click(trigger);

      await user.keyboard(key);

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(onClose).toHaveBeenCalledWith({ trigger: "escape-key" });
    },
  );

  it("closes on outside click without returning focus", async () => {
    const onClose = vi.fn();
    render(MenuFixture, { props: { onClose } });

    const trigger = screen.getByRole("button", { name: "Trigger" });
    await user.click(trigger);
    await user.click(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).not.toHaveFocus();
    expect(onClose).toHaveBeenCalledWith({ trigger: "outside-click" });
  });

  it.each([
    { maxHeight: 240, expected: "240px" },
    { maxHeight: "20rem", expected: "20rem" },
  ])(
    "caps the menu height at maxHeight $maxHeight",
    async ({ maxHeight, expected }) => {
      render(MenuFixture, { props: { maxHeight } });

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const menu = screen.getByRole("menu");
      expect(menu).toHaveClass("bx--menu--scrollable");
      expect(menu.style.maxHeight).toBe(expected);
    },
  );
});
