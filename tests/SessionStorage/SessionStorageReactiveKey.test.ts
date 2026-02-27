import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageMock } from "../setup-tests";
import SessionStorageReactiveKey from "./SessionStorageReactiveKey.test.svelte";

describe("SessionStorage - reactive key", () => {
  const { setMockItem } = setupSessionStorageMock();

  it("should update value when key prop changes", async () => {
    setMockItem("key-a", "value-a");
    setMockItem("key-b", "value-b");

    const currentValue = "";
    const { rerender } = render(SessionStorageReactiveKey, {
      props: { storageKey: "key-a", currentValue },
    });

    await tick();
    const valueDisplay = document.querySelector('[data-testid="value"]');
    expect(valueDisplay?.textContent).toBe("value-a");

    rerender({ storageKey: "key-b" });
    await tick();

    expect(valueDisplay?.textContent).toBe("value-b");
  });

  it("should not overwrite new key with old value when key changes", async () => {
    setMockItem("user-1-settings", JSON.stringify({ theme: "dark" }));
    setMockItem("user-2-settings", JSON.stringify({ theme: "light" }));

    const { rerender } = render(SessionStorageReactiveKey, {
      props: {
        storageKey: "user-1-settings",
      },
    });

    await tick();
    const valueDisplay = document.querySelector('[data-testid="value"]');
    expect(JSON.parse(valueDisplay?.textContent || "{}")).toEqual({
      theme: "dark",
    });

    rerender({ storageKey: "user-2-settings" });
    await tick();

    expect(JSON.parse(valueDisplay?.textContent || "{}")).toEqual({
      theme: "light",
    });
    expect(sessionStorage.setItem).toHaveBeenLastCalledWith(
      "user-2-settings",
      JSON.stringify({ theme: "light" }),
    );
  });

  it("should persist current value when switching to new key with no stored value", async () => {
    setMockItem("existing-key", "existing-value");

    const { rerender } = render(SessionStorageReactiveKey, {
      props: {
        storageKey: "existing-key",
      },
    });

    await tick();
    const valueDisplay = document.querySelector('[data-testid="value"]');
    expect(valueDisplay?.textContent).toBe("existing-value");

    rerender({ storageKey: "new-key" });
    await tick();

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "new-key",
      "existing-value",
    );
  });
});
