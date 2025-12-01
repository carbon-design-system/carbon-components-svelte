import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import UnorderedList from "./UnorderedList.test.svelte";

describe("UnorderedList", () => {
  it("should render with default props", () => {
    render(UnorderedList);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--unordered");
    expect(list).not.toHaveClass("bx--list--nested");
    expect(list).not.toHaveClass("bx--list--expressive");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Item 1");
    expect(items[1]).toHaveTextContent("Item 2");
    expect(items[2]).toHaveTextContent("Item 3");
  });

  it("should support nested lists", () => {
    render(UnorderedList, {
      props: {
        nested: true,
        nestedItems: ["Nested 1", "Nested 2"],
      },
    });

    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(4); // Main list + 3 nested lists (one for each main item)

    const mainList = lists[0];
    expect(mainList).toHaveClass("bx--list--unordered");
    expect(mainList).toHaveClass("bx--list--nested");

    const nestedLists = lists.slice(1);
    for (const list of nestedLists) {
      expect(list).toHaveClass("bx--list--unordered");
      expect(list).toHaveClass("bx--list--nested");
    }

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(9); // 3 main items + (2 nested items × 3)
  });

  it("should support expressive styles", () => {
    render(UnorderedList, {
      props: { expressive: true },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--expressive");
  });

  it("should support custom items", () => {
    const customItems = ["Custom 1", "Custom 2", "Custom 3", "Custom 4"];
    render(UnorderedList, {
      props: { items: customItems },
    });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(customItems.length);
    for (let index = 0; index < items.length; index++) {
      expect(items[index]).toHaveTextContent(customItems[index]);
    }
  });

  describe("events", () => {
    it("should emit click event", async () => {
      const mock = vi.fn();
      render(UnorderedList, { props: { onclick: mock } });
      const list = screen.getByRole("list");

      await user.click(list);
      expect(mock).toHaveBeenCalled();
    });

    test.each([
      ["mouseover", "onmouseover"],
      ["mouseenter", "onmouseenter"],
      ["mouseleave", "onmouseleave"],
    ])("should emit %s event", (eventName, propName) => {
      const mock = vi.fn();
      render(UnorderedList, { props: { [propName]: mock } });
      const list = screen.getByRole("list");

      const event = new MouseEvent(eventName);
      list.dispatchEvent(event);

      expect(mock).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have correct ARIA role", () => {
      render(UnorderedList);

      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");

      const items = screen.getAllByRole("listitem");
      for (const item of items) {
        expect(item.tagName).toBe("LI");
      }
    });

    it("should maintain list structure with nested items", () => {
      render(UnorderedList, {
        props: {
          nested: true,
          nestedItems: ["Nested 1", "Nested 2"],
        },
      });

      const lists = screen.getAllByRole("list");
      for (const list of lists) {
        expect(list.tagName).toBe("UL");
        expect(list.children).toBeTruthy();
        for (const child of Array.from(list.children)) {
          expect(child.tagName).toBe("LI");
        }
      }
    });
  });
});
