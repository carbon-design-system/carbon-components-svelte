import { render } from "@testing-library/svelte";
import { setupSessionStorageMock } from "../setup-tests";
import SessionStoragePrimitive from "./SessionStoragePrimitive.test.svelte";

describe("SessionStorage - Primitive Values", () => {
  const { setMockItem } = setupSessionStorageMock();
  let consoleLog: Console["log"];

  beforeEach(() => {
    consoleLog = vi.spyOn(console, "log");
  });

  it("saves primitive value to sessionStorage on mount", () => {
    render(SessionStoragePrimitive);
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "test-key",
      "test-value",
    );
  });

  it("loads existing primitive value from sessionStorage", () => {
    setMockItem("test-key", "existing-value");

    render(SessionStoragePrimitive);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("test-key");
  });

  it("dispatches save event when setting initial value", () => {
    render(SessionStoragePrimitive);
    expect(consoleLog).toHaveBeenCalledWith("save event");
  });

  it("handles invalid values gracefully", () => {
    setMockItem("test-key", "{invalid-value}");

    render(SessionStoragePrimitive);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("test-key");
  });
});
