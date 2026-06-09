import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
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

  it("selects the full value on focus by default", async () => {
    render(CopyInput);

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).toHaveBeenCalled();
  });

  it("does not select the value on focus when selectOnFocus is false", async () => {
    render(CopyInput, { props: { selectOnFocus: false } });

    const input = screen.getByLabelText("API token") as HTMLInputElement;
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
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
});
