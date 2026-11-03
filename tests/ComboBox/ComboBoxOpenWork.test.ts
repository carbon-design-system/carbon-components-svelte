import { render, screen } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { user } from "../utils/user";
import { getInput } from "./helpers";

// Opening a long list must not do per-item work beyond what the mounted
// options need. `idReads` counts `item.id` reads, which an id-to-position map
// over every item makes once per item.
describe("ComboBox open work on long lists", () => {
  const COUNT = 3000;

  const buildItems = () => {
    const state = { idReads: 0 };
    const items = Array.from({ length: COUNT }, (_, i) => {
      const item = { text: `Item ${i}` } as { id: string; text: string };
      Object.defineProperty(item, "id", {
        enumerable: true,
        get() {
          state.idReads++;
          return String(i);
        },
      });
      return item;
    });
    return { items, state };
  };

  it("does not read every item's id when opened virtualized", async () => {
    const { items, state } = buildItems();
    render(ComboBox, { props: { items, placeholder: "Pick" } });
    state.idReads = 0;

    await user.click(getInput());

    expect(screen.getAllByRole("option").length).toBeLessThan(COUNT);
    expect(state.idReads).toBeLessThan(COUNT / 2);
  });

  describe("filter pass", () => {
    const buildCountedItems = () => {
      const state = { filterCalls: 0 };
      const items = Array.from({ length: 200 }, (_, i) => ({
        id: String(i),
        text: `Item ${i}`,
      }));
      const filter = items.filter.bind(items);
      Object.defineProperty(items, "filter", {
        value: (...args: Parameters<typeof filter>) => {
          state.filterCalls++;
          return filter(...args);
        },
      });
      return { items, state };
    };

    it("skips the filter pass for the default shouldFilterItem", async () => {
      const { items, state } = buildCountedItems();
      render(ComboBox, { props: { items, placeholder: "Pick" } });
      await user.click(getInput());
      await user.type(getInput(), "Item 1");

      expect(state.filterCalls).toBe(0);
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")[0]).toHaveAttribute(
        "aria-setsize",
        "200",
      );
    });

    it("filters with a custom shouldFilterItem", async () => {
      const { items, state } = buildCountedItems();
      render(ComboBox, {
        props: {
          items,
          placeholder: "Pick",
          shouldFilterItem: (item: { text: string }, value: string) =>
            item.text.includes(value),
        },
      });
      await user.click(getInput());
      await user.type(getInput(), "Item 19");

      expect(state.filterCalls).toBeGreaterThan(0);
      expect(screen.getAllByRole("option")[0]).toHaveAttribute(
        "aria-setsize",
        "11",
      );
    });
  });

  describe("typing", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      text: `Item ${i}`,
    }));

    it("does not re-render options per keystroke with the default shouldFilterItem", async () => {
      const itemToString = vi.fn((item: { text: string }) => item.text);
      render(ComboBox, {
        props: { items, itemToString, placeholder: "Pick", virtualize: false },
      });
      await user.click(getInput());
      expect(screen.getAllByRole("option")).toHaveLength(50);
      itemToString.mockClear();

      await user.type(getInput(), "Item 1");

      expect(getInput()).toHaveValue("Item 1");
      expect(screen.getAllByRole("option")).toHaveLength(50);
      expect(itemToString).not.toHaveBeenCalled();
    });

    it("re-renders options per keystroke with a custom shouldFilterItem", async () => {
      const itemToString = vi.fn((item: { text: string }) => item.text);
      render(ComboBox, {
        props: {
          items,
          itemToString,
          placeholder: "Pick",
          virtualize: false,
          shouldFilterItem: (item: { text: string }, value: string) =>
            item.text.includes(value),
        },
      });
      await user.click(getInput());
      itemToString.mockClear();

      await user.type(getInput(), "Item 1");

      expect(screen.getAllByRole("option")).toHaveLength(11);
      expect(itemToString).toHaveBeenCalled();
    });
  });

  it("still maps options to their position when not virtualized", async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      text: `Item ${i}`,
    }));
    render(ComboBox, {
      props: { items, placeholder: "Pick", virtualize: false },
    });
    await user.click(getInput());

    const option = screen.getAllByRole("option")[7];
    expect(option).toHaveAttribute("aria-posinset", "8");
  });
});
