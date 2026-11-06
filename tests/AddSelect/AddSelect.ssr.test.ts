// @vitest-environment node
import AddSelect from "carbon-components-svelte/AddSelect/AddSelect.svelte";
import MultiAddSelect from "carbon-components-svelte/AddSelect/MultiAddSelect.svelte";
import { renderSSR } from "../utils/ssr";

const items = [
  { id: "fin", title: "Finance", hasChildren: true, childCount: 2 },
  { id: "rev", title: "Revenue", parentId: "fin" },
  { id: "tax", title: "Tax", parentId: "fin" },
];

describe("AddSelect server render", () => {
  it("renders the first page of an in-memory catalog and the chosen column", () => {
    const { document } = renderSSR(MultiAddSelect, {
      items,
      value: ["rev"],
      selectedItems: [items[1]],
      labelText: "Datasets",
    });

    const options = [...document.querySelectorAll('[role="option"]')];
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      expect.stringContaining("Finance"),
    ]);
    expect(
      document.querySelector(".bx--add-select__chosen")?.textContent,
    ).toContain("Revenue");
    expect(
      document
        .querySelector('[role="listbox"]')
        ?.getAttribute("aria-multiselectable"),
    ).toBe("true");
  });

  it("renders a source as a loading list and starts no request or timer", () => {
    const source = vi.fn();
    vi.useFakeTimers();
    try {
      const { document } = renderSSR(AddSelect, {
        source,
        labelText: "Datasets",
      });
      expect(source).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
      expect(
        document.querySelector(".bx--add-select__skeleton"),
      ).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
