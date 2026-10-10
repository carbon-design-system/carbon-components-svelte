import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavMenuFocus from "./HeaderNavMenuFocus.test.svelte";

const trigger = () => screen.getByRole("menuitem", { name: "Products" });
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNavMenu focus on close", () => {
  it("lets Tab move past the last item instead of pulling focus back", async () => {
    render(HeaderNavMenuFocus);

    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    expect(item("Storage")).toHaveFocus();

    await user.tab();
    expect(item("Pricing")).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps focus on a field clicked while the last item is focused", async () => {
    render(HeaderNavMenuFocus);

    trigger().focus();
    await user.keyboard("{ArrowUp}");
    expect(item("Storage")).toHaveFocus();

    const field = screen.getByRole("textbox", { name: "Search docs" });
    await user.click(field);
    expect(field).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("still returns focus to the trigger on Escape", async () => {
    render(HeaderNavMenuFocus);

    trigger().focus();
    await user.keyboard("{ArrowDown}{Escape}");
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
