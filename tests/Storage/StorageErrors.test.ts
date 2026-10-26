import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import {
  absorbUnhandledRejection,
  CONSUMER_BOOM,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import StorageHarness from "./Storage.test.svelte";
import { storageCases } from "./helpers";

describe.each(storageCases)("$name errors", ({ Component, area }) => {
  const store = () => window[area];
  /** Makes every storage write throw `error` for the rest of the test. */
  const failWrites = (error: unknown) =>
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw error;
    });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("dispatches error event when a write fails", async () => {
    const quotaError = new Error("QuotaExceededError");
    failWrites(quotaError);

    const onError = vi.fn();
    render(StorageHarness, {
      props: { Component, key: "test-key", value: "test-value", onError },
    });
    await tick();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({ error: quotaError });
  });

  it("still saves and keeps the value on mount when setItem throws", async () => {
    failWrites(new DOMException("QuotaExceededError"));

    const onSave = vi.fn();
    const onError = vi.fn();
    const { component } = render(StorageHarness, {
      props: { Component, key: "new-key", value: "fresh", onSave, onError },
    });
    await tick();

    expect(onSave).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(component.value).toBe("fresh");
  });

  it("keeps in-memory value and still dispatches update when setItem throws", async () => {
    store().setItem("hardening-key", JSON.stringify("stored"));

    const onUpdate = vi.fn();
    const onError = vi.fn();
    const { component } = render(StorageHarness, {
      props: {
        Component,
        key: "hardening-key",
        value: "stored",
        onUpdate,
        onError,
      },
    });
    await tick();
    onUpdate.mockClear();

    const quotaError = new DOMException("QuotaExceededError");
    failWrites(quotaError);

    component.value = "changed";
    await tick();

    await vi.waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        prevValue: "stored",
        value: "changed",
      });
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith({ error: quotaError });
    expect(component.value).toBe("changed");
    expect(store().getItem("hardening-key")).toBe(JSON.stringify("stored"));
  });

  it("keeps persisting after a consumer's update handler throws", async () => {
    const seen: Array<{ prevValue: unknown; value: unknown }> = [];
    let shouldThrow = false;
    const { component } = render(StorageHarness, {
      props: {
        Component,
        key: "k",
        value: "v0",
        onUpdate: (detail) => {
          seen.push(detail);
          if (shouldThrow) throw new Error(CONSUMER_BOOM);
        },
      },
    });
    await tick();

    const trap = absorbUnhandledRejection(isConsumerBoom);
    shouldThrow = true;
    component.value = "v1";

    await trap.wait;
    await tick();
    trap.dispose();

    await vi.waitFor(() => {
      expect(store().getItem("k")).toBe("v1");
    });

    shouldThrow = false;
    component.value = "v2";
    await vi.waitFor(() => {
      expect(store().getItem("k")).toBe("v2");
    });

    await vi.waitFor(() => {
      expect(seen).toEqual([
        { prevValue: "v0", value: "v1" },
        { prevValue: "v1", value: "v2" },
      ]);
    });
  });
});
