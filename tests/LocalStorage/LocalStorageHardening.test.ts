import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupLocalStorageMock } from "../utils/storage-mocks";
import LocalStorageHardening from "./LocalStorageHardening.test.svelte";

describe("LocalStorage - storage hardening", () => {
  const { setMockItem } = setupLocalStorageMock();

  afterEach(() => vi.restoreAllMocks());

  it("hydrates invalid JSON as the raw string on mount", async () => {
    setMockItem("hardening-key", "{invalid-json}");

    const { component } = render(LocalStorageHardening, {
      props: { key: "hardening-key", value: "from-props" },
    });
    await tick();

    expect(component.value).toBe("{invalid-json}");
  });

  it("does not throw on mount when setItem throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    const onSave = vi.fn();
    const { component } = render(LocalStorageHardening, {
      props: { key: "new-key", value: "fresh", onSave },
    });
    await tick();

    expect(onSave).toHaveBeenCalled();
    expect(component.value).toBe("fresh");
  });

  it("keeps in-memory value and still dispatches update when setItem throws", async () => {
    setMockItem("hardening-key", JSON.stringify("stored"));

    const onUpdate = vi.fn();
    const { component } = render(LocalStorageHardening, {
      props: { key: "hardening-key", value: "stored", onUpdate },
    });
    await tick();
    onUpdate.mockClear();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    component.value = "changed";
    await tick();

    expect(component.value).toBe("changed");
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { prevValue: "stored", value: "changed" },
      }),
    );
  });

  it("clearItem and clearAll do not throw when localStorage is blocked", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });

    try {
      const { component } = render(LocalStorageHardening);
      await tick();

      expect(() => component.storageRef?.clearItem()).not.toThrow();
      expect(() => component.storageRef?.clearAll()).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(window, "localStorage", original);
      }
    }
  });
});
