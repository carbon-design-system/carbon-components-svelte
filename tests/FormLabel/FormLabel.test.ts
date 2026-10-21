import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FormLabelTest from "./FormLabel.test.svelte";

describe("FormLabel", () => {
  it("should render with default props", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Label text",
      },
    });

    const label = screen.getByText("Label text");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveClass("bx--label");
  });

  it("should generate default id", () => {
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
      },
    });

    const forAttr = screen.getByText("Label").getAttribute("for");
    expect(forAttr).toBeTruthy();
    expect(forAttr).toMatch(/^ccs-/);
  });

  it.each([
    [{ id: "custom-input-id" }, "custom-input-id"],
    [{ htmlFor: "email" }, "email"],
    [{ htmlFor: "email", id: "legacy" }, "email"],
  ])("resolves for from %j", (props, expectedFor) => {
    render(FormLabelTest, { props: { ...props, slotContent: "Label" } });

    expect(screen.getByText("Label")).toHaveAttribute("for", expectedFor);
  });

  it("should not set its own id outside a FormItem", () => {
    render(FormLabelTest, { props: { slotContent: "Email" } });

    expect(screen.getByText("Email")).not.toHaveAttribute("id");
  });

  it("forwards click and mouse events", async () => {
    const onClick = vi.fn();
    const onMouseover = vi.fn();
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    render(FormLabelTest, {
      props: {
        slotContent: "Label",
        onClick,
        onMouseover,
        onMouseenter,
        onMouseleave,
      },
    });

    const label = screen.getByText("Label");
    await user.click(label);
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.hover(label);
    expect(onMouseover).toHaveBeenCalled();
    expect(onMouseenter).toHaveBeenCalled();

    await user.unhover(label);
    expect(onMouseleave).toHaveBeenCalled();
  });

  it("should apply custom class via restProps", () => {
    render(FormLabelTest, {
      props: {
        class: "custom-label-class",
        slotContent: "Label",
      },
    });

    expect(screen.getByText("Label")).toHaveClass("custom-label-class");
  });

  it("should name an associated input", () => {
    const { container } = render(FormLabelTest, {
      props: {
        id: "test-input",
        slotContent: "Test Label",
      },
    });

    const input = document.createElement("input");
    input.id = "test-input";
    container.appendChild(input);

    expect(screen.getByLabelText("Test Label")).toBe(input);
  });
});
