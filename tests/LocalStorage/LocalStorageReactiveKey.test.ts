import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupLocalStorageMock } from "../setup-tests";
import LocalStorageReactiveKey from "./LocalStorageReactiveKey.test.svelte";

// Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1204
describe("LocalStorage - reactive key", () => {
  const { setMockItem } = setupLocalStorageMock();

  it("should update value when key prop changes", async () => {
    setMockItem("key-a", "value-a");
    setMockItem("key-b", "value-b");

    const { component } = render(LocalStorageReactiveKey, {
      props: { storageKey: "key-a" },
    });

    await tick();
    expect(component.currentValue).toBe("value-a");

    component.$set({ storageKey: "key-b" });
    await tick();

    expect(component.currentValue).toBe("value-b");
  });

  it("should not overwrite new key with old value when key changes", async () => {
    setMockItem("user-1-settings", JSON.stringify({ theme: "dark" }));
    setMockItem("user-2-settings", JSON.stringify({ theme: "light" }));

    const { component } = render(LocalStorageReactiveKey, {
      props: {
        storageKey: "user-1-settings",
      },
    });

    await tick();
    expect(component.currentValue).toEqual({ theme: "dark" });

    component.$set({ storageKey: "user-2-settings" });
    await tick();

    expect(component.currentValue).toEqual({ theme: "light" });
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      "user-2-settings",
      JSON.stringify({ theme: "light" }),
    );
  });

  it("should persist current value when switching to new key with no stored value", async () => {
    setMockItem("existing-key", "existing-value");

    const { component } = render(LocalStorageReactiveKey, {
      props: {
        storageKey: "existing-key",
      },
    });

    await tick();
    expect(component.currentValue).toBe("existing-value");

    component.$set({ storageKey: "new-key" });
    await tick();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "new-key",
      "existing-value",
    );
  });
});
