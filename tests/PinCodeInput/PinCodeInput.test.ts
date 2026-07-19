import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PinCodeInputFluidForm from "./PinCodeInput.fluidForm.test.svelte";
import PinCodeInputFluidSkeleton from "./PinCodeInput.fluidSkeleton.test.svelte";
import PinCodeInputFluidSlot from "./PinCodeInput.fluidSlot.test.svelte";
import PinCodeInputSkeleton from "./PinCodeInput.skeleton.test.svelte";
import PinCodeInput from "./PinCodeInput.test.svelte";

const getInputs = () => screen.getAllByRole("textbox") as HTMLInputElement[];

const getFieldset = (container: HTMLElement) =>
  container.querySelector(".bx--pin-code-input__fieldset");

const getFieldsWrapper = (container: HTMLElement) =>
  container.querySelector(".bx--pin-code-input__fields");

const getRequirement = (container: HTMLElement) =>
  container.querySelector(".bx--form-requirement");

describe("PinCodeInput", () => {
  it("renders `count` segments by default", () => {
    render(PinCodeInput);
    expect(getInputs()).toHaveLength(4);
    for (const input of getInputs()) {
      expect(input).not.toHaveAttribute("placeholder");
    }
  });

  it("renders a custom number of segments", () => {
    render(PinCodeInput, { props: { count: 6 } });
    expect(getInputs()).toHaveLength(6);
  });

  it("applies the extra-small size to each field", () => {
    render(PinCodeInput, { props: { size: "xs" } });
    for (const input of getInputs()) {
      expect(input).toHaveClass("bx--text-input--xs");
    }
  });

  it("auto-advances focus on input", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1");
    expect(inputs[1]).toHaveFocus();

    await user.keyboard("2");
    expect(inputs[2]).toHaveFocus();
  });

  it("rejects characters that do not match the numeric type", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    expect(inputs[0].value).toBe("");

    await user.keyboard("7");
    expect(inputs[0].value).toBe("7");
  });

  it("allows letters when type is alphanumeric", async () => {
    render(PinCodeInput, { props: { type: "alphanumeric" } });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    expect(inputs[0].value).toBe("a");
  });

  it("moves focus back and clears on backspace when empty", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("12");
    expect(inputs[2]).toHaveFocus();

    // inputs[2] is empty -> backspace moves to and clears inputs[1]
    await user.keyboard("{Backspace}");
    expect(inputs[1]).toHaveFocus();
    expect(inputs[1].value).toBe("");
  });

  it("binds the assembled value and code", async () => {
    const { component } = render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("123");
    await tick();

    expect(component.value).toBe("123");
    expect(component.code).toEqual(["1", "2", "3", ""]);
  });

  it("dispatches complete and change events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("1234");
    await tick();

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      true,
    );
    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) =>
          event === "complete" &&
          (detail as { value: string }).value === "1234",
      ),
    ).toBe(true);
  });

  it("does not dispatch complete on initial render with a seeded value", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PinCodeInput, { props: { value: "1234" } });

    expect(consoleLog.mock.calls.some(([event]) => event === "complete")).toBe(
      false,
    );
  });

  it("distributes a full pasted code across all segments", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "4321" },
    });
    await tick();

    expect(component.value).toBe("4321");
    expect(inputs[3]).toHaveFocus();
    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) =>
          event === "paste" && (detail as { value: string }).value === "4321",
      ),
    ).toBe(true);
  });

  it("does not dispatch paste when the clipboard has no valid characters", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "abcd" },
    });
    await tick();

    expect(consoleLog.mock.calls.some(([event]) => event === "paste")).toBe(
      false,
    );
  });

  it("dispatches paste with whitespace stripped from the clipboard value", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(PinCodeInput);
    const inputs = getInputs();

    inputs[0].focus();
    await fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => "43 21" },
    });
    await tick();

    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) =>
          event === "paste" && (detail as { value: string }).value === "4321",
      ),
    ).toBe(true);
  });

  it("masks the segments when mask is true", () => {
    render(PinCodeInput, { props: { mask: true } });
    const inputs = getInputs();
    // Masking is applied with CSS (revealed on focus via `:not(:focus)`),
    // so the segments stay text inputs rather than switching to password.
    expect(inputs).toHaveLength(4);
    for (const input of inputs) {
      expect(input).toHaveClass("bx--pin-code-input__field--masked");
    }
  });

  it("does not mask the segments by default", () => {
    render(PinCodeInput);
    for (const input of getInputs()) {
      expect(input).not.toHaveClass("bx--pin-code-input__field--masked");
    }
  });

  it("displays uppercase but retains the original value", async () => {
    const { component } = render(PinCodeInput, {
      props: { type: "alphanumeric", uppercase: true },
    });
    const inputs = getInputs();

    inputs[0].focus();
    await user.keyboard("a");
    await tick();

    expect(component.value).toBe("a");
    expect(inputs[0]).toHaveClass("bx--pin-code-input__field--uppercase");
  });

  it("focuses the first empty segment when the label is clicked", async () => {
    render(PinCodeInput);
    const inputs = getInputs();

    await fireEvent.click(screen.getByText("Verification code"));
    expect(inputs[0]).toHaveFocus();
  });

  it("focuses the first empty segment when the legend is activated with the keyboard", async () => {
    render(PinCodeInput, { props: { id: "pin-legend" } });
    const inputs = getInputs();
    const legend = screen.getByText("Verification code");

    legend.focus();
    await fireEvent.keyDown(legend, { key: "Enter" });
    expect(inputs[0]).toHaveFocus();
  });

  it("exposes OTP-friendly input attributes on every segment", () => {
    render(PinCodeInput);
    for (const input of getInputs()) {
      expect(input).toHaveAttribute("spellcheck", "false");
      expect(input).toHaveAttribute("autocorrect", "off");
      expect(input).toHaveAttribute("autocapitalize", "off");
    }
  });

  it("selects a segment's value on focus when selectTextOnFocus is true", async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, "select");
    render(PinCodeInput, {
      props: { selectTextOnFocus: true, value: "0182" },
    });
    const inputs = getInputs();

    inputs[2].focus();
    await tick();

    expect(select).toHaveBeenCalled();
    select.mockRestore();
  });

  describe("invalid and warning states", () => {
    it("renders the invalid state with visible requirement text after the fields wrapper", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-invalid",
          invalid: true,
          invalidText: "Incorrect code",
        },
      });
      const fields = getFieldsWrapper(container);
      const message = screen.getByText("Incorrect code");
      const inputs = getInputs();

      expect(fields).toHaveAttribute("data-invalid", "true");
      expect(fields).toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields?.nextElementSibling).toBe(message);
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "error-pin-invalid");
      expect(message).toBeVisible();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).toBeInTheDocument();

      for (const input of inputs) {
        expect(input).toHaveClass("bx--text-input--invalid");
        expect(input).toHaveAttribute("data-invalid", "true");
        expect(input).toHaveAttribute("aria-invalid", "true");
      }

      expect(getFieldset(container)).toHaveAttribute(
        "aria-describedby",
        "error-pin-invalid",
      );
      for (const input of inputs) {
        expect(input).not.toHaveAttribute("aria-describedby");
      }
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    it("renders the warning state with visible requirement text after the fields wrapper", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-warn",
          warn: true,
          warnText: "Code expiring soon",
        },
      });
      const fields = getFieldsWrapper(container);
      const message = screen.getByText("Code expiring soon");
      const inputs = getInputs();

      expect(fields).toHaveAttribute("data-warn", "true");
      expect(fields).toHaveClass("bx--pin-code-input__fields--warning");
      expect(fields?.nextElementSibling).toBe(message);
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "warn-pin-warn");
      expect(message).toBeVisible();
      expect(
        container.querySelector(".bx--pin-code-input__icon--warning"),
      ).toBeInTheDocument();

      for (const input of inputs) {
        expect(input).toHaveClass("bx--text-input--warning");
        expect(input).toHaveAttribute("data-warn", "true");
        expect(input).not.toHaveAttribute("aria-invalid");
      }

      expect(getFieldset(container)).toHaveAttribute(
        "aria-describedby",
        "warn-pin-warn",
      );
      expect(
        container.querySelector(".bx--pin-code-input__icon--warning"),
      ).toHaveAttribute("aria-hidden", "true");
    });

    it("prefers invalid over warning when both props are set", () => {
      const { container } = render(PinCodeInput, {
        props: {
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
        },
      });

      expect(screen.getByText("Incorrect code")).toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getFieldsWrapper(container)).toHaveAttribute(
        "data-invalid",
        "true",
      );
      expect(getFieldsWrapper(container)).not.toHaveAttribute("data-warn");
    });

    it("hides helper text when invalid or warning", () => {
      const { rerender } = render(PinCodeInput, {
        props: {
          helperText: "Enter the code sent to your device",
          invalid: true,
          invalidText: "Incorrect code",
        },
      });

      expect(
        screen.queryByText("Enter the code sent to your device"),
      ).not.toBeInTheDocument();

      rerender({
        helperText: "Enter the code sent to your device",
        invalid: false,
        warn: true,
        warnText: "Code expiring soon",
      });

      expect(
        screen.queryByText("Enter the code sent to your device"),
      ).not.toBeInTheDocument();
    });

    it("suppresses invalid and warning UI when disabled", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-disabled",
          disabled: true,
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
          helperText: "Enter the code sent to your device",
        },
      });
      const fields = getFieldsWrapper(container);
      const inputs = getInputs();

      expect(screen.queryByText("Incorrect code")).not.toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getRequirement(container)).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).not.toBeInTheDocument();
      expect(fields).not.toHaveAttribute("data-invalid");
      expect(fields).not.toHaveAttribute("data-warn");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--warning");

      for (const input of inputs) {
        expect(input).toBeDisabled();
        expect(input).not.toHaveClass("bx--text-input--invalid");
        expect(input).not.toHaveClass("bx--text-input--warning");
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("data-invalid");
        expect(input).not.toHaveAttribute("data-warn");
      }

      expect(getFieldset(container)).toHaveAttribute(
        "aria-describedby",
        "helper-pin-disabled",
      );

      expect(
        screen.getByText("Enter the code sent to your device"),
      ).toBeInTheDocument();
    });

    it("suppresses invalid and warning UI when read-only", () => {
      const { container } = render(PinCodeInput, {
        props: {
          id: "pin-readonly",
          readonly: true,
          value: "0182",
          invalid: true,
          invalidText: "Incorrect code",
          warn: true,
          warnText: "Code expiring soon",
        },
      });
      const fields = getFieldsWrapper(container);
      const inputs = getInputs();

      expect(screen.queryByText("Incorrect code")).not.toBeInTheDocument();
      expect(screen.queryByText("Code expiring soon")).not.toBeInTheDocument();
      expect(getRequirement(container)).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--pin-code-input__icon"),
      ).not.toBeInTheDocument();
      expect(fields).not.toHaveAttribute("data-invalid");
      expect(fields).not.toHaveAttribute("data-warn");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--invalid");
      expect(fields).not.toHaveClass("bx--pin-code-input__fields--warning");

      for (const input of inputs) {
        expect(input).toHaveAttribute("readonly");
        expect(input).toHaveAttribute("aria-readonly", "true");
        expect(input).not.toHaveClass("bx--text-input--invalid");
        expect(input).not.toHaveClass("bx--text-input--warning");
        expect(input).not.toHaveAttribute("aria-invalid");
        expect(input).not.toHaveAttribute("data-invalid");
        expect(input).not.toHaveAttribute("data-warn");
        expect(input).not.toHaveAttribute("aria-describedby");
      }

      expect(getFieldset(container)).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("fluid variant", () => {
    it("does not render fluid classes by default", () => {
      render(PinCodeInput);

      expect(document.querySelector(".bx--pin-code-input--fluid")).toBeNull();
      expect(document.querySelector(".bx--pin-code-input__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(PinCodeInput, {
        props: { fluid: true, helperText: "Helper text" },
      });

      expect(document.querySelector(".bx--form-item")).toHaveClass(
        "bx--pin-code-input--fluid",
      );
      expect(
        document.querySelector(".bx--pin-code-input__divider"),
      ).toBeInTheDocument();
      expect(
        document.querySelector(".bx--pin-code-input__segments"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(getFieldset(document.body)).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("uses the fluid default placeholder", () => {
      render(PinCodeInput, { props: { fluid: true } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "–");
      }
    });

    it("allows placeholder override in the fluid variant", () => {
      render(PinCodeInput, { props: { fluid: true, placeholder: "•" } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "•");
      }
    });

    it("allows placeholder override in the non-fluid variant", () => {
      render(PinCodeInput, { props: { placeholder: "0" } });

      for (const input of getInputs()) {
        expect(input).toHaveAttribute("placeholder", "0");
      }
    });

    it("renders the error message inside the fields wrapper", () => {
      render(PinCodeInput, {
        props: {
          fluid: true,
          invalid: true,
          invalidText: "Incorrect code",
          id: "pin-fluid-invalid",
        },
      });

      const message = screen.getByText("Incorrect code");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "error-pin-fluid-invalid");
      expect(message.closest(".bx--pin-code-input__fields")).not.toBeNull();
      expect(message.closest(".bx--pin-code-input__message")).not.toBeNull();
      expect(
        message
          .closest(".bx--pin-code-input__message")
          ?.querySelector(".bx--pin-code-input__icon"),
      ).toBeInTheDocument();
      expect(getFieldset(document.body)).toHaveAttribute(
        "aria-describedby",
        "error-pin-fluid-invalid",
      );
    });

    it("renders the warning message inside the fields wrapper", () => {
      render(PinCodeInput, {
        props: {
          fluid: true,
          warn: true,
          warnText: "Code expiring soon",
          id: "pin-fluid-warn",
        },
      });

      const message = screen.getByText("Code expiring soon");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message).toHaveAttribute("id", "warn-pin-fluid-warn");
      expect(message.closest(".bx--pin-code-input__fields")).not.toBeNull();
    });

    it.each([{ disabled: true }, { readonly: true }])(
      "suppresses invalid and warn states when %o",
      (props) => {
        const { container } = render(PinCodeInput, {
          props: {
            fluid: true,
            invalid: true,
            invalidText: "Incorrect code",
            warn: true,
            warnText: "Code expiring soon",
            ...props,
          },
        });

        expect(screen.queryByText("Incorrect code")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Code expiring soon"),
        ).not.toBeInTheDocument();
        expect(container.querySelector("[data-invalid]")).toBeNull();
        expect(container.querySelector(".bx--pin-code-input__icon")).toBeNull();
      },
    );

    it("inherits fluid from the FluidForm context", () => {
      render(PinCodeInputFluidForm);

      expect(document.querySelector(".bx--form-item")).toHaveClass(
        "bx--pin-code-input--fluid",
      );
    });

    it("marks the label as slotted when fluid", () => {
      render(PinCodeInputFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(PinCodeInputFluidSlot, { props: { fluid: false } });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });
  });

  it("disables every segment", () => {
    render(PinCodeInput, { props: { disabled: true } });
    for (const input of getInputs()) {
      expect(input).toBeDisabled();
    }
  });

  it("does not allow edits in the read-only state", async () => {
    const { component } = render(PinCodeInput, {
      props: { readonly: true, value: "0182" },
    });
    const inputs = getInputs();

    for (const input of inputs) {
      expect(input).toHaveAttribute("readonly");
    }

    inputs[0].focus();
    await user.keyboard("9");
    await tick();
    expect(component.value).toBe("0182");
  });

  it("renders fluid skeleton state", () => {
    render(PinCodeInputFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-pin-code-input-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      "bx--form-item",
      "bx--text-input--fluid__skeleton",
    );
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--skeleton", "bx--text-input");
  });

  it("renders skeleton state", () => {
    render(PinCodeInputSkeleton);

    const skeleton = screen.getByTestId("pin-code-input-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--form-item");
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--skeleton", "bx--text-input");
  });

  it("hides the skeleton label when hideLabel is true", () => {
    render(PinCodeInputSkeleton, { props: { hideLabel: true } });

    const skeleton = screen.getByTestId("pin-code-input-skeleton");
    expect(skeleton.children).toHaveLength(1);
    expect(skeleton.children[0]).toHaveClass("bx--skeleton", "bx--text-input");
  });
});
