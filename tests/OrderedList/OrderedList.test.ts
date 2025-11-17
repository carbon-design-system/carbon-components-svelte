import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import OrderedList from "./OrderedList.test.svelte";

describe("OrderedList", () => {
  it("should render with default props", () => {
    render(OrderedList);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--ordered");
    expect(list).not.toHaveClass("bx--list--ordered--native");
    expect(list).not.toHaveClass("bx--list--nested");
    expect(list).not.toHaveClass("bx--list--expressive");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Item 1");
    expect(items[1]).toHaveTextContent("Item 2");
    expect(items[2]).toHaveTextContent("Item 3");
  });

  it("should support nested lists", () => {
    render(OrderedList, {
      props: {
        nested: true,
        nestedItems: ["Nested 1", "Nested 2"],
      },
    });

    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(4); // Main list + 3 nested lists (one for each main item)

    const mainList = lists[0];
    expect(mainList).toHaveClass("bx--list--ordered");
    expect(mainList).toHaveClass("bx--list--nested");

    const nestedLists = lists.slice(1);
    for (const list of nestedLists) {
      expect(list).toHaveClass("bx--list--ordered");
      expect(list).toHaveClass("bx--list--nested");
    }

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(9); // 3 main items + (2 nested items × 3)
  });

  it("should support native list styles", () => {
    render(OrderedList, {
      props: { native: true },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--ordered--native");
    expect(list).not.toHaveClass("bx--list--ordered");
  });

  it("should support native list styles with nesting", () => {
    render(OrderedList, {
      props: {
        native: true,
        nested: true,
        nestedItems: ["Nested 1", "Nested 2"],
      },
    });

    const lists = screen.getAllByRole("list");

    // Only the top-level list has the native class
    expect(lists[0]).toHaveClass("bx--list--ordered--native");
    expect(lists[0]).not.toHaveClass("bx--list--ordered");

    for (const list of lists.slice(1)) {
      expect(list).toHaveClass("bx--list--ordered bx--list--nested");
      expect(list).not.toHaveClass("bx--list--ordered--native");
    }
  });

  it("should support expressive styles", () => {
    render(OrderedList, {
      props: { expressive: true },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--expressive");
  });

  it("should support custom items", () => {
    const customItems = ["Custom 1", "Custom 2", "Custom 3", "Custom 4"];
    render(OrderedList, {
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
      const { component } = render(OrderedList);
      const list = screen.getByRole("list");

      const mock = vi.fn();
      component.$on("click", mock);

      await user.click(list);
      expect(mock).toHaveBeenCalled();
    });

    test.each([
      "mouseover",
      "mouseenter",
      "mouseleave",
    ])("should emit %s event", (eventName) => {
      const { component } = render(OrderedList);
      const list = screen.getByRole("list");

      const mock = vi.fn();
      component.$on(eventName, mock);

      const event = new MouseEvent(eventName);
      list.dispatchEvent(event);

      expect(mock).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have correct ARIA role", () => {
      render(OrderedList);

      const list = screen.getByRole("list");
      expect(list.tagName).toBe("OL");

      const items = screen.getAllByRole("listitem");
      for (const item of items) {
        expect(item.tagName).toBe("LI");
      }
    });

    it("should maintain list structure with nested items", () => {
      render(OrderedList, {
        props: {
          nested: true,
          nestedItems: ["Nested 1", "Nested 2"],
        },
      });

      const lists = screen.getAllByRole("list");
      for (const list of lists) {
        expect(list.tagName).toBe("OL");
        expect(list.children).toBeTruthy();
        for (const child of Array.from(list.children)) {
          expect(child.tagName).toBe("LI");
        }
      }
    });

    it("should maintain correct order with native styles", () => {
      const items = ["First", "Second", "Third", "Fourth", "Fifth"];
      render(OrderedList, {
        props: { native: true, items },
      });

      const listItems = screen.getAllByRole("listitem");
      items.forEach((text, index) => {
        expect(listItems[index]).toHaveTextContent(text);
      });
    });
  });
});
