import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import OrderedList from "./OrderedList.test.svelte";

describe("OrderedList", () => {
  it("should render with default props", () => {
    render(OrderedList);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--ordered");
    expect(list).not.toHaveClass("bx--list--ordered--native");
    expect(list).not.toHaveClass("bx--list--nested");
    expect(list).not.toHaveClass("bx--list--expressive");
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

  it("should support expressive styles", () => {
    render(OrderedList, {
      props: { expressive: true },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--list--expressive");
  });

  describe("events", () => {
    it("should emit click event", async () => {
      const mock = vi.fn();
      render(OrderedList, { props: { onclick: mock } });
      const list = screen.getByRole("list");

      await user.click(list);
      expect(mock).toHaveBeenCalled();
    });

    it.each([
      ["mouseover", "onmouseover"],
      ["mouseenter", "onmouseenter"],
      ["mouseleave", "onmouseleave"],
    ])("should emit %s event", (eventName, propName) => {
      const mock = vi.fn();
      render(OrderedList, { props: { [propName]: mock } });
      const list = screen.getByRole("list");

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
        expect(list.children.length).toBeGreaterThan(0);
        for (const child of Array.from(list.children)) {
          expect(child.tagName).toBe("LI");
        }
      }
    });
  });
});
