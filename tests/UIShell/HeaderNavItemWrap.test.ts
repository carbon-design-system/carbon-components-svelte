import { render, screen } from "@testing-library/svelte";
import HeaderNavContent from "./HeaderNavContent.test.svelte";

const label = (name: string) =>
  screen.getByRole("menuitem", { name }).querySelector("span");

describe("HeaderNavItem label", () => {
  it("truncates top-level items but lets menu items wrap", () => {
    render(HeaderNavContent);
    expect(label("Catalog")).toHaveClass("bx--text-truncate--end");
    expect(
      label("Cloud Object Storage and Data Lake Archival"),
    ).not.toHaveClass("bx--text-truncate--end");
  });
});
