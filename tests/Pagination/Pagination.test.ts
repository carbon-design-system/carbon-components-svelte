import { render, screen, within } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import Pagination from "./Pagination.test.svelte";

describe("Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("should handle unknown pages", () => {
    render(Pagination, {
      props: { pagesUnknown: true },
    });

    expect(screen.getByText("1–10 items")).toBeInTheDocument();
    expect(screen.getByText("page 1")).toBeInTheDocument();
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
    expect(pageNumbers).toHaveLength(1_000 + 1);
  });

  it("renders a custom page window", () => {
    render(Pagination, {
      props: { totalItems: 100_000, pageWindow: 100 },
    });

    const pageNumbers = screen.getByLabelText(/Page number, of 10000 pages/);
    expect(pageNumbers).toHaveLength(100 + 1);
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

  it("handles custom item range text", () => {
    const props = {
      totalItems: 100_000,
      itemRangeText: (min: number, max: number, total: number) =>
        `${min}–${max} of ${total}`,
    } satisfies ComponentProps<Pagination>;

    render(Pagination, { props });

    expect(screen.getByText(/1–10 of 100000/)).toBeInTheDocument();
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

  it("should apply custom class", () => {
    render(Pagination, {
      props: { customClass: "custom-pagination" },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    const pagination = nextButton.closest(".bx--pagination");
    assert(pagination);
    expect(pagination).toHaveClass("custom-pagination");
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
});
