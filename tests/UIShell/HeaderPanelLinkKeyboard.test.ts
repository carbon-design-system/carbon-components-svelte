import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderPanelLinkKeyboard from "./HeaderPanelLinkKeyboard.test.svelte";

const item = (name: string) =>
  screen.getByRole(name === "Beta" ? "button" : "link", { name });

describe("HeaderPanelLink keyboard navigation", () => {
  it("moves focus with ArrowDown and ArrowUp, wrapping at the ends", async () => {
    render(HeaderPanelLinkKeyboard);

    item("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Beta")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Gamma")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Alpha")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Gamma")).toHaveFocus();
  });
});
