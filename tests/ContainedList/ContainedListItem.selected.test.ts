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

  it("moves the selected fill with the click", async () => {
    render(ContainedListItemSelected);

    const build = screen.getByRole("button", { name: "Build" });
    const test = screen.getByRole("button", { name: "Test" });
    expect(test.closest("li")).toHaveClass("bx--contained-list-item--selected");
    expect(build.closest("li")).not.toHaveClass(
      "bx--contained-list-item--selected",
    );

    await user.click(build);

    expect(build.closest("li")).toHaveClass(
      "bx--contained-list-item--selected",
    );
    expect(test.closest("li")).not.toHaveClass(
      "bx--contained-list-item--selected",
    );
  });

  it("ignores selected on an item that is not clickable", () => {
    render(ContainedListItemSelected);

    const notes = screen
      .getByText("Notes")
      .closest(".bx--contained-list-item__content");
    assert(notes);
    expect(notes).not.toHaveAttribute("aria-current");
    expect(notes.closest("li")).not.toHaveClass(
      "bx--contained-list-item--selected",
    );
  });
});
