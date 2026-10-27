import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import PaginationNav from "./PaginationNav.test.svelte";

/** Page numbers of the rendered page buttons, in DOM order. */
function renderedPages(container: HTMLElement) {
  return Array.from(container.querySelectorAll("button[data-page]")).map(
    (button) => Number(button.getAttribute("data-page")),
  );
}

/** "first-last" of each overflow select's options, in DOM order. */
function overflowRanges(container: HTMLElement) {
  return Array.from(container.querySelectorAll("select")).map((select) => {
    const pages = Array.from(select.querySelectorAll("option[data-page]")).map(
      (option) => option.getAttribute("data-page"),
    );
    return `${pages[0]}-${pages[pages.length - 1]}`;
  });
}

describe("PaginationNav", () => {
  it("should render with default props", () => {
    render(PaginationNav);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bx--pagination-nav");
    expect(nav).toHaveAttribute("aria-label", "pagination");

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--pagination-nav__list");
  });

  it("should render correct number of pages", () => {
    render(PaginationNav, {
      props: { total: 5 },
    });

    const pageItems = screen.getAllByRole("listitem");
    expect(pageItems.length).toBe(7); // 5 pages + 2 navigation buttons
  });

  it("should handle custom shown pages", () => {
    const { container } = render(PaginationNav, {
      props: { total: 20, shown: 5 },
    });

    const pages = Array.from(
      container.querySelectorAll("button[data-page]"),
    ).map((button) => Number(button.getAttribute("data-page")));

    // `shown` counts the overflow too: 1, 2, 3, overflow, 20.
    expect(pages).toEqual([1, 2, 3, 20]);
    // Only the back overflow exists at page 1.
    expect(screen.getAllByLabelText("Select page number")).toHaveLength(1);
    // Previous, Next, the four page items and the overflow.
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("should disable previous button on first page", () => {
    render(PaginationNav, {
      props: { page: 1 },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(PaginationNav, {
      props: { page: 10, total: 10 },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    expect(nextButton).toBeDisabled();
  });

  it("should enable navigation buttons when looping", () => {
    render(PaginationNav, {
      props: { loop: true, page: 1, total: 10 },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("should support custom button text", () => {
    render(PaginationNav, {
      props: {
        backwardText: "Previous",
        forwardText: "Next",
      },
    });

    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it.each([
    ["top", ["bx--btn--icon-only--top", "bx--btn--icon-only--top"]],
    ["outside", ["bx--btn--icon-only--left", "bx--btn--icon-only--right"]],
    ["inside", ["bx--btn--icon-only--right", "bx--btn--icon-only--left"]],
  ] as const)("should support %s position", (position, [prev, next]) => {
    render(PaginationNav, {
      props: { tooltipPosition: position },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    expect(prevButton).toHaveClass("bx--tooltip--align-center");
    expect(prevButton).toHaveClass(prev);

    expect(nextButton).toHaveClass("bx--tooltip--align-center");
    expect(nextButton).toHaveClass(next);
  });

  it("should emit change event when clicking a page", async () => {
    const onChange = vi.fn();
    render(PaginationNav, { props: { onChange } });

    const pageButton = screen.getByRole("button", { name: /2/ });
    await user.click(pageButton);
    expect(onChange).toHaveBeenCalledWith({ page: 2 });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(onChange).toHaveBeenCalledWith({ page: 3 });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevButton);
    expect(onChange).toHaveBeenCalledWith({ page: 2 });
  });

  it("should announce current 1-based page in the live region", async () => {
    render(PaginationNav, { props: { page: 1, total: 10 } });
    expect(screen.getByText("Page 1 of 10")).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(screen.getByText("Page 2 of 10")).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevButton);
    expect(screen.getByText("Page 1 of 10")).toBeInTheDocument();
  });

  it("names the current page like any other, leaving aria-current to mark it", () => {
    render(PaginationNav, {
      props: { page: 3, total: 5 },
    });

    const activeButton = screen.getByRole("button", { current: "page" });
    expect(activeButton).toHaveAttribute("data-page", "3");
    expect(activeButton).toHaveAccessibleName("Page 3");
  });

  it("clamps the page when total shrinks below it", async () => {
    const { rerender } = render(PaginationNav, {
      props: { page: 15, total: 20 },
    });

    await rerender({ total: 5 });

    expect(screen.getByText("Page 5 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { current: "page" })).toHaveAttribute(
      "data-page",
      "5",
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("should render the correct page window when both front and back overflow", () => {
    const { container } = render(PaginationNav, {
      props: { total: 100, shown: 10, page: 50 },
    });

    const pageButtons = container.querySelectorAll("button[data-page]");
    const pages = Array.from(pageButtons).map((button) =>
      Number(button.getAttribute("data-page")),
    );

    // First page, the window around the current page (bounded by
    // `shown`), and the last page — with overflow selects in between.
    expect(pages).toEqual([1, 48, 49, 50, 51, 52, 53, 100]);
  });

  it("wraps from the first page to the last and back when looping", async () => {
    const onChange = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(PaginationNav, {
      props: { loop: true, page: 1, total: 5, onChange, onPrevious, onNext },
    });

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPrevious).toHaveBeenCalledWith({ page: 5 });
    expect(onChange).toHaveBeenLastCalledWith({ page: 5 });
    expect(screen.getByText("Page 5 of 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onNext).toHaveBeenCalledWith({ page: 1 });
    expect(onChange).toHaveBeenLastCalledWith({ page: 1 });
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
  });

  it.each([
    { shown: 4, page: 10, pages: [10, 20], overflows: ["1-9", "11-19"] },
    { shown: 4, page: 19, pages: [18, 19, 20], overflows: ["1-17"] },
    { shown: 3, page: 10, pages: [10, 20], overflows: ["1-9", "11-19"] },
    { shown: 5, page: 19, pages: [1, 18, 19, 20], overflows: ["2-17"] },
  ])(
    "lists pages $pages and overflows $overflows for page $page shown $shown",
    ({ shown, page, pages, overflows }) => {
      const { container } = render(PaginationNav, {
        props: { total: 20, shown, page },
      });

      expect(renderedPages(container)).toEqual(pages);
      expect(overflowRanges(container)).toEqual(overflows);
    },
  );

  it("reaches every page and marks exactly one active at every window size", () => {
    for (let total = 1; total <= 9; total++) {
      for (let shown = 1; shown <= 6; shown++) {
        for (let page = 1; page <= total; page++) {
          const { container, unmount } = render(PaginationNav, {
            props: { total, shown, page },
          });

          const pages = renderedPages(container);
          const overflow = Array.from(
            container.querySelectorAll("select option[data-page]"),
          ).map((option) => Number(option.getAttribute("data-page")));
          const where = `total ${total}, shown ${shown}, page ${page}`;

          expect([where, pages]).toEqual([
            where,
            [...new Set(pages)].sort((a, b) => a - b),
          ]);
          expect([
            where,
            [...pages, ...overflow].sort((a, b) => a - b),
          ]).toEqual([where, Array.from({ length: total }, (_, i) => i + 1)]);
          expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
          expect(
            container
              .querySelector("[aria-current]")
              ?.getAttribute("data-page"),
          ).toBe(String(page));
          unmount();
        }
      }
    }
  });

  it("should handle overflow selection", async () => {
    const onChange = vi.fn();
    render(PaginationNav, {
      props: { total: 100, shown: 5, onChange },
    });

    const overflowIndicator = screen.getByLabelText("Select page number");

    await user.selectOptions(overflowIndicator, "4");

    expect(onChange).toHaveBeenCalledWith({ page: 4 });
    expect(onChange).toHaveBeenCalledTimes(1);

    await user.selectOptions(overflowIndicator, "50");
    expect(onChange).toHaveBeenCalledWith({ page: 50 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
