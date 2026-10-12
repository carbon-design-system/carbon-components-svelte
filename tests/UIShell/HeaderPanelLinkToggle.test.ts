import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelLinkToggle from "./HeaderPanelLinkToggle.test.svelte";

describe("HeaderPanelLink when href is toggled", () => {
  it("keeps arrow navigation pointing at the rendered element", async () => {
    const { component } = render(HeaderPanelLinkToggle);

    // Anchor to button.
    component.href = undefined;
    await tick();
    const alphaButton = screen.getByRole("button", { name: "Alpha" });

    screen.getByRole("button", { name: "Beta" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(alphaButton).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Beta" })).toHaveFocus();

    // And back to an anchor.
    component.href = "#alpha";
    await tick();
    const alphaLink = screen.getByRole("link", { name: "Alpha" });

    await user.keyboard("{ArrowUp}");
    expect(alphaLink).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("link", { name: "Gamma" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(alphaLink).toHaveFocus();
  });
});
