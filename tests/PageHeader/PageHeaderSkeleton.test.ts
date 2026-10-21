import { render, screen } from "@testing-library/svelte";
import PageHeaderSkeleton from "./PageHeaderSkeleton.test.svelte";

describe("PageHeaderSkeleton", () => {
  it("renders a title and subtitle placeholder by default", () => {
    render(PageHeaderSkeleton);

    const node = screen.getByTestId("default");
    expect(node).toHaveClass("bx--page-header");
    expect(node).toHaveClass("bx--page-header-skeleton");
    expect(node).toHaveClass("bx--page-header--divider");
    expect(node).toHaveClass("bx--box-fill-background");
    const lines = node.querySelectorAll(".bx--page-header__skeleton-line");
    expect(lines).toHaveLength(2);
    // Each a line of the header's own type, holding a bar.
    expect(lines[0]).toHaveClass("bx--type-heading-04");
    expect(lines[1]).toHaveClass("bx--type-body-compact-01");
    for (const line of lines) {
      expect(
        line.querySelector(".bx--page-header__skeleton-bar"),
      ).not.toBeNull();
    }
  });

  it.each([
    ["breadcrumb", ".bx--page-header__breadcrumb-row .bx--skeleton", 1],
    ["action", ".bx--page-header__actions .bx--btn.bx--skeleton", 1],
    ["tab", ".bx--page-header__tabs-row .bx--tabs--scrollable__nav-item", 3],
  ])("renders %s placeholders only on request", (_, selector, count) => {
    render(PageHeaderSkeleton);

    expect(screen.getByTestId("default").querySelector(selector)).toBeNull();
    expect(screen.getByTestId("full").querySelectorAll(selector)).toHaveLength(
      count,
    );
  });

  it("matches the header's grid, fill, and divider", () => {
    render(PageHeaderSkeleton);

    const node = screen.getByTestId("full");
    expect(node).toHaveClass("bx--page-header--grid");
    expect(node).toHaveClass("bx--box-fill-layer-01");
    expect(node).not.toHaveClass("bx--page-header--divider");
  });

  it("omits the subtitle placeholder and matches size", () => {
    render(PageHeaderSkeleton);

    expect(screen.getByTestId("no-subtitle")).toHaveClass(
      "bx--page-header--sm",
    );

    const lines = screen
      .getByTestId("no-subtitle")
      .querySelectorAll(".bx--page-header__skeleton-line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveClass("bx--type-heading-03");
  });
});
