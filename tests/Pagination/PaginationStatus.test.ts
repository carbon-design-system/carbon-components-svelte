import { render, screen } from "@testing-library/svelte";
import PaginationStatus from "carbon-components-svelte/Pagination/PaginationStatus.svelte";

describe("PaginationStatus", () => {
  it("renders the default item range text", () => {
    render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 102 },
    });

    expect(screen.getByText("1–10 of 102 items")).toBeInTheDocument();
  });

  it("shows '0 items' when totalItems is 0", () => {
    render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 0 },
    });

    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("shows singular item text for a single item", () => {
    render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 1 },
    });

    expect(screen.getByText("1–1 of 1 item")).toBeInTheDocument();
  });

  it("uses itemText instead of itemRangeText when pagesUnknown is true", () => {
    render(PaginationStatus, {
      props: { page: 1, pageSize: 10, pagesUnknown: true },
    });

    expect(screen.getByText("1–10 items")).toBeInTheDocument();
  });

  it("renders as a span carrying both pagination text classes", () => {
    const { container } = render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 10 },
    });

    const status = container.querySelector("span");
    expect(status).toHaveClass("bx--pagination__text");
    expect(status).toHaveClass("bx--pagination__items-count");
  });

  it("announces changes via a live region", () => {
    const { container } = render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 10 },
    });

    const status = container.querySelector("span");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
  });

  it("forwards custom itemRangeText", () => {
    render(PaginationStatus, {
      props: {
        page: 1,
        pageSize: 10,
        totalItems: 100_000,
        itemRangeText: (min: number, max: number, total: number) =>
          `${min}–${max} of ${total}`,
      },
    });

    expect(screen.getByText("1–10 of 100000")).toBeInTheDocument();
  });

  it("forwards $$restProps without dropping the built-in classes", () => {
    const { container } = render(PaginationStatus, {
      props: { page: 1, pageSize: 10, totalItems: 10, class: "custom-status" },
    });

    const status = container.querySelector("span");
    expect(status).toHaveClass("custom-status");
    expect(status).toHaveClass("bx--pagination__text");
  });
});
