import { fireEvent, render, screen } from "@testing-library/svelte";
import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";
import { user } from "../utils/user";
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

  it("disables the input and the copy button", () => {
    render(CopyInput, { props: { disabled: true } });

    expect(screen.getByLabelText("API token")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeDisabled();
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

  describe("maskedValue", () => {
    const maskedValue = "secret-••••-123";

    it("shows the masked text and copies the value", async () => {
      const clipboard = vi.spyOn(navigator.clipboard, "writeText");
      render(CopyInput, { props: { maskedValue } });

      const input = screen.getByLabelText("API token");
      expect(input).toHaveValue(maskedValue);
      expect(input).toHaveAttribute("type", "text");

      await user.click(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      );
      expect(clipboard).toHaveBeenCalledWith("secret-token-123");
    });

    it("shows the value on focus when revealMode is focus", async () => {
      render(CopyInput, { props: { maskedValue, revealMode: "focus" } });

      const input = screen.getByLabelText("API token");
      await fireEvent.focus(input);
      expect(input).toHaveValue("secret-token-123");

      await fireEvent.blur(input);
      expect(input).toHaveValue(maskedValue);
    });

    it("selects the revealed value on focus", async () => {
      render(CopyInput, {
        props: { maskedValue, revealMode: "focus", selectTextOnFocus: true },
      });

      const input = screen.getByLabelText<HTMLInputElement>("API token");
      await user.click(input);

      expect(input).toHaveValue("secret-token-123");
      expect([input.selectionStart, input.selectionEnd]).toEqual([
        0,
        "secret-token-123".length,
      ]);
    });
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

  it.each([
    ["mouseenter", "onMouseEnterCopyButton", fireEvent.mouseEnter],
    ["mouseleave", "onMouseLeaveCopyButton", fireEvent.mouseLeave],
  ] as const)(
    "dispatches %s:copy-button from the copy button",
    (_, prop, fire) => {
      const callback = vi.fn();
      render(CopyInput, { props: { [prop]: callback } });

      fire(screen.getByRole("button", { name: "Copy to clipboard" }));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    },
  );

  describe("fluid variant", () => {
    it("renders the divider", () => {
      render(CopyInput, { props: { fluid: true } });

      expect(
        document.querySelector("hr.bx--text-input__divider"),
      ).toBeInTheDocument();
    });

    it("does not add bx--label--slotted when fluid without a labelChildren slot", () => {
      render(CopyInput, { props: { fluid: true } });

      expect(screen.getByText("API token").closest("label")).not.toHaveClass(
        "bx--label--slotted",
      );
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
  });
});
