import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FormItemTest from "./FormItem.test.svelte";
import FormItemControlTest from "./FormItemControl.test.svelte";
import FormItemSlotPropsTest from "./FormItemSlotProps.test.svelte";
import { getItem } from "./helpers";

describe("FormItem", () => {
  it("should render with default props", () => {
    render(FormItemTest, {
      props: {
        slotContent: "Form item content",
      },
    });

    expect(getItem()).toBeInTheDocument();
    expect(screen.getByText("Form item content")).toBeInTheDocument();
  });

  it("forwards click and mouse events", async () => {
    const onClick = vi.fn();
    const onMouseover = vi.fn();
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    render(FormItemTest, {
      props: {
        slotContent: "Content",
        onClick,
        onMouseover,
        onMouseenter,
        onMouseleave,
      },
    });

    const formItem = getItem();
    await user.click(formItem);
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.hover(formItem);
    expect(onMouseover).toHaveBeenCalled();
    expect(onMouseenter).toHaveBeenCalled();

    await user.unhover(formItem);
    expect(onMouseleave).toHaveBeenCalled();
  });

  it("should apply custom class via restProps", () => {
    render(FormItemTest, {
      props: {
        class: "custom-class",
        slotContent: "Content",
      },
    });

    expect(getItem()).toHaveClass("custom-class");
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

  it("follows a reactive aria-describedby on the control", async () => {
    const { component } = render(FormItemControlTest, {
      props: { helper: true },
    });
    const input = screen.getByTestId("control");
    expect(input).toHaveAttribute("aria-describedby", "own helper-email");

    component.hint = "other";
    await tick();
    await tick();

    expect(input).toHaveAttribute("aria-describedby", "other helper-email");
  });

  it("gives a second helper text its own id", async () => {
    const { component } = render(FormItemControlTest, {
      props: { helper: true, extraHelper: true },
    });
    const input = screen.getByTestId("control");

    expect(screen.getByText("More help")).toHaveAttribute(
      "id",
      "helper-email-1",
    );
    expect(input).toHaveAttribute(
      "aria-describedby",
      "own helper-email helper-email-1",
    );

    component.extraHelper = false;
    await tick();
    component.extraHelper = true;
    await tick();

    expect(screen.getByText("More help")).toHaveAttribute(
      "id",
      "helper-email-1",
    );
  });

  it("restores the control's own aria-invalid when an error unmounts", async () => {
    const { component } = render(FormItemControlTest, {
      props: { ariaInvalid: "true" },
    });
    const input = screen.getByTestId("control");

    component.error = true;
    await tick();
    expect(input).toHaveAttribute("aria-invalid", "true");

    component.error = false;
    await tick();
    expect(input).toHaveAttribute("aria-invalid", "true");
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
