import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Fixture from "./HeaderNavTypeahead.test.svelte";

const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNav typeahead", () => {
  it("focuses the next top-level item starting with the typed letter", async () => {
    render(Fixture);

    item("Home").focus();
    await user.keyboard("t");
    expect(item("Tools")).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await user.keyboard("d");
    expect(item("Docs")).toHaveFocus();
  });

  it("focuses the next menu item starting with the typed letter", async () => {
    render(Fixture);

    item("Tools").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Alpha")).toHaveFocus();

    await user.keyboard("b");
    expect(item("Beta")).toHaveFocus();
    // Typing after the reset window starts a new query.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await user.keyboard("b");
    expect(item("Bravo")).toHaveFocus();
    expect(item("Tools")).toHaveAttribute("aria-expanded", "true");
  });

  it("matches multiple typed letters", async () => {
    render(Fixture);

    item("Tools").focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("br");
    expect(item("Bravo")).toHaveFocus();
  });
});
