import { render } from "@testing-library/svelte";
import { setupLocalStorageMock } from "../setup-tests";
import LocalStoragePrimitive from "./LocalStoragePrimitive.test.svelte";

describe("LocalStorage - Primitive Values", () => {
  const { setMockItem } = setupLocalStorageMock();
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  it("saves primitive value to localStorage on mount", () => {
    render(LocalStoragePrimitive);
    expect(localStorage.setItem).toHaveBeenCalledWith("test-key", "test-value");
  });

  it("loads existing primitive value from localStorage", () => {
    setMockItem("test-key", "existing-value");

    render(LocalStoragePrimitive);
    expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
  });

  it("dispatches save event when setting initial value", () => {
    render(LocalStoragePrimitive);
    expect(consoleLog).toHaveBeenCalledWith("save event");
  });

  it("handles invalid values gracefully", () => {
    setMockItem("test-key", "{invalid-value}");

    render(LocalStoragePrimitive);
    expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
  });
});
