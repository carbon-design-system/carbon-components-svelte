import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import FormGroupTest from "./FormGroup.test.svelte";

describe("FormGroup", () => {
  it("should render with default props", () => {
    const { container } = render(FormGroupTest, {
      props: {
        slotContent: "Form content",
      },
    });

    const fieldset = container.querySelector(".bx--fieldset");
    expect(fieldset).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("should render legend text", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Form Legend",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Form Legend");
    expect(legend).toBeInTheDocument();
    expect(legend.tagName).toBe("LEGEND");
    expect(legend).toHaveClass("bx--label");
  });

  it("should not render legend when legendText is empty", () => {
    const { container } = render(FormGroupTest, {
      props: {
        legendText: "",
        slotContent: "Content",
      },
    });

    const legend = container.querySelector("legend");
    expect(legend).not.toBeInTheDocument();
  });

  it("should handle noMargin prop", () => {
    const { container } = render(FormGroupTest, {
      props: {
        noMargin: true,
        slotContent: "Content",
      },
    });

    const fieldset = container.querySelector(".bx--fieldset");
    expect(fieldset).toHaveClass("bx--fieldset--no-margin");
  });

  it("should handle invalid state", async () => {
    const { rerender } = render(FormGroupTest, {
      props: {
        invalid: true,
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("data-invalid", "true");

    await rerender({ invalid: false });

    expect(fieldset).not.toHaveAttribute("data-invalid");
  });

  it("should set disabled on the fieldset", async () => {
    const { rerender } = render(FormGroupTest, {
      props: {
        disabled: true,
        withNativeInput: true,
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    // Native `<fieldset disabled>` propagates to nested inputs; the input
    // should not carry its own `disabled` attribute.
    const input = screen.getByRole("textbox", { name: "Nested input" });
    expect(input).toBeDisabled();
    expect(input).not.toHaveAttribute("disabled");

    await rerender({ disabled: false });

    expect(fieldset).not.toBeDisabled();
    expect(input).not.toBeDisabled();
  });

  it("should render message only when message prop is true", async () => {
    const { rerender } = render(FormGroupTest, {
      props: {
        message: true,
        messageText: "This is a message",
        slotContent: "Content",
      },
    });

    const message = screen.getByText("This is a message");
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass("bx--form__requirement");

    await rerender({ message: false });

    expect(screen.queryByText("This is a message")).not.toBeInTheDocument();
  });

  it("should announce the message only while invalid", async () => {
    const { component } = render(FormGroupTest, {
      props: { message: true, messageText: "Pick one", invalid: true },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Pick one");

    component.invalid = false;
    await tick();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("omits aria-labelledby without legendId and is named by its legend", () => {
    render(FormGroupTest, {
      props: { legendText: "Contact", slotContent: "Content" },
    });

    const fieldset = screen.getByRole("group", { name: "Contact" });
    expect(fieldset).not.toHaveAttribute("aria-labelledby");
  });

  it("should handle legendId", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Test Legend",
        legendId: "custom-legend-id",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Test Legend");
    expect(legend).toHaveAttribute("id", "custom-legend-id");

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "custom-legend-id");
  });

  it("does not copy an external aria-labelledby onto the legend id", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Test Legend",
        "aria-labelledby": "external-label",
        slotContent: "Content",
      },
    });

    expect(screen.getByText("Test Legend")).not.toHaveAttribute("id");
  });

  it("forwards click and mouse events", async () => {
    const onClick = vi.fn();
    const onMouseover = vi.fn();
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    render(FormGroupTest, {
      props: {
        slotContent: "Content",
        onClick,
        onMouseover,
        onMouseenter,
        onMouseleave,
      },
    });

    const fieldset = screen.getByRole("group");
    await user.click(fieldset);
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.hover(fieldset);
    expect(onMouseover).toHaveBeenCalled();
    expect(onMouseenter).toHaveBeenCalled();

    await user.unhover(fieldset);
    expect(onMouseleave).toHaveBeenCalled();
  });

  it("should show the error icon only while the group is invalid", async () => {
    const { rerender } = render(FormGroupTest, {
      props: {
        invalid: true,
        message: true,
        messageText: "Select at least one",
        slotContent: "Content",
      },
    });

    const message = screen.getByText("Select at least one");
    expect(message).toHaveClass("bx--form__requirement--invalid");
    expect(message.querySelector("svg")).toHaveClass(
      "bx--form__requirement-icon",
    );

    await rerender({ invalid: false });

    expect(message).not.toHaveClass("bx--form__requirement--invalid");
    expect(message.querySelector("svg")).toBeNull();
  });

  it("should describe the fieldset only while it has a message", async () => {
    const { rerender } = render(FormGroupTest, {
      props: {
        invalid: true,
        message: true,
        messageText: "Select at least one",
        slotContent: "Content",
      },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAccessibleDescription("Select at least one");

    await rerender({ message: false });

    expect(fieldset).not.toHaveAttribute("aria-describedby");
  });

  it("should handle legendId with aria-labelledby", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Legend",
        legendId: "legend-1",
        "aria-labelledby": "external-label",
        slotContent: "Content",
      },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveAttribute("id", "legend-1");

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "external-label");
  });

  // Regression: ?? for aria-labelledby so empty string is used (not legendId)
  it("should use empty aria-labelledby when passed (nullish coalescing)", () => {
    render(FormGroupTest, {
      props: {
        legendText: "Legend",
        legendId: "my-legend-id",
        "aria-labelledby": "",
        slotContent: "Content",
      },
    });
    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveAttribute("aria-labelledby", "");
  });
});
