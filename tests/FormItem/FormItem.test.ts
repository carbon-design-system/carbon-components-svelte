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
    const { component } = render(FormItemControlTest, {
      props: { custom: true, helper: true, error: true },
    });

    component.controlId = "work-email";
    await tick();

    const control = screen.getByTestId("control");
    expect(control).toHaveAttribute("id", "work-email");
    expect(control).toHaveAttribute("aria-labelledby", "label-work-email");
    expect(control).toHaveAttribute(
      "aria-describedby",
      "error-work-email helper-work-email",
    );
    expect(screen.getByText("Email")).toHaveAttribute("for", "work-email");
    expect(screen.getByText("Email")).toHaveAttribute("id", "label-work-email");
    expect(screen.getByText("Helper")).toHaveAttribute(
      "id",
      "helper-work-email",
    );
    expect(screen.getByText("Error")).toHaveAttribute("id", "error-work-email");
  });

  it("switches a message between invalid and warn at runtime", async () => {
    const { component } = render(FormItemControlTest, {
      props: { helper: true, error: true },
    });
    const input = screen.getByTestId("control");
    expect(input).toHaveAttribute("aria-invalid", "true");

    component.errorKind = "warn";
    await tick();

    const message = screen.getByText("Error");
    expect(message).toHaveAttribute("id", "warn-email");
    expect(message).not.toHaveAttribute("role");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "own warn-email helper-email",
    );

    component.errorKind = "invalid";
    await tick();

    expect(message).toHaveAttribute("id", "error-email");
    expect(message).toHaveAttribute("role", "alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "own error-email helper-email",
    );
  });

  it.each([
    ["helperId", { helper: true }, "Helper", "own custom-id"],
    ["errorId", { error: true }, "Error", "own custom-id"],
  ] as const)(
    "uses an explicit %s as the element and described-by id",
    (prop, parts, text, describedBy) => {
      render(FormItemControlTest, { props: { ...parts, [prop]: "custom-id" } });

      expect(screen.getByText(text)).toHaveAttribute("id", "custom-id");
      expect(screen.getByTestId("control")).toHaveAttribute(
        "aria-describedby",
        describedBy,
      );
    },
  );

  it("styles the label as disabled", () => {
    render(FormItemControlTest, { props: { disabled: true } });

    expect(screen.getByText("Email")).toHaveClass("bx--label--disabled");
  });

  it("lets a part's own disabled override the item's", () => {
    render(FormItemControlTest, {
      props: {
        disabled: true,
        helper: true,
        labelDisabled: false,
        helperDisabled: false,
      },
    });

    expect(screen.getByText("Email")).not.toHaveClass("bx--label--disabled");
    expect(screen.getByText("Helper")).not.toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("restyles parts when the item's disabled changes", async () => {
    const { component } = render(FormItemControlTest, {
      props: { helper: true },
    });
    const label = screen.getByText("Email");
    const helper = screen.getByText("Helper");
    expect(label).not.toHaveClass("bx--label--disabled");

    component.disabled = true;
    await tick();

    expect(label).toHaveClass("bx--label--disabled");
    expect(helper).toHaveClass("bx--form__helper-text--disabled");

    component.disabled = false;
    await tick();

    expect(label).not.toHaveClass("bx--label--disabled");
    expect(helper).not.toHaveClass("bx--form__helper-text--disabled");
  });

  it("doesn't label a non-labelable control from a label for another control", () => {
    render(FormItemControlTest, {
      props: { custom: true, labelFor: "other" },
    });

    expect(screen.getByText("Email")).not.toHaveAttribute("id");
    expect(screen.getByTestId("control")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("leaves a non-labelable control's own aria-label alone", () => {
    render(FormItemControlTest, {
      props: { custom: true, ariaLabel: "Mail" },
    });

    expect(screen.getByTestId("control")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("clears aria-labelledby when the label unmounts", async () => {
    const { component } = render(FormItemControlTest, {
      props: { custom: true },
    });
    const control = screen.getByTestId("control");
    expect(control).toHaveAttribute("aria-labelledby", "label-email");

    component.showLabel = false;
    await tick();

    expect(control).not.toHaveAttribute("aria-labelledby");
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
