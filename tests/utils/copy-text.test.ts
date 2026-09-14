import { copyText } from "../../src/utils/copy-text.js";

describe("copyText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // jsdom may not define execCommand; clear any stub we installed.
    // @ts-expect-error -- optional cleanup of test stub
    document.execCommand = undefined;
  });

  function stubExecCommand(result: boolean) {
    const execCommand = vi.fn().mockReturnValue(result);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: execCommand,
    });
    return execCommand;
  }

  it("resolves via navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const execCommand = stubExecCommand(true);

    await copyText("hello");

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(execCommand).not.toHaveBeenCalled();
  });

  it("falls back to execCommand when clipboard write rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const execCommand = stubExecCommand(true);

    await expect(copyText("fallback")).resolves.toBeUndefined();

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("rejects when clipboard and execCommand both fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    stubExecCommand(false);

    await expect(copyText("nope")).rejects.toThrow("Failed to copy");
  });

  it("restores focus to the previously focused element after the execCommand fallback", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    stubExecCommand(true);

    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    await copyText("x");

    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it("removes the temporary textarea even when execCommand throws", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const execCommand = vi.fn().mockImplementation(() => {
      throw new Error("boom");
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: execCommand,
    });

    await expect(copyText("nope")).rejects.toThrow("boom");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
