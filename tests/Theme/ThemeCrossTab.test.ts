import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupStorageEventMock } from "../utils/storage-mocks";
import ThemeCrossTab from "./ThemeCrossTab.test.svelte";

describe("Theme cross-tab sync", () => {
  let documentMock: {
    setAttribute: ReturnType<typeof vi.spyOn>;
  };
  const { dispatchStorageEvent, setMockItem } = setupStorageEventMock();

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

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "white");

    dispatchStorageEvent("theme", "g100");
    await tick();

    expect(documentMock.setAttribute).toHaveBeenCalledWith("theme", "g100");
  });

  it.each([
    { desc: "is removed in another tab", stored: "g100", removed: true },
    { desc: "is not a theme", stored: "garbage", removed: false },
  ])(
    "falls back to the initial theme when the stored value $desc",
    async ({ stored, removed }) => {
      const warn = vi.spyOn(console, "warn");
      setMockItem("theme", stored);
      const { component } = render(ThemeCrossTab, { props: { theme: "g10" } });
      await tick();

      if (removed) {
        dispatchStorageEvent("theme", null);
        await tick();
      }

      expect(component.theme).toBe("g10");
      expect(document.documentElement).toHaveAttribute("theme", "g10");
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it("uses custom persistKey for cross-tab sync", async () => {
    render(ThemeCrossTab, {
      props: { persist: true, persistKey: "my-custom-theme-key" },
    });
    await tick();

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

    expect(documentMock.setAttribute.mock.calls.length).toBe(initialCallCount);
  });
});
