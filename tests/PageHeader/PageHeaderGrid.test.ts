import { render, screen } from "@testing-library/svelte";
import PageHeaderGrid from "./PageHeaderGrid.test.svelte";

describe("PageHeader grid", () => {
  it("wraps the header rows in a content element", () => {
    render(PageHeaderGrid);

    const header = screen.getByTestId("no-grid");
    expect(header.children).toHaveLength(1);
    expect(header.firstElementChild).toHaveClass("bx--page-header__content");
    expect(header).not.toHaveClass("bx--page-header--grid");
  });

  it("marks the header for grid alignment and renders Rows in the body", () => {
    render(PageHeaderGrid);

    const header = screen.getByTestId("grid");
    expect(header).toHaveClass("bx--page-header--grid");
    expect(header).not.toHaveClass("bx--page-header--grid-full-width");

    const body = header.nextElementSibling;
    expect(body).toHaveClass("bx--page-header__body");
    expect(body?.firstElementChild).toHaveClass("bx--row");
    expect(body).toContainElement(screen.getByTestId("column"));
  });

  it("adds the full-width modifier", () => {
    render(PageHeaderGrid);

    const header = screen.getByTestId("full-width");
    expect(header).toHaveClass("bx--page-header--grid");
    expect(header).toHaveClass("bx--page-header--grid-full-width");
  });
});
