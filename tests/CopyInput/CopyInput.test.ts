import { fireEvent, render, screen } from "@testing-library/svelte";
import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";
import { user } from "../utils/user";
import CopyInputFluidForm from "./CopyInput.fluidForm.test.svelte";
import CopyInputFluidSkeleton from "./CopyInput.fluidSkeleton.test.svelte";
import CopyInputFluidSlot from "./CopyInput.fluidSlot.test.svelte";
import CopyInput from "./CopyInput.test.svelte";
import CopyInputMultiple from "./CopyInputMultiple.test.svelte";

const getFieldWrapper = (input: HTMLElement) => {
  const fieldWrapper = input.closest(".bx--copy-input__field-wrapper");
  assert(fieldWrapper);
  return fieldWrapper;
};

describe("CopyInput", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  it("renders a read-only field with the value", () => {
    render(CopyInput);

    const input = screen.getByLabelText("API token");
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("secret-token-123");
  });

  it.each(["xs", "sm", "xl"] as const)("renders the %s size", (size) => {
    render(CopyInput, { size, inline: true });

    expect(screen.getByLabelText("API token")).toHaveClass(
      `bx--text-input--${size}`,
    );
    expect(screen.getByText("API token")).toHaveClass(
      `bx--label--inline--${size}`,
    );
  });

  it("describes the input with the inline helper text", () => {
    render(CopyInput, { props: { inline: true, helperText: "Helper text" } });

    expect(screen.getByLabelText("API token")).toHaveAccessibleDescription(
      "Helper text",
    );
  });

  it("copies the value and dispatches copy", async () => {
    const onCopy = vi.fn();
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(CopyInput, { props: { onCopy } });

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    expect(clipboard).toHaveBeenCalledWith("secret-token-123");
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("does not select the value on focus by default", async () => {
    render(CopyInput);

    const input = screen.getByLabelText("API token");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
  });

  it("selects the full value on focus when selectTextOnFocus is true", async () => {
    render(CopyInput, { props: { selectTextOnFocus: true } });

    const input = screen.getByLabelText("API token");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).toHaveBeenCalled();
  });

  it.each([
    ["focus", (input: HTMLElement) => fireEvent.focus(input)],
    [
      "hover",
      (input: HTMLElement) => fireEvent.mouseEnter(getFieldWrapper(input)),
    ],
  ] as const)(
    "stays obscured on %s when revealMode is unset",
    async (_trigger, fire) => {
      render(CopyInput, { props: { type: "password" } });

      const input = screen.getByLabelText("API token");
      expect(input).toHaveAttribute("type", "password");

      await fire(input);
      expect(input).toHaveAttribute("type", "password");
    },
  );

  it("reveals the value on focus when revealMode is focus", async () => {
    render(CopyInput, { props: { type: "password", revealMode: "focus" } });

    const input = screen.getByLabelText("API token");
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.blur(input);
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not reveal the value on hover when revealMode is focus", async () => {
    render(CopyInput, { props: { type: "password", revealMode: "focus" } });

    const input = screen.getByLabelText("API token");

    await fireEvent.mouseEnter(getFieldWrapper(input));
    expect(input).toHaveAttribute("type", "password");
  });

  it("reveals the value on hover and focus when revealMode is hover-focus", async () => {
    render(CopyInput, {
      props: { type: "password", revealMode: "hover-focus" },
    });

    const input = screen.getByLabelText("API token");
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.mouseEnter(getFieldWrapper(input));
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.mouseLeave(getFieldWrapper(input));
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.blur(input);
    expect(input).toHaveAttribute("type", "password");
  });

  // Copying an empty value would write nothing and still say "Copied!".
  it("disables the copy button while the value is empty", async () => {
    const { rerender } = render(CopyInput, { props: { value: "" } });
    const button = screen.getByRole("button", { name: "Copy to clipboard" });
    expect(button).toBeDisabled();

    await rerender({ value: "secret-token-123" });
    expect(button).toBeEnabled();
  });

  it("keeps the copy button enabled for an empty value with a custom copy", () => {
    render(CopyInput, { props: { value: "", copy: () => {} } });
    expect(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeEnabled();
  });

  it("does not reveal a disabled value on hover", async () => {
    render(CopyInput, {
      props: { type: "password", revealMode: "hover-focus", disabled: true },
    });

    const input = screen.getByLabelText("API token");
    await fireEvent.mouseEnter(getFieldWrapper(input));
    expect(input).toHaveAttribute("type", "password");
  });

  it("keeps a hover-revealed value visible over the copy button", async () => {
    render(CopyInput, {
      props: { type: "password", revealMode: "hover-focus" },
    });

    const input = screen.getByLabelText("API token");
    await user.hover(input);
    expect(input).toHaveAttribute("type", "text");

    const button = screen.getByRole("button", { name: "Copy to clipboard" });
    await user.hover(button);
    expect(input).toHaveAttribute("type", "text");

    await user.unhover(button);
    expect(input).toHaveAttribute("type", "password");
  });

  it("async copy failure shows error feedback and dispatches copy:error", async () => {
    const error = new Error("copy failed");
    const copy = vi.fn().mockRejectedValue(error);
    const onCopyError = vi.fn();

    render(CopyInput, { props: { copy, onCopyError } });

    const button = screen.getByRole("button", { name: "Copy to clipboard" });
    await user.click(button);

    expect(onCopyError).toHaveBeenCalledWith({ error });
    expect(button).toHaveClass("bx--copy-btn--fade-in");
  });

  it("describes each copy button with its field label", () => {
    render(CopyInputMultiple);

    const [token, endpoint, unlabeled] = screen.getAllByRole("button", {
      name: "Copy to clipboard",
    });
    expect(token).toHaveAccessibleDescription("API token");
    expect(endpoint).toHaveAccessibleDescription("Endpoint");
    expect(unlabeled).not.toHaveAttribute("aria-describedby");
  });

  it("dispatches mouseenter:copy-button from the copy button", () => {
    const onMouseEnterCopyButton = vi.fn();
    render(CopyInput, { props: { onMouseEnterCopyButton } });

    fireEvent.mouseEnter(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    );

    expect(onMouseEnterCopyButton).toHaveBeenCalledTimes(1);
    expect(onMouseEnterCopyButton.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  describe("fluid variant", () => {
    it("does not render fluid classes by default", () => {
      render(CopyInput);

      expect(document.querySelector(".bx--text-input--fluid")).toBeNull();
      expect(document.querySelector(".bx--text-input__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(CopyInput, {
        props: { fluid: true, helperText: "Helper text" },
      });

      const input = screen.getByLabelText("API token");
      expect(input.closest(".bx--text-input-wrapper")).toHaveClass(
        "bx--text-input--fluid",
      );
      expect(
        document.querySelector(".bx--text-input__divider"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(input).not.toHaveAttribute("aria-describedby");
    });

    it("ignores fluid for the inline variant", () => {
      render(CopyInput, { props: { fluid: true, inline: true } });

      expect(document.querySelector(".bx--text-input--fluid")).toBeNull();
    });

    it("inherits fluid from the FluidForm context", () => {
      render(CopyInputFluidForm);

      const input = screen.getByLabelText("Fluid form API token");
      expect(input.closest(".bx--text-input-wrapper")).toHaveClass(
        "bx--text-input--fluid",
      );
    });

    it("adds bx--label--slotted when fluid and labelChildren slot is used", () => {
      render(CopyInputFluidSlot);

      expect(
        screen.getByText("Custom label content").closest("label"),
      ).toHaveClass("bx--label--slotted");
    });

    it("does not add bx--label--slotted when fluid without a labelChildren slot", () => {
      render(CopyInput, { props: { fluid: true } });

      expect(screen.getByText("API token").closest("label")).not.toHaveClass(
        "bx--label--slotted",
      );
    });

    it("renders the copy button inside the fluid field wrapper", () => {
      render(CopyInput, { props: { fluid: true } });

      const button = screen.getByRole("button", { name: "Copy to clipboard" });
      const fieldWrapper = button.closest(".bx--copy-input__field-wrapper");

      expect(fieldWrapper).not.toBeNull();
      expect(fieldWrapper?.closest(".bx--text-input--fluid")).not.toBeNull();
    });
  });

  describe("skeleton", () => {
    it("renders skeleton state", () => {
      render(CopyInputSkeleton, {
        props: { "data-testid": "copy-input-skeleton" },
      });

      const skeleton = screen.getByTestId("copy-input-skeleton");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("bx--form-item");
      expect(skeleton.children).toHaveLength(2);
      expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
      expect(skeleton.children[1]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });

    it("hides the skeleton label when hideLabel is true", () => {
      render(CopyInputSkeleton, {
        props: { "data-testid": "copy-input-skeleton", hideLabel: true },
      });

      const skeleton = screen.getByTestId("copy-input-skeleton");
      expect(skeleton.children).toHaveLength(1);
      expect(skeleton.children[0]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });

    it.each(["xs", "sm", "xl"] as const)(
      "applies the %s size modifier",
      (size) => {
        const { container } = render(CopyInputSkeleton, { props: { size } });
        expect(
          container.querySelector(".bx--skeleton.bx--text-input"),
        ).toHaveClass(`bx--text-input--${size}`);
      },
    );

    it("renders fluid skeleton state", () => {
      render(CopyInputFluidSkeleton);

      const skeleton = screen.getByTestId("fluid-copy-input-skeleton");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass(
        "bx--form-item",
        "bx--text-input--fluid__skeleton",
      );
      expect(skeleton.children).toHaveLength(2);
      expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
      expect(skeleton.children[1]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });
  });
});
