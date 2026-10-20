import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { fireStorageEvent, storageCases } from "./helpers";
import StorageHarness from "./Storage.test.svelte";

describe.each(storageCases)("$name sync", ({ Component, area, other }) => {
  const store = () => window[area];
  /** Fires a `storage` event for this case's storage area. */
  const fire = (init: StorageEventInit) =>
    fireStorageEvent({ storageArea: store(), ...init });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("cross-document updates", () => {
    it("does not dispatch update on mount when hydrating from existing storage", async () => {
      store().setItem("hydrate-key", JSON.stringify("persisted-value"));

      const onUpdate = vi.fn();
      const { component } = render(StorageHarness, {
        props: { Component, key: "hydrate-key", value: "initial", onUpdate },
      });
      await tick();

      expect(component.value).toBe("persisted-value");
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it.each([
      [
        "a plain string",
        "updated-from-another-tab",
        "updated-from-another-tab",
      ],
      ["a JSON value", JSON.stringify({ theme: "dark" }), { theme: "dark" }],
      ["invalid JSON as the raw string", "{invalid-json}", "{invalid-json}"],
    ])(
      "syncs %s from a storage event with a matching key",
      async (_label, newValue, expected) => {
        const { component } = render(StorageHarness, {
          props: { Component, key: "test-key", value: "initial" },
        });
        await tick();

        fire({ key: "test-key", newValue });
        await tick();

        expect(component.value).toEqual(expected);
      },
    );

    it("ignores storage events for different keys", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "my-key", value: "initial" },
      });
      await tick();

      fire({ key: "other-key", newValue: "some-value" });
      await tick();

      expect(component.value).toBe("initial");
    });

    it("ignores storage events from the other storage area", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "k", value: "mine" },
      });
      await tick();

      fire({ key: "k", newValue: "other", storageArea: window[other] });
      await tick();

      expect(component.value).toBe("mine");
    });

    it("resets value when another document removes the key", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "test-key", value: "initial" },
      });
      await tick();

      // removeItem("test-key") elsewhere fires a storage event with
      // newValue === null.
      fire({ key: "test-key", newValue: null });
      await tick();

      // The in-memory value should not silently retain the stale data;
      // otherwise the next local mutation re-persists it and defeats
      // the removal.
      expect(component.value).toBeUndefined();
    });

    it("dispatches update with prevValue when another document removes the key", async () => {
      const onUpdate = vi.fn();
      render(StorageHarness, {
        props: { Component, key: "test-key", value: "initial", onUpdate },
      });
      await tick();

      fire({ key: "test-key", newValue: null });
      await tick();

      expect(onUpdate).toHaveBeenCalledWith({
        prevValue: "initial",
        value: undefined,
      });
    });

    it("resets value when another document clears storage", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "k", value: "mine" },
      });
      await tick();

      // Storage.clear() fires a single event with a null key.
      store().clear();
      fire({ key: null, newValue: null });
      await tick();

      expect(component.value).toBeUndefined();
    });

    it("does not write back a remote value", async () => {
      const onUpdate = vi.fn();
      render(StorageHarness, {
        props: { Component, key: "k", value: "initial", onUpdate },
      });
      await tick();

      // Valid JSON that re-serializes differently ('{"a":1}').
      store().setItem("k", '{ "a": 1 }');
      fire({ key: "k", newValue: '{ "a": 1 }' });
      await tick();
      await tick();

      expect(store().getItem("k")).toBe('{ "a": 1 }');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("does not dispatch update when key changes to an existing entry", async () => {
      store().setItem("key-b", JSON.stringify("b-value"));

      const onUpdate = vi.fn();
      const { component } = render(StorageHarness, {
        props: { Component, key: "key-a", value: "a-value", onUpdate },
      });
      await tick();
      onUpdate.mockClear();

      component.key = "key-b";
      await tick();

      expect(component.value).toBe("b-value");
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("sync opt-out", () => {
    it("ignores external storage events when sync is off", async () => {
      const onUpdate = vi.fn();
      const { component } = render(StorageHarness, {
        props: { Component, key: "k", value: "initial", sync: "off", onUpdate },
      });
      await tick();

      fire({ key: "k", newValue: "from-another-document" });
      await tick();

      expect(component.value).toBe("initial");
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("still persists local value changes when sync is off", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "k", value: "initial", sync: "off" },
      });
      await tick();

      component.value = "updated-locally";
      await tick();

      expect(store().getItem("k")).toBe("updated-locally");
    });

    it("starts syncing when sync flips from off to on", async () => {
      const { component } = render(StorageHarness, {
        props: { Component, key: "k", value: "initial", sync: "off" },
      });
      await tick();

      component.sync = "on";
      await tick();

      fire({ key: "k", newValue: "now-synced" });
      await tick();

      expect(component.value).toBe("now-synced");
    });
  });
});
