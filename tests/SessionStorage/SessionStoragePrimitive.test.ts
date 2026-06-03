import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageMock } from "../utils/storage-mocks";
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

  it("loads existing primitive value from sessionStorage", async () => {
    setMockItem("test-key", "existing-value");

    const { component } = render(SessionStoragePrimitive);
    await tick();

    expect(component.value).toBe("existing-value");
  });

  it("dispatches save event when setting initial value", () => {
    render(SessionStoragePrimitive);
    expect(consoleLog).toHaveBeenCalledWith("save event");
  });
});
