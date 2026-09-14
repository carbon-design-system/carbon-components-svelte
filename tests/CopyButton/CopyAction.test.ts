import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { copy } from "../../src/CopyButton/copy.js";
import { user } from "../utils/user";
import CopyAction from "./CopyAction.test.svelte";

describe("CopyAction", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
  });

  const getButton = () => screen.getByRole("button", { name: "Copy endpoint" });

  it("copies text on click and reports state", async () => {
    const onCopy = vi.fn();
    render(CopyAction, { props: { onCopy } });

    const button = getButton();
    await user.click(button);

    expect(writeText).toHaveBeenCalledWith("https://api.acme.io/v1");
    expect(onCopy).toHaveBeenCalledWith("https://api.acme.io/v1");
    expect(button).toHaveAttribute("data-copy-state", "copied");
  });

  it("returns to idle after feedbackTimeout and reports state transitions", async () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    render(CopyAction, {
      props: { onStateChange, feedbackTimeout: 100 },
    });

    const button = getButton();
    await fireEvent.click(button);
    await vi.advanceTimersByTimeAsync(0);

    expect(button).toHaveAttribute("data-copy-state", "copied");

    await vi.advanceTimersByTimeAsync(100);

    expect(button).not.toHaveAttribute("data-copy-state");
    expect(onStateChange.mock.calls.map((call) => call[0])).toEqual([
      "pending",
      "copied",
      "idle",
    ]);

    vi.useRealTimers();
  });

  it("sets aria-busy while getText is pending and clears it on resolve", async () => {
    let resolveText: (value: string) => void = () => {};
    const getText = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveText = resolve;
        }),
    );
    render(CopyAction, { props: { text: undefined, getText } });

    const button = getButton();
    await fireEvent.click(button);
    await Promise.resolve();

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(writeText).not.toHaveBeenCalled();

    resolveText("resolved-token");
    await waitFor(() => {
      expect(button).not.toHaveAttribute("aria-busy");
    });

    expect(writeText).toHaveBeenCalledWith("resolved-token");
  });

  it("falls back to execCommand and reports an error on total failure", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(false),
    });
    const onError = vi.fn();
    const onCopy = vi.fn();
    render(CopyAction, { props: { onError, onCopy } });

    const button = getButton();
    await user.click(button);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(button).toHaveAttribute("data-copy-state", "error");
    expect(onCopy).not.toHaveBeenCalled();
  });

  it("ignores a second click while feedback is active", async () => {
    render(CopyAction);

    const button = getButton();
    await user.dblClick(button);

    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("does nothing when enabled is false", async () => {
    render(CopyAction, { props: { enabled: false } });

    const button = getButton();
    await user.click(button);

    expect(writeText).not.toHaveBeenCalled();
    expect(button).not.toHaveAttribute("data-copy-state");
  });

  it("does nothing when neither text nor getText is set", async () => {
    // An explicit `undefined` prop falls back to the fixture's default text,
    // so exercise the action directly to leave both params unset.
    const button = document.createElement("button");
    document.body.appendChild(button);
    copy(button, {});

    await user.click(button);

    expect(writeText).not.toHaveBeenCalled();
    expect(button).not.toHaveAttribute("data-copy-state");

    button.remove();
  });

  it("uses the copy override instead of the clipboard", async () => {
    const copyOverride = vi.fn().mockResolvedValue(undefined);
    render(CopyAction, { props: { copyOverride } });

    const button = getButton();
    await user.click(button);

    expect(copyOverride).toHaveBeenCalledWith("https://api.acme.io/v1");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("removes the click listener on unmount", () => {
    const { unmount } = render(CopyAction);

    const button = getButton();
    const removeEventListener = vi.spyOn(button, "removeEventListener");

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "click",
      expect.any(Function),
    );
  });
});
