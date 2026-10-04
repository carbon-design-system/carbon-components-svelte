import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderMenuKeyboardOpen from "./HeaderMenuKeyboardOpen.test.svelte";

describe.each([
  { trigger: "Acme Corp", first: "Acme Corp", last: "Globex" },
  { trigger: "Profile", first: "Settings", last: "Log out" },
])("$trigger opened from the keyboard", ({ trigger, first, last }) => {
  const button = () => screen.getByRole("button", { name: trigger });
  const item = (name: string) =>
    screen
      .getAllByText(name)
      .find((node) => node.closest(".bx--profile-menu"))
      ?.closest("a, button");

  it("focuses the first item on Enter", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{Enter}");
    expect(item(first)).toHaveFocus();
  });

  it("focuses the first item on ArrowDown", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{ArrowDown}");
    expect(item(first)).toHaveFocus();
  });

  it("focuses the last item on ArrowUp", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{ArrowUp}");
    expect(item(last)).toHaveFocus();
  });
});

describe("HeaderSwitcher trigger", () => {
  it("controls its panel without promising a menu", async () => {
    render(HeaderMenuKeyboardOpen);
    const button = screen.getByRole("button", { name: "Acme Corp" });
    expect(button).not.toHaveAttribute("aria-haspopup");

    await user.click(button);
    const panel = document.getElementById(
      button.getAttribute("aria-controls") ?? "",
    );
    expect(panel).toHaveClass("bx--header-switcher__menu");
  });
});
