/** Defines `target[key]` for the current test and restores the previous own property (or removes it) afterwards. */
function stubProperty(target: object, key: string, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value,
  });
  onTestFinished(() => {
    if (original) {
      Object.defineProperty(target, key, original);
    } else {
      Reflect.deleteProperty(target, key);
    }
  });
}

/** Stubs `navigator.clipboard.writeText` (resolving by default) and restores the original after the test. */
export function mockClipboard(
  writeText = vi
    .fn<(text: string) => Promise<void>>()
    .mockResolvedValue(undefined),
) {
  stubProperty(navigator, "clipboard", { writeText });
  return writeText;
}

/** Stubs `document.execCommand` to return `result` and restores the original after the test. */
export function mockExecCommand(result: boolean) {
  const execCommand = vi.fn().mockReturnValue(result);
  stubProperty(document, "execCommand", execCommand);
  return execCommand;
}

/** Removes floating-portal elements left behind in `document.body`. */
export function removeFloatingPortals() {
  for (const portal of document.querySelectorAll("[data-floating-portal]")) {
    portal.remove();
  }
}
