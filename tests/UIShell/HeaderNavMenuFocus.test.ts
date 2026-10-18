import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavMenuFocus from "./HeaderNavMenubar.test.svelte";

const props = {
  items: [
    {
      text: "Products",
      items: [{ text: "Compute" }, { text: "Storage" }],
    },
    { text: "Pricing" },
  ],
  after: "input",
} as const;

const trigger = () => screen.getByRole("menuitem", { name: "Products" });
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNavMenu focus on close", () => {
  it("lets Tab move past the last item instead of pulling focus back", async () => {
    render(HeaderNavMenuFocus, { props });

    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{End}");
    expect(item("Storage")).toHaveFocus();

    // The menubar is one Tab stop, so Tab leaves it rather than landing on
    // the next top-level item.
    await user.tab();
    expect(screen.getByRole("textbox", { name: "Search docs" })).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps focus on a field clicked while the last item is focused", async () => {
    render(HeaderNavMenuFocus, { props });

    trigger().focus();
    await user.keyboard("{ArrowUp}");
    expect(item("Storage")).toHaveFocus();

    const field = screen.getByRole("textbox", { name: "Search docs" });
    await user.click(field);
    expect(field).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
