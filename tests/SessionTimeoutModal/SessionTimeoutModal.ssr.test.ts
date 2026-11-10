// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SessionTimeoutModal from "./SessionTimeoutModal.ssr.test.svelte";

describe("SessionTimeoutModal server render", () => {
  it("renders a closed alert dialog and starts nothing", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const { document } = renderSSR(SessionTimeoutModal);

    expect(document.querySelector(".bx--modal.is-visible")).toBeNull();
    expect(
      document.querySelector('[role="alertdialog"][aria-modal="true"]'),
    ).not.toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe("");
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
    setIntervalSpy.mockRestore();
  });
});
