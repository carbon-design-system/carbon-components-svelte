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

  it("overrides fixed positioning so FloatingPortal controls placement", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const menu = screen.getByRole("menu");
    expect(menu.style.position).toBe("relative");
  });

  it("applies the direction attribute", async () => {
    render(MenuFixture, { props: { direction: "top" } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menu")).toHaveAttribute(
      "data-floating-menu-direction",
      "top",
    );
  });

  it("focuses the menu on open and dispatches the open event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    expect(screen.getByRole("menu")).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("open", expect.any(HTMLElement));
  });

  it("navigates items with arrow keys without wrapping", async () => {
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
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

  it("skips disabled items during keyboard navigation", async () => {
    render(MenuFixture, { props: { disabledIndex: 1 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[1]).toHaveAttribute("aria-disabled", "true");

    await user.keyboard("{ArrowDown}");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(items[2]).toHaveFocus();
  });

  it("dispatches click and closes the menu when an item is selected", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.click(items[0]);

    expect(consoleLog).toHaveBeenCalledWith("click", "First");
    expect(consoleLog).toHaveBeenCalledWith("close", { trigger: "select" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not select or close when clicking a disabled item", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuFixture, { props: { disabledIndex: 0 } });

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const items = screen.getAllByRole("menuitem");

    await user.click(items[0]);

    expect(consoleLog).not.toHaveBeenCalledWith("click", "First");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes and returns focus to the anchor on Escape", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuFixture);

    const trigger = screen.getByRole("button", { name: "Trigger" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("close", {
      trigger: "escape-key",
    });
  });

  it("closes on outside click without returning focus", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    await user.click(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("close", {
      trigger: "outside-click",
    });
  });
});
