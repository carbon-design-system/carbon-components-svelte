import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContainedListItemSelected from "./ContainedListItem.selected.test.svelte";

describe("ContainedListItem selected", () => {
  it("marks only the selected item, button or link, as current", async () => {
    render(ContainedListItemSelected);

    const build = screen.getByRole("button", { name: "Build" });
    const test = screen.getByRole("button", { name: "Test" });
    const deploy = screen.getByRole("button", { name: "Deploy" });

    expect(test).toHaveAttribute("aria-current", "true");
    expect(build).not.toHaveAttribute("aria-current");
    expect(deploy).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await user.click(build);

    expect(build).toHaveAttribute("aria-current", "true");
    expect(test).not.toHaveAttribute("aria-current");
    expect(deploy).not.toHaveAttribute("aria-current");
  });
});
