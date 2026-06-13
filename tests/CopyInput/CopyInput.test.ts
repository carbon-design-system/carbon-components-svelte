import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import CopyInputFluidForm from "./CopyInput.fluidForm.test.svelte";
import CopyInputFluidSkeleton from "./CopyInput.fluidSkeleton.test.svelte";
import CopyInputFluidSlot from "./CopyInput.fluidSlot.test.svelte";
import CopyInputSkeleton from "./CopyInput.skeleton.test.svelte";
import CopyInput from "./CopyInput.test.svelte";
import CopyInputAsync from "./CopyInputAsync.test.svelte";
import CopyInputAsyncDoubleClick from "./CopyInputAsyncDoubleClick.test.svelte";
import CopyInputMouseEnter from "./CopyInputMouseEnter.test.svelte";

describe("CopyInput", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  it("renders a read-only field with the value", () => {
    render(CopyInput);

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
    expect(input.value).toBe("secret-token-123");
  });

  it("copies the value and dispatches copy", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(CopyInput);

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    expect(clipboard).toHaveBeenCalledWith("secret-token-123");
    expect(consoleLog).toHaveBeenCalledWith("copied");
  });

  it("does not select the value on focus by default", async () => {
    render(CopyInput);

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
  });

  it("selects the full value on focus when selectOnFocus is true", async () => {
    render(CopyInput, { props: { selectOnFocus: true } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).toHaveBeenCalled();
  });

  it("stays obscured on focus when revealMode is unset", async () => {
    render(CopyInput, { props: { type: "password" } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("type", "password");
  });

  it("reveals the value on focus when revealMode is focus", async () => {
    render(CopyInput, { props: { type: "password", revealMode: "focus" } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.blur(input);
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not reveal the value on hover when revealMode is focus", async () => {
    render(CopyInput, { props: { type: "password", revealMode: "focus" } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;

    await fireEvent.mouseEnter(input);
    expect(input).toHaveAttribute("type", "password");
  });

  it("reveals the value on hover and focus when revealMode is hover-focus", async () => {
    render(CopyInput, {
      props: { type: "password", revealMode: "hover-focus" },
    });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.mouseEnter(input);
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.mouseLeave(input);
    expect(input).toHaveAttribute("type", "password");

    await fireEvent.focus(input);
    expect(input).toHaveAttribute("type", "text");

    await fireEvent.blur(input);
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not reveal the obscured value on hover when revealMode is unset", async () => {
    render(CopyInput, { props: { type: "password" } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    const fieldWrapper = input.closest(".bx--copy-input__field-wrapper");
    expect(fieldWrapper).toBeInTheDocument();

    await fireEvent.mouseEnter(input);
    await fireEvent.mouseEnter(fieldWrapper as Element);
    expect(input).toHaveAttribute("type", "password");
  });

  it("async copy delays feedback until resolved", async () => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CopyInputAsync, { props: { copy } });

    const button = screen.getByRole("button", { name: "Async copy" });
    fireEvent.click(button);
    await Promise.resolve();

    expect(copy).toHaveBeenCalledWith("secret-token-123");
    expect(copy).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");

    resolveCopy();
    await waitFor(() => {
      expect(button).toHaveClass("bx--copy-btn--fade-in");
    });

    expect(button).not.toHaveAttribute("aria-busy");
    expect(button.querySelector(".bx--copy-btn__feedback")).toHaveTextContent(
      "Copied!",
    );
  });

  it("async copy failure does not show feedback and dispatches copy:error", async () => {
    const error = new Error("copy failed");
    const copy = vi.fn().mockRejectedValue(error);
    const onCopyError = vi.fn();

    render(CopyInputAsync, {
      props: { copy, onCopyError },
    });

    const button = screen.getByRole("button", { name: "Async copy" });
    await user.click(button);

    expect(onCopyError).toHaveBeenCalledWith({ error });
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");

    await user.click(button);
    expect(copy).toHaveBeenCalledTimes(2);
  });

  it("dispatches mouseenter:copy-button from the copy button", () => {
    const onMouseEnterCopyButton = vi.fn();
    render(CopyInputMouseEnter, { props: { onMouseEnterCopyButton } });

    fireEvent.mouseEnter(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    );

    expect(onMouseEnterCopyButton).toHaveBeenCalledTimes(1);
    expect(onMouseEnterCopyButton.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it("does not dispatch mouseenter:copy-button from the input field", () => {
    const onMouseEnterCopyButton = vi.fn();
    render(CopyInputMouseEnter, { props: { onMouseEnterCopyButton } });

    fireEvent.mouseEnter(screen.getByLabelText("API token"));

    expect(onMouseEnterCopyButton).not.toHaveBeenCalled();
  });

  it("should not copy again while async copy is in flight", async () => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CopyInputAsyncDoubleClick, { props: { copy } });

    const button = screen.getByRole("button", { name: "Async double click" });
    fireEvent.click(button);
    await Promise.resolve();
    fireEvent.click(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copy events: 0")).toBeInTheDocument();

    resolveCopy();
    await waitFor(() => {
      expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
    });
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
      render(CopyInputSkeleton);

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
      render(CopyInputSkeleton, { props: { hideLabel: true } });

      const skeleton = screen.getByTestId("copy-input-skeleton");
      expect(skeleton.children).toHaveLength(1);
      expect(skeleton.children[0]).toHaveClass(
        "bx--skeleton",
        "bx--text-input",
      );
    });

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
