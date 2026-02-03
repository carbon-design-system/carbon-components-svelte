import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
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

  it("should render as li element", () => {
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    expect(item?.tagName).toBe("LI");
  });

  it("should render slot content", () => {
    render(ListItemTest, {
      props: {
        slotContent: "Custom slot content",
      },
    });

    expect(screen.getByText("Custom slot content")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    assert(item);
    await user.click(item);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should handle mouseover event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    assert(item);
    await user.hover(item);

    expect(consoleLog).toHaveBeenCalledWith("mouseover");
  });

  it("should handle mouseenter event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    assert(item);
    await user.hover(item);

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("should handle mouseleave event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(ListItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const item = container.querySelector("li");
    assert(item);
    await user.hover(item);
    await user.unhover(item);

    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should apply custom attributes", () => {
    const { container } = render(ListItemTest, {
      props: {
        "data-testid": "custom-list-item",
        slotContent: "Content",
      },
    });

    const item = container.querySelector("[data-testid='custom-list-item']");
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass("bx--list__item");
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
