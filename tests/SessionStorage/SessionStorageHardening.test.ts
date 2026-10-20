import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageMock } from "../utils/storage-mocks";
import SessionStorageHardening from "./SessionStorageHardening.test.svelte";

describe("SessionStorage - storage hardening", () => {
  const { setMockItem, getMockItem } = setupSessionStorageMock();

  afterEach(() => vi.restoreAllMocks());

  it("hydrates invalid JSON as the raw string on mount", async () => {
    setMockItem("hardening-key", "{invalid-json}");

    const { component } = render(SessionStorageHardening, {
      props: { key: "hardening-key", value: "from-props" },
    });
    await tick();

    expect(component.value).toBe("{invalid-json}");
  });

  it("still saves and keeps the value on mount when setItem throws", async () => {
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    const onSave = vi.fn();
    const onError = vi.fn();
    const { component } = render(SessionStorageHardening, {
      props: { key: "new-key", value: "fresh", onSave, onError },
    });
    await tick();

    expect(onSave).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(component.value).toBe("fresh");
  });

  it("keeps in-memory value and still dispatches update when setItem throws", async () => {
    setMockItem("hardening-key", JSON.stringify("stored"));

    const onUpdate = vi.fn();
    const onError = vi.fn();
    const { component } = render(SessionStorageHardening, {
      props: { key: "hardening-key", value: "stored", onUpdate, onError },
    });
    await tick();
    onUpdate.mockClear();

    const quotaError = new DOMException("QuotaExceededError");
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw quotaError;
    });

    component.value = "changed";
    await tick();

    await vi.waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { prevValue: "stored", value: "changed" },
        }),
      );
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].detail).toEqual({ error: quotaError });
    expect(component.value).toBe("changed");
    expect(getMockItem("hardening-key")).toBe(JSON.stringify("stored"));
  });

  it("clearItem and clearAll do not throw when sessionStorage is blocked", async () => {
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });

    try {
      const { component } = render(SessionStorageHardening);
      await tick();

      expect(() => component.storageRef?.clearItem()).not.toThrow();
      expect(() => component.storageRef?.clearAll()).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(window, "sessionStorage", original);
      }
    }
  });
});
