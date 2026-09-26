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
    expect(node.querySelectorAll(".bx--skeleton__text")).toHaveLength(2);
    expect(node.querySelector(".bx--skeleton__heading")).not.toBeNull();
    expect(node.querySelector(".bx--breadcrumb")).toBeNull();
    expect(node.querySelector(".bx--btn")).toBeNull();
    expect(node.querySelector(".bx--tabs")).toBeNull();
  });

  it("renders breadcrumb, action, and tab placeholders on request", () => {
    render(PageHeaderSkeleton);

    const node = screen.getByTestId("full");
    expect(
      node.querySelector(".bx--page-header__breadcrumb-row .bx--skeleton"),
    ).not.toBeNull();
    expect(
      node.querySelector(".bx--page-header__actions .bx--btn.bx--skeleton"),
    ).not.toBeNull();
    expect(
      node.querySelectorAll(
        ".bx--page-header__tabs-row .bx--tabs--scrollable__nav-item",
      ),
    ).toHaveLength(3);
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

    expect(
      screen.getByTestId("no-subtitle").querySelectorAll(".bx--skeleton__text"),
    ).toHaveLength(1);
  });
});
