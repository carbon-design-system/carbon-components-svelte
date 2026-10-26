import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import Pagination from "./Pagination.test.svelte";
import PaginationPageSelectSlot from "./PaginationPageSelectSlot.test.svelte";
import { optionTexts } from "./helpers";

describe("Pagination", () => {
  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2528
  it("does not fire update event on initial render", () => {
    const onUpdate = vi.fn();
    render(Pagination, {
      props: { totalItems: 100, page: 1, pageSize: 10, onUpdate },
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("does not fire update when clamping an out-of-range initial page", async () => {
    const onUpdate = vi.fn();
    render(Pagination, {
      props: { totalItems: 20, page: 5, pageSize: 10, onUpdate },
    });

    expect(screen.getByText("11–20 of 20 items")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 10, page: 1 });
  });

  it("clamps the page and reports it once when totalItems shrinks below it", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const { rerender } = render(Pagination, {
      props: { totalItems: 100, page: 8, pageSize: 10, onChange, onUpdate },
    });

    await rerender({ totalItems: 15 });

    expect(screen.getByText("11–15 of 15 items")).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 10, page: 2 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    [undefined, "md"],
    ["xs", "xs"],
    ["sm", "sm"],
    ["md", "md"],
    ["lg", "lg"],
  ] as const)("size %s applies the %s size class", (size, expected) => {
    const { container } = render(Pagination, { props: { size } });

    const pagination = container.querySelector(".bx--pagination");
    expect(pagination).toHaveClass(`bx--pagination--${expected}`);
  });

  it("should render with custom total items", () => {
    render(Pagination, {
      props: { totalItems: 102 },
    });

    expect(screen.getByText("1–10 of 102 items")).toBeInTheDocument();
  });

  // The `bx--pagination__items-count` and `bx--pagination__control-buttons`
  // classes are exempted from the CSS rule that hides every other control
  // below the `md` breakpoint, so mobile pagination isn't left empty.
  it("keeps an items-count element and a control-buttons group in the DOM for mobile", () => {
    const { container } = render(Pagination, {
      props: { totalItems: 102 },
    });

    const itemsCount = container.querySelector(".bx--pagination__items-count");
    expect(itemsCount).toHaveTextContent("1–10 of 102 items");

    const controlButtons = container.querySelector(
      ".bx--pagination__control-buttons",
    );
    expect(controlButtons).toContainElement(
      screen.getByRole("button", { name: "Previous page" }),
    );
    expect(controlButtons).toContainElement(
      screen.getByRole("button", { name: "Next page" }),
    );
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

    expect(optionTexts(select)).toEqual(["10", "15", "20"]);
  });

  it("should handle page navigation", async () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onChange = vi.fn();
    render(Pagination, {
      props: { totalItems: 102, page: 1, onNext, onPrevious, onChange },
    });

    const nextButton = screen.getByRole("button", { name: "Next page" });
    await user.click(nextButton);
    expect(onNext).toHaveBeenCalledWith({ page: 2 });
    expect(onChange).toHaveBeenCalledWith({ page: 2 });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    await user.click(prevButton);
    expect(onPrevious).toHaveBeenCalledWith({ page: 1 });
    expect(onChange).toHaveBeenCalledWith({ page: 1 });
  });

  it("should handle page size changes", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 102,
        pageSizes: [10, 15, 20],
        onChange,
        onUpdate,
      },
    });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    await user.selectOptions(select, "15");

    expect(onChange).toHaveBeenCalledWith({ pageSize: 15, page: 1 });
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 15, page: 1 });
  });

  it("disables the navigation buttons and both selects when disabled", () => {
    render(Pagination, {
      props: { disabled: true, totalItems: 102, pageSizes: [10, 20] },
    });

    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(
      screen.getByRole("combobox", { name: "Items per page:" }),
    ).toBeDisabled();
    expect(screen.getByLabelText(/Page number, of \d+ pages/)).toBeDisabled();
  });

  it.each([
    [10, "Page number, of 1 page"],
    [25, "Page number, of 3 pages"],
  ])("labels the page select for %i items as '%s'", (totalItems, label) => {
    render(Pagination, { props: { totalItems, pageSize: 10 } });
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it("moves focus to the forward button when the backward button becomes disabled", async () => {
    render(Pagination, {
      props: { page: 2, totalItems: 20, pageSize: 10 },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    prevButton.focus();
    await user.click(prevButton);

    expect(prevButton).toBeDisabled();
    expect(nextButton).toHaveFocus();
  });

  it("moves focus to the backward button when the forward button becomes disabled", async () => {
    render(Pagination, {
      props: { page: 1, totalItems: 20, pageSize: 10 },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    nextButton.focus();
    await user.click(nextButton);

    expect(nextButton).toBeDisabled();
    expect(prevButton).toHaveFocus();
  });

  it("leaves focus on the body when a disabled button was clicked without focus", async () => {
    render(Pagination, {
      props: { page: 1, totalItems: 20, pageSize: 10 },
    });

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    const nextButton = screen.getByRole("button", { name: "Next page" });

    // A click that never focused the button, as in Safari.
    (document.activeElement as HTMLElement | null)?.blur();
    await fireEvent.click(nextButton);
    await flushMacrotask();

    expect(nextButton).toBeDisabled();
    expect(prevButton).not.toHaveFocus();
    expect(document.body).toHaveFocus();
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

  it("should handle disabled page input", async () => {
    const { rerender } = render(Pagination);

    // The accessible name is "Page number, of 1 page", so match by prefix.
    expect(
      screen.getByRole("combobox", { name: /Page number/ }),
    ).toBeInTheDocument();

    await rerender({ pageInputDisabled: true });

    expect(
      screen.queryByRole("combobox", { name: /Page number/ }),
    ).not.toBeInTheDocument();
  });

  it("defaults to select page input", () => {
    render(Pagination, {
      props: { totalItems: 102 },
    });

    expect(
      screen.getByRole("combobox", { name: /Page number, of 11 pages/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("renders a number input when pageInputType is input", () => {
    render(Pagination, {
      props: { totalItems: 102, pageInputType: "input" },
    });

    const input = screen.getByRole("spinbutton", {
      name: /Page number, of 11 pages/,
    });
    expect(input).toHaveValue(1);
    expect(
      screen.queryByRole("combobox", { name: /Page number/ }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [9, "1"],
    [99, "2"],
    [9999, "4"],
    [99999, "5"],
  ])("sizes the page input to the digits of %i pages", (pages, digits) => {
    render(Pagination, {
      props: { totalItems: pages, pageSize: 1, pageInputType: "input" },
    });

    const input = screen.getByRole("spinbutton", { name: /Page number/ });
    expect(
      input.style.getPropertyValue("--ccs-pagination-page-input-digits"),
    ).toBe(digits);
  });

  it("falls back to the minimum page input width for unbounded pages", () => {
    render(Pagination, {
      props: {
        totalItems: Number.POSITIVE_INFINITY,
        pageInputType: "input",
      },
    });

    const input = screen.getByRole("spinbutton", { name: /Page number/ });
    expect(
      input.style.getPropertyValue("--ccs-pagination-page-input-digits"),
    ).toBe("");
  });

  it("clamps page input values to the total page range", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 102,
        pageSize: 10,
        pageInputType: "input",
        onChange,
        onUpdate,
      },
    });

    const input = screen.getByRole("spinbutton", {
      name: /Page number, of 11 pages/,
    });
    await user.clear(input);
    await user.type(input, "99");
    await user.tab();

    expect(
      screen.getByRole("spinbutton", { name: /Page number, of 11 pages/ }),
    ).toHaveValue(11);
    expect(onChange).toHaveBeenCalledWith({ page: 11 });
    expect(onUpdate).toHaveBeenCalledWith({
      pageSize: 10,
      page: 11,
    });
  });

  it("clamps page input values below the minimum to page 1", async () => {
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 102,
        page: 3,
        pageInputType: "input",
        onChange,
      },
    });

    const input = screen.getByRole("spinbutton", {
      name: /Page number, of 11 pages/,
    });
    await user.clear(input);
    await user.type(input, "0");
    await user.tab();

    expect(
      screen.getByRole("spinbutton", { name: /Page number, of 11 pages/ }),
    ).toHaveValue(1);
    expect(onChange).toHaveBeenCalledWith({ page: 1 });
  });

  it("dispatches change when page input commits a valid page", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(Pagination, {
      props: { totalItems: 102, pageInputType: "input", onChange, onUpdate },
    });

    const input = screen.getByRole("spinbutton", {
      name: /Page number, of 11 pages/,
    });
    await user.clear(input);
    await user.type(input, "5");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith({ page: 5 });
    expect(onUpdate).toHaveBeenCalledWith({
      pageSize: 10,
      page: 5,
    });
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
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        simple: true,
        totalItems: 102,
        page: 1,
        onNext,
        onPrevious,
        onChange,
      },
    });

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(onNext).toHaveBeenCalledWith({ page: 2 });
    expect(onChange).toHaveBeenCalledWith({ page: 2 });
    expect(screen.getByText("page 2 of 11 pages")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(onPrevious).toHaveBeenCalledWith({ page: 1 });
    expect(screen.getByText("page 1 of 11 pages")).toBeInTheDocument();
  });

  it("should handle unknown pages", () => {
    render(Pagination, {
      props: { pagesUnknown: true },
    });

    expect(screen.getByText("1–10 items")).toBeInTheDocument();
    expect(screen.getByText("page 1")).toBeInTheDocument();
  });

  it("shows the page text without a page select when pagesUnknown is true", () => {
    render(Pagination, {
      props: { pagesUnknown: true, page: 4 },
    });

    expect(screen.getByText("page 4")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      "Items per page:",
    );
  });

  it("should advance the page when pagesUnknown is true", async () => {
    const onNext = vi.fn();
    render(Pagination, {
      props: { pagesUnknown: true, page: 1, onNext },
    });

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(onNext).toHaveBeenCalledWith({ page: 2 });
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

  it.each([
    {
      name: "Previous page",
      props: { totalItems: 100, page: 1, backButtonDisabled: false },
      text: "1–10 of 100 items",
    },
    {
      name: "Next page",
      props: { totalItems: 20, page: 2, forwardButtonDisabled: false },
      text: "11–20 of 20 items",
    },
  ])(
    "keeps a force-enabled $name within the page bounds",
    async ({ name, props, text }) => {
      const onChange = vi.fn();
      render(Pagination, { props: { ...props, onChange } });

      const button = screen.getByRole("button", { name });
      expect(button).toBeEnabled();
      await user.click(button);

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText(text)).toBeInTheDocument();
    },
  );

  it("should update when page or pageSize changes", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(Pagination, {
      props: { totalItems: 102, pageSizes: [5, 10, 15], onChange, onUpdate },
    });

    const pageSizeSelect = screen.getAllByRole("combobox");
    await user.selectOptions(pageSizeSelect[0], "15");
    expect(onChange).toHaveBeenCalledWith({ pageSize: 15, page: 1 });
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 15, page: 1 });

    const pageSelect = screen.getAllByRole("combobox");
    await user.selectOptions(pageSelect[1], "2");
    expect(onChange).toHaveBeenCalledWith({ page: 2 });
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 15, page: 2 });
  });

  it("keeps the page when the page select is set to a page it doesn't list", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const { container } = render(Pagination, {
      props: {
        totalItems: 100_000,
        pageWindow: 100,
        page: 3,
        onChange,
        onUpdate,
      },
    });

    const select = screen.getByLabelText(/Page number, of 10000 pages/);
    // Page 5000 is outside the window, so the browser sets the value to "".
    await fireEvent.change(select, { target: { value: "5000" } });
    await tick();

    expect(onChange).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(select).toHaveValue("3");
    expect(container).toHaveTextContent("21–30 of 100,000 items");
  });

  it("keeps the page size when the size select is set to a size it doesn't list", async () => {
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 102,
        pageSizes: [5, 10, 15],
        pageSize: 10,
        onChange,
      },
    });

    const select = screen.getAllByRole("combobox")[0];
    await fireEvent.change(select, { target: { value: "7" } });
    await tick();

    expect(onChange).not.toHaveBeenCalled();
    expect(select).toHaveValue("10");
  });

  it("resets pageSize and page when an updated pageSizes array drops the current pageSize", async () => {
    const onUpdate = vi.fn();
    const { rerender } = render(Pagination, {
      props: {
        page: 2,
        totalItems: 6,
        pageSize: 2,
        pageSizes: [2, 4],
        onUpdate,
      },
    });

    expect(screen.getByText("3–4 of 6 items")).toBeInTheDocument();
    onUpdate.mockClear();

    await rerender({ pageSizes: [3] });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    expect(select).toHaveValue("3");
    expect(screen.getByText("1–3 of 6 items")).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 3, page: 1 });
  });

  it("keeps pageSize as-is when it remains valid in an updated pageSizes array", async () => {
    const onUpdate = vi.fn();
    const { rerender } = render(Pagination, {
      props: {
        totalItems: 102,
        pageSize: 15,
        pageSizes: [10, 15, 20],
        onUpdate,
      },
    });

    onUpdate.mockClear();

    await rerender({ pageSizes: [10, 15] });

    const select = screen.getByRole("combobox", { name: "Items per page:" });
    expect(select).toHaveValue("15");
    expect(onUpdate).not.toHaveBeenCalled();
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

  it("shows '0 items' when totalItems is 0", () => {
    render(Pagination, {
      props: {
        totalItems: 0,
        page: 1,
        pageSize: 10,
      },
    });

    expect(screen.getByText("0 items")).toBeInTheDocument();
    expect(screen.queryByText(/0–0/)).not.toBeInTheDocument();
  });

  it("shows singular item text for a single item", () => {
    render(Pagination, {
      props: {
        totalItems: 1,
        page: 1,
        pageSize: 10,
      },
    });

    expect(screen.getByText("1–1 of 1 item")).toBeInTheDocument();
  });

  it("still renders a custom itemRangeText when totalItems is 0", () => {
    render(Pagination, {
      props: {
        totalItems: 0,
        itemRangeText: () => "custom",
      },
    });

    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it.each([
    ["by default", {}, 1_000],
    ["to a custom pageWindow", { pageWindow: 100 }, 100],
    [
      "to pageWindow when the current page is in the middle",
      { pageWindow: 100, page: 5000 },
      100,
    ],
  ])("caps rendered page numbers %s", (_name, props, length) => {
    render(Pagination, { props: { totalItems: 100_000, ...props } });

    const pageNumbers = screen.getByLabelText(/Page number, of 10000 pages/);
    expect(pageNumbers).toHaveLength(length);
  });

  it.each([
    { page: 1, first: "1", last: "100" },
    { page: 5000, first: "4950", last: "5049" },
    { page: 9990, first: "9901", last: "10000" },
  ])("windows the page options around page $page", ({ page, first, last }) => {
    render(Pagination, {
      props: { totalItems: 100_000, pageWindow: 100, page },
    });

    const select = screen.getByLabelText(/Page number, of 10000 pages/);
    const options = optionTexts(select);
    expect([options[0], options[options.length - 1]]).toEqual([first, last]);
    expect(select).toHaveValue(String(page));
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

  it("derives select ids with semantic suffixes from the root id", () => {
    const { container } = render(Pagination, {
      props: { id: "page-1", totalItems: 30, pageSizes: [10, 20] },
    });

    expect(document.getElementById("page-1")).toBe(container.firstElementChild);

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

  it.each([
    {
      name: "shows all page sizes when dynamicPageSizes is false (default)",
      totalItems: 9,
      dynamicPageSizes: false,
      expected: ["5", "10", "15"],
    },
    {
      name: "filters out redundant page sizes",
      totalItems: 9,
      dynamicPageSizes: true,
      expected: ["5", "10"],
    },
    {
      name: "keeps only the first page size when totalItems is 0",
      totalItems: 0,
      dynamicPageSizes: true,
      expected: ["5"],
    },
    {
      name: "shows all page sizes when all are smaller than totalItems",
      totalItems: 100,
      dynamicPageSizes: true,
      expected: ["5", "10", "15"],
    },
    {
      name: "shows only the first page size when all are larger than totalItems",
      totalItems: 3,
      dynamicPageSizes: true,
      expected: ["5"],
    },
    {
      name: "includes the exact matching page size",
      totalItems: 10,
      pageSizes: [5, 10, 15, 20],
      dynamicPageSizes: true,
      expected: ["5", "10"],
    },
  ])(
    "dynamicPageSizes: $name",
    ({ totalItems, pageSizes = [5, 10, 15], dynamicPageSizes, expected }) => {
      render(Pagination, {
        props: { totalItems, pageSizes, dynamicPageSizes },
      });

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      expect(optionTexts(select)).toEqual(expected);
    },
  );

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1634
  it("should not trigger multiple updates when pageSize changes on last page", async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 35,
        page: 4,
        pageSize: 10,
        pageSizes: [10, 15, 20],
        onChange,
        onUpdate,
      },
    });

    onChange.mockClear();
    onUpdate.mockClear();

    // Change page size from 10 to 15 while on page 4 (items 31-40).
    // The anchor computation keeps item 31 in view, landing on page 3
    // (items 31-45 at 15 per page), and should only trigger one update cycle.
    const pageSizeSelect = screen.getByRole("combobox", {
      name: "Items per page:",
    });
    await user.selectOptions(pageSizeSelect, "15");

    expect(onChange).toHaveBeenCalledWith({ pageSize: 15, page: 3 });
    expect(onUpdate).toHaveBeenCalledWith({ pageSize: 15, page: 3 });

    const updateCalls = onUpdate.mock.calls.filter(
      ([detail]) => detail.pageSize === 15 && detail.page === 3,
    );
    expect(updateCalls.length).toBe(1);
  });

  it("keeps the first visible item on screen when the page size changes", async () => {
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        totalItems: 100,
        page: 5,
        pageSize: 10,
        pageSizes: [10, 50],
        onChange,
      },
    });

    // Page 5 at 10 per page starts at item 41; at 50 per page that's page 1.
    const pageSizeSelect = screen.getByRole("combobox", {
      name: "Items per page:",
    });
    await user.selectOptions(pageSizeSelect, "50");

    const pageSelect = screen.getByLabelText(/Page number, of \d+ pages/);
    expect(pageSelect).toHaveValue("1");
    expect(onChange).toHaveBeenCalledWith({ pageSize: 50, page: 1 });
  });

  it("keeps the current page when pagesUnknown and the page size changes", async () => {
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        pagesUnknown: true,
        page: 4,
        pageSize: 10,
        pageSizes: [10, 50],
        onChange,
      },
    });

    const pageSizeSelect = screen.getByRole("combobox", {
      name: "Items per page:",
    });
    await user.selectOptions(pageSizeSelect, "50");

    expect(screen.getByText("page 4")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ pageSize: 50, page: 4 });
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

    it("navigates when the slot sets the bound page prop", async () => {
      const onChange = vi.fn();
      const onUpdate = vi.fn();
      render(PaginationPageSelectSlot, {
        props: { totalItems: 40, pageSizes: [10], onChange, onUpdate },
      });

      await user.click(screen.getByText("Go to 3"));

      expect(screen.getByTestId("current-page")).toHaveTextContent("3");
      expect(onUpdate).toHaveBeenCalledWith({ pageSize: 10, page: 3 });
      // The pageSelect slot owns its own control, so Pagination has no
      // interaction handler to fire "change" from; only "update" reflects
      // the bound page prop changing.
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
