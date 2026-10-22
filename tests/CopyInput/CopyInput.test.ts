import { fireEvent, render, screen } from "@testing-library/svelte";
import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";
import { openTooltips } from "../utils/open-tooltips";
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

  describe("reveal toggle", () => {
    it("renders a toggle that reveals and re-obscures the value", async () => {
      render(CopyInput, { props: { type: "password", revealMode: "toggle" } });

      const input = screen.getByLabelText("API token") as HTMLInputElement;
      expect(getFieldWrapper(input)).toHaveClass(
        "bx--copy-input__field-wrapper--toggle",
      );
      expect(input).toHaveAttribute("type", "password");

      const toggle = screen.getByRole("button", { name: "Show value" });
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      await user.click(toggle);
      expect(input).toHaveAttribute("type", "text");
      expect(
        screen.getByRole("button", { name: "Hide value" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Revealed: true")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Hide value" }));
      expect(input).toHaveAttribute("type", "password");
      expect(screen.getByText("Revealed: false")).toBeInTheDocument();
    });

    it("reveals a maskedValue and keeps the value revealed after blur", async () => {
      render(CopyInput, {
        props: {
          maskedValue: "secret-••••-123",
          revealMode: "toggle",
        },
      });

      const input = screen.getByLabelText("API token");
      expect(input).toHaveValue("secret-••••-123");

      await user.click(screen.getByRole("button", { name: "Show value" }));
      expect(input).toHaveValue("secret-token-123");

      await user.click(document.body);
      expect(input).toHaveValue("secret-token-123");
    });

    it("supports custom showValueLabel and hideValueLabel", async () => {
      render(CopyInput, {
        props: {
          type: "password",
          revealMode: "toggle",
          showValueLabel: "Reveal",
          hideValueLabel: "Conceal",
        },
      });

      await user.click(screen.getByRole("button", { name: "Reveal" }));

      expect(
        screen.getByRole("button", { name: "Conceal" }),
      ).toBeInTheDocument();
    });

    it("does not render the toggle for plain text", () => {
      render(CopyInput, { props: { type: "text", revealMode: "toggle" } });
      expect(
        screen.queryByRole("button", { name: "Show value" }),
      ).not.toBeInTheDocument();
    });

    it("does not render the toggle for other reveal modes", () => {
      const { unmount } = render(CopyInput, {
        props: { type: "password", revealMode: "focus" },
      });
      expect(
        screen.queryByRole("button", { name: "Show value" }),
      ).not.toBeInTheDocument();
      unmount();

      render(CopyInput, { props: { type: "password" } });
      expect(
        screen.queryByRole("button", { name: "Show value" }),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector(".bx--copy-input__field-wrapper--toggle"),
      ).not.toBeInTheDocument();
    });

    it("opens its label on keyboard focus and hands off to the copy button", async () => {
      render(CopyInput, { props: { type: "password", revealMode: "toggle" } });

      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: "Show value" })).toHaveFocus();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Show value");

      await user.tab();
      expect(
        screen.getByRole("button", { name: "Copy to clipboard" }),
      ).toHaveFocus();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Copy to clipboard");
    });

    it("disables the toggle when disabled", () => {
      render(CopyInput, {
        props: { type: "password", revealMode: "toggle", disabled: true },
      });

      expect(screen.getByRole("button", { name: "Show value" })).toBeDisabled();
    });

    it("obscures the value when revealMode switches away from toggle", async () => {
      const { rerender } = render(CopyInput, {
        props: { type: "password", revealMode: "toggle" },
      });

      await user.click(screen.getByRole("button", { name: "Show value" }));
      expect(screen.getByText("Revealed: true")).toBeInTheDocument();

      await rerender({ type: "password", revealMode: "focus" });

      expect(screen.getByText("Revealed: false")).toBeInTheDocument();
    });
  });

  describe("revealTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("re-obscures the value after revealTimeout elapses", async () => {
      render(CopyInput, {
        props: { type: "password", revealMode: "toggle", revealTimeout: 100 },
      });

      await fireEvent.click(screen.getByRole("button", { name: "Show value" }));
      expect(
        screen.getByRole("button", { name: "Hide value" }),
      ).toHaveAttribute("aria-pressed", "true");

      await vi.advanceTimersByTimeAsync(100);

      expect(
        screen.getByRole("button", { name: "Show value" }),
      ).toHaveAttribute("aria-pressed", "false");
    });

    it("clears the timeout when hidden manually before it elapses", async () => {
      render(CopyInput, {
        props: { type: "password", revealMode: "toggle", revealTimeout: 100 },
      });

      await fireEvent.click(screen.getByRole("button", { name: "Show value" }));
      await fireEvent.click(screen.getByRole("button", { name: "Hide value" }));
      await fireEvent.click(screen.getByRole("button", { name: "Show value" }));

      // The first timer would have fired here had it not been cleared.
      await vi.advanceTimersByTimeAsync(60);
      await vi.advanceTimersByTimeAsync(60);

      expect(
        screen.getByRole("button", { name: "Show value" }),
      ).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps the value revealed when revealTimeout is unset", async () => {
      render(CopyInput, {
        props: { type: "password", revealMode: "toggle" },
      });

      await fireEvent.click(screen.getByRole("button", { name: "Show value" }));
      await vi.advanceTimersByTimeAsync(60_000);

      expect(screen.getByText("Revealed: true")).toBeInTheDocument();
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
