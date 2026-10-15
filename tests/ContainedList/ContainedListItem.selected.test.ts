import { render, screen } from "@testing-library/svelte";
import ContainedListItemSelected from "./ContainedListItem.selected.test.svelte";

describe("ContainedListItem selected", () => {
  it("marks the selected item, button or link, as current", () => {
    render(ContainedListItemSelected);

    expect(screen.getByRole("button", { name: "Test" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
