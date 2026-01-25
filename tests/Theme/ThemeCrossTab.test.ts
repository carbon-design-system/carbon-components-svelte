import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupStorageEventMock } from "../setup-tests";
import ThemeCrossTab from "./ThemeCrossTab.test.svelte";

describe("Theme cross-tab sync", () => {
  let documentMock: {
    setAttribute: ReturnType<typeof vi.spyOn>;
  };
  const { dispatchStorageEvent } = setupStorageEventMock();

  beforeEach(() => {
    documentMock = {
      setAttribute: vi.spyOn(
        document.documentElement,
        "setAttribute",
      ) as unknown as ReturnType<typeof vi.spyOn>,
    };
  });

  it("updates theme when storage event fires from another tab", async () => {
    render(ThemeCrossTab, {
      props: { persist: true, persistKey: "theme" },
    });
    await tick();

    // Verify initial theme
    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "white");

    // Simulate theme change from another tab
    dispatchStorageEvent("theme", "g100");
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g100");
  });

  it("uses custom persistKey for cross-tab sync", async () => {
    render(ThemeCrossTab, {
      props: { persist: true, persistKey: "my-custom-theme-key" },
    });
    await tick();

    // Should not respond to default "theme" key
    dispatchStorageEvent("theme", "g90");
    await tick();

    // Theme should still be white
    const lastCall =
      documentMock.setAttribute.mock.calls[
        documentMock.setAttribute.mock.calls.length - 1
      ];
    expect(lastCall).toEqual(["theme", "white"]);

    // Should respond to custom key
    dispatchStorageEvent("my-custom-theme-key", "g90");
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g90");
  });

  it("does not sync when persist is false", async () => {
    render(ThemeCrossTab, {
      props: { persist: false },
    });
    await tick();

    // Storage event listeners should not be registered for this component
    // since LocalStorage is not rendered when persist=false
    const initialCallCount = documentMock.setAttribute.mock.calls.length;

    dispatchStorageEvent("theme", "g100");
    await tick();

    // No additional calls should have been made
    expect(documentMock.setAttribute.mock.calls.length).toBe(initialCallCount);
  });
});
