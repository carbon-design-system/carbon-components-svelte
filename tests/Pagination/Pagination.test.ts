import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import Pagination from "./Pagination.test.svelte";
import PaginationPageSelectSlot from "./PaginationPageSelectSlot.test.svelte";

describe("Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2528
  it("does not fire update event on initial render", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { totalItems: 100, page: 1, pageSize: 10 },
    });

    expect(consoleLog).not.toHaveBeenCalledWith("update", expect.anything());
  });

  it("should render with default props", () => {
    render(Pagination);

    expect(screen.getByText("Items per page:")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next page" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeInTheDocument();
  });

  it("defaults to the md size class", () => {
    const { container } = render(Pagination);

    const pagination = container.querySelector(".bx--pagination");
    expect(pagination).toHaveClass("bx--pagination--md");
  });

  it.each(["xs", "sm", "md", "lg"] as const)(
    "applies the %s size class",
    (size) => {
      const { container } = render(Pagination, { props: { size } });

      const pagination = container.querySelector(".bx--pagination");
      expect(pagination).toHaveClass(`bx--pagination--${size}`);
    },
  );

  it("should render with custom total items", () => {
    render(Pagination, {
      props: { totalItems: 102 },
    });

    expect(screen.getByText("1–10 of 102 items")).toBeInTheDocument();
  });

  it("should handle custom page sizes", () => {
    render(Pagination, {
      props: {
        totalItems: 102,
        pageSizes: [10, 15, 20],
        pageSize: 15,
      },
    });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    expect(select).toHaveValue("15");

    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("10");
    expect(options[1]).toHaveTextContent("15");
    expect(options[2]).toHaveTextContent("20");
  });

  it("should handle page navigation", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { totalItems: 102, page: 1 },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(consoleLog).toHaveBeenCalledWith("next", { page: 2 });
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevButton);
    expect(consoleLog).toHaveBeenCalledWith("previous", { page: 1 });
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 1 });
  });

  it("should handle page size changes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: {
        totalItems: 102,
        pageSizes: [10, 15, 20],
      },
    });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    await user.selectOptions(select, "15");

    expect(consoleLog).toHaveBeenCalledWith("change", { pageSize: 15 });
    expect(consoleLog).toHaveBeenCalledWith("update", {
      pageSize: 15,
      page: 1,
    });
  });

  it("should handle page selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { totalItems: 102, pageSizes: [5, 10, 15] },
    });

    const pageSelect = screen.getAllByRole("combobox");
    await user.selectOptions(pageSelect[0], "5");

    expect(consoleLog).toHaveBeenCalledWith("change", { pageSize: 5 });
    expect(consoleLog).toHaveBeenCalledWith("update", { pageSize: 5, page: 1 });
  });

  it("should disable navigation buttons when disabled", () => {
    render(Pagination, {
      props: { disabled: true },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("should handle custom button text", () => {
    render(Pagination, {
      props: {
        forwardText: "Next",
        backwardText: "Previous",
      },
    });

    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("should handle custom items per page text", () => {
    render(Pagination, {
      props: {
        itemsPerPageText: "Show:",
      },
    });

    expect(screen.getByText("Show:")).toBeInTheDocument();
  });

  it("should handle disabled page input", () => {
    render(Pagination, {
      props: { pageInputDisabled: true },
    });

    expect(
      screen.queryByRole("combobox", { name: "Page number" }),
    ).not.toBeInTheDocument();
  });

  it("should handle disabled page size input", () => {
    render(Pagination, {
      props: { pageSizeInputDisabled: true },
    });

    expect(
      screen.queryByRole("combobox", { name: "Items per page:" }),
    ).not.toBeInTheDocument();
  });

  it("hides selects in simple mode and shows page status text", () => {
    const { container } = render(Pagination, {
      props: { simple: true, totalItems: 102 },
    });

    const pagination = container.querySelector(".bx--pagination");
    expect(pagination).toHaveClass("bx--pagination--simple");
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.getByText("page 1 of 11 pages")).toBeInTheDocument();
    expect(screen.queryByText("1–10 of 102 items")).not.toBeInTheDocument();
  });

  it("navigates pages in simple mode", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { simple: true, totalItems: 102, page: 1 },
    });

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(consoleLog).toHaveBeenCalledWith("next", { page: 2 });
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });
    expect(screen.getByText("page 2 of 11 pages")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(consoleLog).toHaveBeenCalledWith("previous", { page: 1 });
    expect(screen.getByText("page 1 of 11 pages")).toBeInTheDocument();
  });

  it("should handle unknown pages", () => {
    render(Pagination, {
      props: { pagesUnknown: true },
    });

    expect(screen.getByText("1–10 items")).toBeInTheDocument();
    expect(screen.getByText("page 1")).toBeInTheDocument();
  });

  // When `pagesUnknown` is true, the total number of pages is unknown, so the
  // forward button should remain enabled at page 1 — otherwise the user can
  // never advance past the first page.
  it("should not disable the forward button at page 1 when pagesUnknown is true", () => {
    render(Pagination, {
      props: { pagesUnknown: true, page: 1 },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    const prevButton = screen.getByRole("button", { name: "Previous page" });

    expect(nextButton).not.toBeDisabled();
    expect(prevButton).toBeDisabled();
  });

  it("should advance the page when pagesUnknown is true", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { pagesUnknown: true, page: 1 },
    });

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(consoleLog).toHaveBeenCalledWith("next", { page: 2 });
    expect(screen.getByText("page 2")).toBeInTheDocument();
  });

  it("should allow overriding forwardButtonDisabled", () => {
    render(Pagination, {
      props: {
        pagesUnknown: true,
        page: 1,
        forwardButtonDisabled: true,
      },
    });

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("should allow overriding backButtonDisabled", () => {
    render(Pagination, {
      props: {
        totalItems: 102,
        page: 2,
        backButtonDisabled: true,
      },
    });

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  });

  it("should update when page or pageSize changes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { totalItems: 102, pageSizes: [5, 10, 15] },
    });

    // Change page size
    const pageSizeSelect = screen.getAllByRole("combobox");
    await user.selectOptions(pageSizeSelect[0], "15");
    expect(consoleLog).toHaveBeenCalledWith("change", { pageSize: 15 });
    expect(consoleLog).toHaveBeenCalledWith("update", {
      pageSize: 15,
      page: 1,
    });

    // Change page
    const pageSelect = screen.getAllByRole("combobox");
    await user.selectOptions(pageSelect[1], "2");
    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });
    expect(consoleLog).toHaveBeenCalledWith("update", {
      pageSize: 15,
      page: 2,
    });
  });

  it("resets pageSize and page when an updated pageSizes array drops the current pageSize", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { rerender } = render(Pagination, {
      props: {
        page: 2,
        totalItems: 6,
        pageSize: 2,
        pageSizes: [2, 4],
      },
    });

    expect(screen.getByText("3–4 of 6 items")).toBeInTheDocument();
    consoleLog.mockClear();

    await rerender({ pageSizes: [3] });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    expect(select).toHaveValue("3");
    expect(screen.getByText("1–3 of 6 items")).toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("update", { pageSize: 3, page: 1 });
  });

  it("keeps pageSize as-is when it remains valid in an updated pageSizes array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { rerender } = render(Pagination, {
      props: {
        totalItems: 102,
        pageSize: 15,
        pageSizes: [10, 15, 20],
      },
    });

    consoleLog.mockClear();

    await rerender({ pageSizes: [10, 15] });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    expect(select).toHaveValue("15");
    expect(consoleLog).not.toHaveBeenCalledWith("update", expect.anything());
  });

  it("keeps an initial pageSize that is not in pageSizes", () => {
    render(Pagination, {
      props: {
        totalItems: 10,
        pageSize: 5,
        pageSizeInputDisabled: true,
      },
    });

    expect(screen.getByText("1–5 of 10 items")).toBeInTheDocument();
  });

  it("should handle edge cases", () => {
    render(Pagination, {
      props: {
        totalItems: 0,
        page: 1,
        pageSize: 10,
      },
    });

    expect(screen.getByText("0–0 of 0 items")).toBeInTheDocument();
  });

  it("renders a cap of 1000 page numbers by default", () => {
    render(Pagination, {
      props: { totalItems: 100_000 },
    });

    const pageNumbers = screen.getByLabelText(/Page number, of 10000 pages/);
    expect(pageNumbers).toHaveLength(1_000);
  });

  it("renders a custom page window", () => {
    render(Pagination, {
      props: { totalItems: 100_000, pageWindow: 100 },
    });

    const pageNumbers = screen.getByLabelText(/Page number, of 10000 pages/);
    expect(pageNumbers).toHaveLength(100);
  });

  it("caps total rendered page options at pageWindow when current page is in the middle", () => {
    render(Pagination, {
      props: { totalItems: 100_000, pageWindow: 100, page: 5000 },
    });

    const pageNumbers = screen.getByLabelText(/Page number, of 10000 pages/);
    expect(pageNumbers).toHaveLength(100);
  });

  it("formats larger numbers using `toLocaleString`", () => {
    render(Pagination, {
      props: { totalItems: 100_000 },
    });

    expect(screen.getByText(/1–10 of 100,000 items/)).toBeInTheDocument();
    expect(screen.getByText(/of 10,000 pages/)).toBeInTheDocument();
  });

  it("handles custom page text", () => {
    const props = {
      pagesUnknown: true,
      totalItems: 100_000,
      pageText: (page: number) => `Current page ${page}`,
    } satisfies ComponentProps<Pagination>;

    render(Pagination, { props });

    expect(screen.getByText(/Current page 1/)).toBeInTheDocument();
  });

  it("handles custom page range text", () => {
    const props = {
      totalItems: 100_000,
      pageRangeText: (current: number, total: number) =>
        `${current} of ${total}`,
    } satisfies ComponentProps<Pagination>;

    render(Pagination, { props });

    expect(screen.getByText(/1 of 10000/)).toBeInTheDocument();
  });

  it("handles custom page select label text", () => {
    const props = {
      totalItems: 40,
      pageSizes: [10, 20],
      pageSize: 10,
      page: 2,
      pageSelectLabelText: (total: number) =>
        `Página de ${total} ${total === 1 ? "página" : "páginas"}`,
    } satisfies ComponentProps<Pagination>;

    render(Pagination, { props });

    expect(screen.getByLabelText("Página de 4 páginas")).toBeInTheDocument();
  });

  it("handles custom item range text", () => {
    const props = {
      totalItems: 100_000,
      itemRangeText: (min: number, max: number, total: number) =>
        `${min}–${max} of ${total}`,
    } satisfies ComponentProps<Pagination>;

    render(Pagination, { props });

    expect(screen.getByText(/1–10 of 100000/)).toBeInTheDocument();
  });

  describe("nav button tooltip position", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("defaults nav button tooltips to the top position", async () => {
      render(Pagination, { props: { totalItems: 102, page: 2 } });

      const prevButton = screen.getByRole("button", { name: "Previous page" });
      await fireEvent.mouseEnter(prevButton);
      await vi.advanceTimersByTimeAsync(100);
      expect(document.querySelector("[data-direction]")).toHaveAttribute(
        "data-direction",
        "top",
      );
      await fireEvent.mouseLeave(prevButton);
      await vi.advanceTimersByTimeAsync(300);

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await fireEvent.mouseEnter(nextButton);
      await vi.advanceTimersByTimeAsync(100);
      expect(document.querySelector("[data-direction]")).toHaveAttribute(
        "data-direction",
        "top",
      );
    });

    it("allows overriding the backward and forward tooltip positions independently", async () => {
      render(Pagination, {
        props: {
          totalItems: 102,
          page: 2,
          backwardTextTooltipPosition: "bottom",
          forwardTextTooltipPosition: "right",
        },
      });

      const prevButton = screen.getByRole("button", { name: "Previous page" });
      await fireEvent.mouseEnter(prevButton);
      await vi.advanceTimersByTimeAsync(100);
      expect(document.querySelector("[data-direction]")).toHaveAttribute(
        "data-direction",
        "bottom",
      );
      await fireEvent.mouseLeave(prevButton);
      await vi.advanceTimersByTimeAsync(300);

      const nextButton = screen.getByRole("button", { name: "Next page" });
      await fireEvent.mouseEnter(nextButton);
      await vi.advanceTimersByTimeAsync(100);
      expect(document.querySelector("[data-direction]")).toHaveAttribute(
        "data-direction",
        "right",
      );
    });
  });

  it("should dispatch change event with new value, not previous value", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: { totalItems: 102, pageSizes: [10, 15, 20] },
    });

    const pageSizeSelect = screen.getByRole("combobox", {
      name: "Items per page:",
    });
    await user.selectOptions(pageSizeSelect, "15");

    expect(consoleLog).toHaveBeenCalledWith("change", { pageSize: 15 });

    const pageSelect = screen.getAllByRole("combobox")[1];
    await user.selectOptions(pageSelect, "2");

    expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });
  });

  it("should apply custom id", () => {
    render(Pagination, {
      props: { id: "custom-pagination-id" },
    });

    const pagination = document.getElementById("custom-pagination-id");
    expect(pagination).toBeInTheDocument();
  });

  it("derives select ids with semantic suffixes from the root id", () => {
    render(Pagination, {
      props: { id: "page-1", totalItems: 30, pageSizes: [10, 20] },
    });

    const sizeSelect = document.getElementById(
      "bx--pagination-select-page-1-sizes",
    );
    const pageSelect = document.getElementById(
      "bx--pagination-select-page-1-pages",
    );
    const sizeLabel = document.getElementById(
      "bx--pagination-select-page-1-sizes-label",
    );

    expect(sizeSelect).toBeInTheDocument();
    expect(pageSelect).toBeInTheDocument();
    expect(sizeLabel).toHaveAttribute(
      "for",
      "bx--pagination-select-page-1-sizes",
    );
    expect(
      document.getElementById("bx--pagination-select-page-12"),
    ).not.toBeInTheDocument();
  });

  it("should apply custom class", () => {
    render(Pagination, {
      props: { customClass: "custom-pagination" },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    const pagination = nextButton.closest(".bx--pagination");
    assert(pagination);
    expect(pagination).toHaveClass("custom-pagination");
  });

  describe("dynamicPageSizes", () => {
    it("should show all page sizes when dynamicPageSizes is false (default)", () => {
      render(Pagination, {
        props: {
          totalItems: 9,
          pageSizes: [5, 10, 15],
          dynamicPageSizes: false,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("5");
      expect(options[1]).toHaveTextContent("10");
      expect(options[2]).toHaveTextContent("15");
    });

    it("should filter out redundant page sizes when dynamicPageSizes is true", () => {
      render(Pagination, {
        props: {
          totalItems: 9,
          pageSizes: [5, 10, 15],
          dynamicPageSizes: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("5");
      expect(options[1]).toHaveTextContent("10");
    });

    it("should keep only the first page size when totalItems is 0", () => {
      render(Pagination, {
        props: {
          totalItems: 0,
          pageSizes: [5, 10, 15],
          dynamicPageSizes: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("5");
    });

    it("should show all page sizes when all are smaller than totalItems", () => {
      render(Pagination, {
        props: {
          totalItems: 100,
          pageSizes: [5, 10, 15],
          dynamicPageSizes: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("5");
      expect(options[1]).toHaveTextContent("10");
      expect(options[2]).toHaveTextContent("15");
    });

    it("should show only first page size when all are larger than totalItems", () => {
      render(Pagination, {
        props: {
          totalItems: 3,
          pageSizes: [5, 10, 15],
          dynamicPageSizes: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("5");
    });

    it("should include the exact matching page size", () => {
      render(Pagination, {
        props: {
          totalItems: 10,
          pageSizes: [5, 10, 15, 20],
          dynamicPageSizes: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      const options = within(select).getAllByRole("option");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("5");
      expect(options[1]).toHaveTextContent("10");
    });
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1634
  it("should not trigger multiple updates when pageSize changes on last page", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Pagination, {
      props: {
        totalItems: 35,
        page: 4,
        pageSize: 10,
        pageSizes: [10, 15, 20],
      },
    });

    consoleLog.mockClear();

    // Change page size from 10 to 15 while on page 4
    // This should adjust page to 3 (since totalPages becomes 3)
    // but should only trigger one update cycle.
    const pageSizeSelect = screen.getByRole("combobox", {
      name: "Items per page:",
    });
    await user.selectOptions(pageSizeSelect, "15");

    expect(consoleLog).toHaveBeenCalledWith("change", { pageSize: 15 });
    expect(consoleLog).toHaveBeenCalledWith("update", {
      pageSize: 15,
      page: 3,
    });

    const updateCalls = consoleLog.mock.calls.filter(
      (call) =>
        call[0] === "update" && call[1].pageSize === 15 && call[1].page === 3,
    );
    expect(updateCalls.length).toBe(1);
  });

  describe("pageSelect slot", () => {
    it("replaces the default page select and exposes slot props", () => {
      render(PaginationPageSelectSlot, {
        props: { totalItems: 40, pageSizes: [10] },
      });

      expect(
        screen.queryByRole("combobox", { name: /Page number/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("page-select-label")).toHaveTextContent(
        "Page number, of 4 pages",
      );
      expect(screen.getByTestId("current-page")).toHaveTextContent("1");
      expect(screen.getByTestId("total-pages")).toHaveTextContent("4");
      expect(screen.getByTestId("current-page-size")).toHaveTextContent("10");
    });

    it("calls onSetPage to navigate and dispatches change", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(PaginationPageSelectSlot, {
        props: { totalItems: 40, pageSizes: [10] },
      });

      await user.click(screen.getByText("Go to 3"));

      expect(screen.getByTestId("current-page")).toHaveTextContent("3");
      expect(consoleLog).toHaveBeenCalledWith("change", { page: 3 });
    });

    it("ignores onSetPage when disabled", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(PaginationPageSelectSlot, {
        props: { totalItems: 40, pageSizes: [10], disabled: true },
      });

      await user.click(screen.getByText("Go to 3"));

      expect(screen.getByTestId("current-page")).toHaveTextContent("1");
      expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
    });

    it("ignores onSetPage with a non-numeric page", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(PaginationPageSelectSlot, {
        props: { totalItems: 40, pageSizes: [10] },
      });

      await user.click(screen.getByText("Go to invalid"));

      expect(screen.getByTestId("current-page")).toHaveTextContent("1");
      expect(consoleLog).not.toHaveBeenCalledWith("change", expect.anything());
    });

    it("clamps onSetPage to the last page when it exceeds totalPages", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(PaginationPageSelectSlot, {
        props: { totalItems: 15, pageSizes: [10] },
      });

      await user.click(screen.getByText("Go to 3"));

      expect(screen.getByTestId("current-page")).toHaveTextContent("2");
      expect(consoleLog).toHaveBeenCalledWith("change", { page: 2 });
    });
  });
});
