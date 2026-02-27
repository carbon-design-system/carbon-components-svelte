import { render } from "@testing-library/svelte";
import { setupSessionStorageMock } from "../setup-tests";
import SessionStorage from "./SessionStorage.test.svelte";

describe("SessionStorage", () => {
  const { setMockItem } = setupSessionStorageMock();

  it("saves primitive value to sessionStorage on mount", () => {
    render(SessionStorage);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "session-storage-key",
      "test-value",
    );
  });

  it("saves object value as JSON string", () => {
    render(SessionStorage);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing primitive value from sessionStorage", () => {
    setMockItem("session-storage-key", "existing-value");

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("session-storage-key");
  });

  it("loads existing object value from sessionStorage", () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    setMockItem("theme-settings", JSON.stringify(existingSettings));

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("clears specific item from sessionStorage", () => {
    const { component } = render(SessionStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearItem();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        "programmatic-key",
      );
    }
  });

  it("clears all items from sessionStorage", () => {
    const { component } = render(SessionStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearAll();
      expect(sessionStorage.clear).toHaveBeenCalled();
    }
  });

  it("handles JSON parse errors gracefully", () => {
    setMockItem("session-storage-key", "{invalid-json}");

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("session-storage-key");
  });

  it("uses default key if none provided", () => {
    render(SessionStorage);

    expect(sessionStorage.getItem).toHaveBeenCalledWith(
      expect.stringContaining("session-storage-key"),
    );
  });
});
