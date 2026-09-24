import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenuFocusReturn from "./ContextMenuFocusReturn.test.svelte";

describe("ContextMenu focus return", () => {
  it("should return focus to the opener when closed via Escape", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await user.pointer({
      target: host,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(host).toHaveFocus();
  });

  it("should return focus to the opener when closed by selecting an option", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await user.pointer({
      target: host,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });

    await user.click(screen.getByText("Option 1"));
    expect(host).toHaveFocus();
  });

  it("should release focus when the opener can't take it", async () => {
    render(ContextMenuFocusReturn);

    const nonFocusable = screen.getByText("Non-focusable target");
    await user.pointer({
      target: nonFocusable,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryAllByRole("menuitem")).not.toContain(
      document.activeElement,
    );
  });

  it("should return focus to the enclosing button when an icon is right-clicked", async () => {
    const { container } = render(ContextMenuFocusReturn);

    const iconHost = container.querySelector<HTMLElement>("#icon-host");
    assert(iconHost);
    const icon = container.querySelector<SVGElement>("#icon");
    assert(icon);
    await user.pointer({
      target: icon,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(iconHost).toHaveFocus();
  });

  it("should return focus to the button that opened the menu programmatically", async () => {
    render(ContextMenuFocusReturn);

    // Open and close once via right click on the host, so `openDetail`
    // holds a stale reference to it.
    const host = screen.getByRole("button", { name: "Host" });
    await user.pointer({
      target: host,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });
    await user.keyboard("{Escape}");
    expect(host).toHaveFocus();

    const trigger = screen.getByRole("button", { name: "Open via code" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
