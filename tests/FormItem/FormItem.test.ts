import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FormItemTest from "./FormItem.test.svelte";
import FormItemControlTest from "./FormItemControl.test.svelte";
import FormItemSlotPropsTest from "./FormItemSlotProps.test.svelte";

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

describe("FormItem control association", () => {
  it("applies controlId to the control and the label's for", () => {
    render(FormItemControlTest);

    const input = screen.getByTestId("control");
    expect(input).toHaveAttribute("id", "email");
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
    expect(screen.getByLabelText("Email")).toBe(input);
    expect(screen.getByTestId("slot-control-id")).toHaveTextContent("email");
  });

  it("gives the label an id but leaves native controls to for", () => {
    render(FormItemControlTest);

    expect(screen.getByText("Email")).toHaveAttribute("id", "label-email");
    expect(screen.getByTestId("control")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("labels a non-labelable control via aria-labelledby", () => {
    render(FormItemControlTest, { props: { custom: true } });

    expect(screen.getByRole("combobox", { name: "Email" })).toHaveAttribute(
      "aria-labelledby",
      "label-email",
    );
  });

  it("keeps the control's own aria-describedby", () => {
    render(FormItemControlTest);

    expect(screen.getByTestId("control")).toHaveAttribute(
      "aria-describedby",
      "own",
    );
  });

  it("follows controlId changes", async () => {
    const { component } = render(FormItemControlTest);

    component.controlId = "work-email";
    await tick();

    expect(screen.getByTestId("control")).toHaveAttribute("id", "work-email");
    expect(screen.getByText("Email")).toHaveAttribute("for", "work-email");
  });

  it("styles the label as disabled", () => {
    render(FormItemControlTest, { props: { disabled: true } });

    expect(screen.getByText("Email")).toHaveClass("bx--label--disabled");
  });
});

describe("FormItem slot props", () => {
  it("exposes the label id once a FormLabel mounts", () => {
    render(FormItemSlotPropsTest);

    expect(screen.getByTestId("plain")).toHaveTextContent(
      "label-plain|undefined|false",
    );
  });

  it("exposes the parent Form size", () => {
    render(FormItemSlotPropsTest);

    expect(screen.getByTestId("sized")).toHaveTextContent("sm|false");
  });

  it("exposes fluid inside a FluidForm", () => {
    render(FormItemSlotPropsTest);

    expect(screen.getByTestId("fluid")).toHaveTextContent("true");
  });
});
