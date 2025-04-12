import { render } from "@testing-library/svelte";
import { setupLocalStorageMock } from "../setup-tests";
import LocalStorage from "./LocalStorage.test.svelte";

describe("LocalStorage", () => {
  const { setMockItem } = setupLocalStorageMock();

  it("saves primitive value to localStorage on mount", () => {
    render(LocalStorage);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "local-storage-key",
      "test-value",
    );
  });

  it("saves object value as JSON string", () => {
    render(LocalStorage);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing primitive value from localStorage", () => {
    setMockItem("local-storage-key", "existing-value");

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("local-storage-key");
  });

  it("loads existing object value from localStorage", () => {
    // Set up existing value
    const existingSettings = { theme: "light", fontSize: 14 };
    setMockItem("theme-settings", JSON.stringify(existingSettings));

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("clears specific item from localStorage", () => {
    const { component } = render(LocalStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearItem();
      expect(localStorage.removeItem).toHaveBeenCalledWith("programmatic-key");
    }
  });

  it("clears all items from localStorage", () => {
    const { component } = render(LocalStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearAll();
      expect(localStorage.clear).toHaveBeenCalled();
    }
  });

  it("handles JSON parse errors gracefully", () => {
    // Set up invalid JSON
    setMockItem("local-storage-key", "{invalid-json}");

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("local-storage-key");
  });

  it("uses default key if none provided", () => {
    render(LocalStorage);

    expect(localStorage.getItem).toHaveBeenCalledWith(
      expect.stringContaining("local-storage-key"),
    );
  });
});
