import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContainedListItemSelected from "./ContainedListItem.selected.test.svelte";

describe("ContainedListItem selected", () => {
  it("marks the selected interactive item as current", () => {
    render(ContainedListItemSelected);

    const test = screen.getByRole("button", { name: "Test" });
    expect(test).toHaveAttribute("aria-current", "true");
    expect(test.closest("li")).toHaveClass("bx--contained-list-item--selected");
    expect(screen.getByRole("button", { name: "Build" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("moves the current item when another is chosen", async () => {
    render(ContainedListItemSelected);

    await user.click(screen.getByRole("button", { name: "Deploy" }));

    expect(screen.getByRole("button", { name: "Deploy" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Test" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks a selected link as current", () => {
    render(ContainedListItemSelected);

    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("ignores selected on a static item", () => {
    render(ContainedListItemSelected);

    const item = screen.getByText("Static").closest("li");
    expect(item).not.toHaveClass("bx--contained-list-item--selected");
    expect(item?.querySelector("[aria-current]")).toBeNull();
  });
});
