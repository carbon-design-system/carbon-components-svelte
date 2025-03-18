import { render, screen, within } from "@testing-library/svelte";
import { user } from "../setup-tests";
import PaginationNav from "./PaginationNav.test.svelte";

describe("PaginationNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(PaginationNav);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bx--pagination-nav");
    expect(nav).toHaveAttribute("aria-label", "pagination");

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--pagination-nav__list");

    expect(screen.getByText("Previous page")).toBeInTheDocument();
    expect(screen.getByText("Next page")).toBeInTheDocument();

    const pageItems = screen.getAllByRole("listitem");
    expect(pageItems.length).toBeGreaterThan(0);
  });

  it("should render correct number of pages", () => {
    render(PaginationNav, {
      props: { total: 5 },
    });

    const pageItems = screen.getAllByRole("listitem");
    expect(pageItems.length).toBe(7); // 5 pages + 2 navigation buttons
  });

  it("should show correct active page", () => {
    render(PaginationNav, {
      props: { page: 3 },
    });

    const listItems = screen.getAllByRole("listitem");
    expect(within(listItems[3]).getByRole("button")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("should handle custom shown pages", () => {
    render(PaginationNav, {
      props: { total: 20, shown: 5 },
    });

    const pageItems = screen.getAllByRole("listitem");
    // Should show 5 pages + 2 navigation buttons
    expect(pageItems.length).toBe(7);
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

  test.each([
    ["top", ["bx--btn--icon-only--top", "bx--btn--icon-only--top"]],
    ["right", ["bx--btn--icon-only--right", "bx--btn--icon-only--right"]],
    ["bottom", ["bx--btn--icon-only--bottom", "bx--btn--icon-only--bottom"]],
    ["left", ["bx--btn--icon-only--left", "bx--btn--icon-only--left"]],
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
    const consoleLog = vi.spyOn(console, "log");
    render(PaginationNav);

    const pageButton = screen.getByRole("button", { name: /2/ });
    await user.click(pageButton);
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 3 });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevButton);
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });
  });

  it("should handle overflow selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PaginationNav, {
      props: { total: 100, shown: 5 },
    });

    const overflowIndicator = screen.getByLabelText("Select Page number");
    expect(overflowIndicator).toBeInTheDocument();

    await user.selectOptions(overflowIndicator, "4");

    expect(consoleLog).toHaveBeenCalledWith("change", { page: 4 });
    expect(consoleLog).toHaveBeenCalledTimes(1);

    await user.selectOptions(overflowIndicator, "50");
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 50 });
    expect(consoleLog).toHaveBeenCalledTimes(2);
  });
});
