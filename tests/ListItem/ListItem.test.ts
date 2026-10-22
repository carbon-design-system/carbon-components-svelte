import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ListItemTest from "./ListItem.test.svelte";

describe("ListItem", () => {
  it("should render with default props", () => {
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "List item content",
      },
    });

    const item = container.querySelector("li");
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass("bx--list__item");
    expect(screen.getByText("List item content")).toBeInTheDocument();
  });

  it.each([
    ["onclick", (item: HTMLElement) => user.click(item)],
    ["onmouseover", (item: HTMLElement) => user.hover(item)],
    ["onmouseenter", (item: HTMLElement) => user.hover(item)],
    [
      "onmouseleave",
      async (item: HTMLElement) => {
        await user.hover(item);
        await user.unhover(item);
      },
    ],
  ])("should call %s", async (propName, interact) => {
    const mock = vi.fn();
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
        [propName]: mock,
      },
    });

    const item = container.querySelector("li");
    assert(item);
    await interact(item);

    expect(mock).toHaveBeenCalled();
  });

  it("should apply custom class via restProps", () => {
    const { container } = render(ListItemTest, {
      props: {
        class: "custom-class",
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    assert(item);
    expect(item).toHaveClass("bx--list__item");
    expect(item).toHaveClass("custom-class");
  });
});
