import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FormItemTest from "./FormItem.test.svelte";

describe("FormItem", () => {
  it("should render with default props", () => {
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Form item content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    expect(formItem).toBeInTheDocument();
    expect(screen.getByText("Form item content")).toBeInTheDocument();
  });

  it("should render as div element", () => {
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    expect(formItem?.tagName).toBe("DIV");
  });

  it("should render slot content", () => {
    render(FormItemTest, {
      props: {
        slotContent: "Custom slot content",
      },
    });

    expect(screen.getByText("Custom slot content")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    assert(formItem);
    await user.click(formItem);

    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("should handle mouseover event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    assert(formItem);
    await user.hover(formItem);

    expect(consoleLog).toHaveBeenCalledWith("mouseover");
  });

  it("should handle mouseenter event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    assert(formItem);
    await user.hover(formItem);

    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
  });

  it("should handle mouseleave event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    assert(formItem);
    await user.hover(formItem);
    await user.unhover(formItem);

    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("should apply custom attributes", () => {
    const { container } = render(FormItemTest, {
      props: {
        "data-testid": "custom-form-item",
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(
      "[data-testid='custom-form-item']",
    );
    expect(formItem).toBeInTheDocument();
    expect(formItem).toHaveClass("bx--form-item");
  });

  it("should apply custom class via restProps", () => {
    const { container } = render(FormItemTest, {
      props: {
        class: "custom-class",
        slotContent: "Content",
      },
    });

    const formItem = container.querySelector(".bx--form-item");
    expect(formItem).toHaveClass("custom-class");
  });

  it("should contain slot content", () => {
    const { container } = render(FormItemTest, {
      props: {
        slotContent: "First child",
      },
    });

    expect(screen.getByText("First child")).toBeInTheDocument();
    const formItem = container.querySelector(".bx--form-item");
    expect(formItem?.textContent).toContain("First child");
  });
});
