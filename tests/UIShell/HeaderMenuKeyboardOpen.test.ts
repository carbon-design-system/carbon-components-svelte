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
