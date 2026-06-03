import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupLocalStorageMock } from "../utils/storage-mocks";
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

  it("loads existing primitive value from localStorage", async () => {
    setMockItem("test-key", "existing-value");

    const { component } = render(LocalStoragePrimitive);
    await tick();

    expect(component.value).toBe("existing-value");
  });

  it("dispatches save event when setting initial value", () => {
    render(LocalStoragePrimitive);
    expect(consoleLog).toHaveBeenCalledWith("save event");
  });
});
