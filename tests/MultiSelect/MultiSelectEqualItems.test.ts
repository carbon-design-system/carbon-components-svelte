import { render, screen } from "@testing-library/svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import MultiSelect from "./MultiSelect.test.svelte";

describe("MultiSelect new-but-equal items", () => {
  const buildItems = (): MultiSelectItem[] => [
    { id: "3", text: "C" },
    { id: "1", text: "A" },
    { id: "2", text: "B" },
  ];

  const optionTexts = () =>
    screen.queryAllByRole("option").map((el) => el.textContent?.trim());

  const createSortItem = () =>
    vi.fn((a: MultiSelectItem, b: MultiSelectItem) =>
      a.text.localeCompare(b.text),
    );

  it("does not re-sort for equal items, and re-sorts for different ones", async () => {
    const sortItem = createSortItem();
    const { rerender } = render(MultiSelect, {
      props: { items: buildItems(), sortItem, open: true },
    });
    expect(optionTexts()).toEqual(["A", "B", "C"]);

    sortItem.mockClear();
    const options = screen.getAllByRole("option");
    await rerender({ items: buildItems() });
    await rerender({ items: buildItems() });
    expect(sortItem).not.toHaveBeenCalled();
    expect(screen.getAllByRole("option")).toEqual(options);

    await rerender({ items: [...buildItems(), { id: "0", text: "Aa" }] });
    expect(sortItem).toHaveBeenCalled();
    expect(optionTexts()).toEqual(["A", "Aa", "B", "C"]);
  });

  it("re-sorts when an item is mutated in place and the array is copied", async () => {
    const sortItem = createSortItem();
    const items = buildItems();
    const { rerender } = render(MultiSelect, {
      props: { items, sortItem, open: true },
    });

    sortItem.mockClear();
    items[0].text = "0";
    await rerender({ items: [...items] });
    expect(sortItem).toHaveBeenCalled();
    expect(optionTexts()).toEqual(["0", "A", "B"]);
  });

  it("re-sorts when a field compared by identity changes", async () => {
    const sortItem = createSortItem();
    const withFormat = (format: () => string) =>
      buildItems().map((item) => ({ ...item, format }));
    const formatA = () => "a";
    const { rerender } = render(MultiSelect, {
      props: { items: withFormat(formatA), sortItem, open: true },
    });

    sortItem.mockClear();
    await rerender({ items: withFormat(formatA) });
    expect(sortItem).not.toHaveBeenCalled();

    await rerender({ items: withFormat(() => "a") });
    expect(sortItem).toHaveBeenCalled();
  });

  it("re-sorts equal items when selectedIds changed with them", async () => {
    const { rerender } = render(MultiSelect, {
      props: { items: buildItems(), open: true },
    });
    expect(screen.getByRole("option", { name: "C" })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await rerender({ items: buildItems(), selectedIds: ["3"] });
    expect(screen.getByRole("option", { name: "C" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
