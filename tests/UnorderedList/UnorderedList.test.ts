import { render, screen } from "@testing-library/svelte";
import { user, isSvelte4, isSvelte5 } from "../setup-tests";
import UnorderedListSvelte4 from "./UnorderedList.test.svelte";
import UnorderedListSvelte5 from "./UnorderedList.svelte5.test.svelte";

const UnorderedList = isSvelte5 ? UnorderedListSvelte5 : UnorderedListSvelte4;

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
    nestedLists.forEach((list) => {
      expect(list).toHaveClass("bx--list--unordered");
      expect(list).toHaveClass("bx--list--nested");
    });

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
    items.forEach((item, index) => {
      expect(item).toHaveTextContent(customItems[index]);
    });
  });

  describe("events", () => {
    describe.skipIf(isSvelte5)("svelte 4", () => {
      it("should emit click event", async () => {
        const { component } = render(UnorderedList);
        const list = screen.getByRole("list");

        const mock = vi.fn();
        component.$on("click", mock);

        await user.click(list);
        expect(mock).toHaveBeenCalled();
      });

      test.each(["mouseover", "mouseenter", "mouseleave"])(
        "should emit %s event",
        (eventName) => {
          const { component } = render(UnorderedList);
          const list = screen.getByRole("list");

          const mock = vi.fn();
          component.$on(eventName, mock);

          const event = new MouseEvent(eventName, { bubbles: true });
          list.dispatchEvent(event);

          expect(mock).toHaveBeenCalled();
        },
      );
    });

    describe.skipIf(isSvelte4)("svelte 5", () => {
      it("should emit click event", async () => {
        const mock = vi.fn();
        render(UnorderedList, { onclick: mock });
        const list = screen.getByRole("list");

        await user.click(list);
        expect(mock).toHaveBeenCalled();
      });

      test.each(["mouseover", "mouseenter", "mouseleave"])(
        "should emit %s event",
        (eventName) => {
          const mock = vi.fn();
          const props = { [`on${eventName}`]: mock };
          render(UnorderedList, props);
          const list = screen.getByRole("list");

          const event = new MouseEvent(eventName, { bubbles: true });
          list.dispatchEvent(event);

          expect(mock).toHaveBeenCalled();
        },
      );
    });
  });

  describe("accessibility", () => {
    it("should have correct ARIA role", () => {
      render(UnorderedList);

      const list = screen.getByRole("list");
      expect(list.tagName).toBe("UL");

      const items = screen.getAllByRole("listitem");
      items.forEach((item) => {
        expect(item.tagName).toBe("LI");
      });
    });

    it("should maintain list structure with nested items", () => {
      render(UnorderedList, {
        props: {
          nested: true,
          nestedItems: ["Nested 1", "Nested 2"],
        },
      });

      const lists = screen.getAllByRole("list");
      lists.forEach((list) => {
        expect(list.tagName).toBe("UL");
        expect(list.children).toBeTruthy();
        Array.from(list.children).forEach((child) => {
          expect(child.tagName).toBe("LI");
        });
      });
    });
  });
});
