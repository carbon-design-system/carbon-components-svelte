import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavMenuFocus from "./HeaderNavMenuFocus.test.svelte";

const trigger = () => screen.getByRole("menuitem", { name: "Products" });

describe("HeaderNavMenu Enter", () => {
  it("closes the menu when Enter activates an item", async () => {
    render(HeaderNavMenuFocus);

    trigger().focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Compute" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the menu when a click activates an item", async () => {
    render(HeaderNavMenuFocus);

    await user.click(trigger());
    await user.click(screen.getByRole("menuitem", { name: "Storage" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles the menu when Enter is pressed on the trigger", async () => {
    render(HeaderNavMenuFocus);

    trigger().focus();
    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    trigger().focus();
    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });
});
