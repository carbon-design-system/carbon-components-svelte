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

  it.each([
    ["grid", false],
    ["full-width", true],
  ])(
    "marks the %s header for grid alignment and renders Rows in the body",
    (testId, hasFullWidth) => {
      render(PageHeaderGrid);

      const header = screen.getByTestId(testId);
      expect(header).toHaveClass("bx--page-header--grid");
      expect(
        header.classList.contains("bx--page-header--grid-full-width"),
      ).toBe(hasFullWidth);

      const body = header.nextElementSibling;
      expect(body).toHaveClass("bx--page-header__body");
      expect(body?.firstElementChild).toHaveClass("bx--row");
      expect(body).toHaveTextContent("Column content");
    },
  );
});
