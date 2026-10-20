import { render } from "@testing-library/svelte";
import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
import { tick } from "svelte";
import StorageBinding from "./StorageBinding.test.svelte";

// Shared engine behind LocalStorage and SessionStorage, tested with real
// storage and real StorageEvents (the storage-mocks events have no area).
const cases = [
  { name: "LocalStorage", Component: LocalStorage, area: "localStorage" },
  { name: "SessionStorage", Component: SessionStorage, area: "sessionStorage" },
] as const;

const otherArea = {
  localStorage: "sessionStorage",
  sessionStorage: "localStorage",
} as const;

function fireStorageEvent(init: StorageEventInit) {
  window.dispatchEvent(new StorageEvent("storage", init));
}

describe("StorageBinding", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each(cases)(
    "$name ignores storage events from the other storage area",
    async ({ Component, area }) => {
      const { component } = render(StorageBinding, {
        props: { Component, key: "k", value: "mine" },
      });
      await tick();

      fireStorageEvent({
        key: "k",
        newValue: "other",
        storageArea: window[otherArea[area]],
      });
      await tick();

      expect(component.value).toBe("mine");
    },
  );

  it.each(cases)(
    "$name resets value when another document clears storage",
    async ({ Component, area }) => {
      const { component } = render(StorageBinding, {
        props: { Component, key: "k", value: "mine" },
      });
      await tick();

      // Storage.clear() fires a single event with a null key.
      window[area].clear();
      fireStorageEvent({
        key: null,
        newValue: null,
        storageArea: window[area],
      });
      await tick();

      expect(component.value).toBeUndefined();
    },
  );

  it.each(cases)(
    "$name does not write back a remote value",
    async ({ Component, area }) => {
      const onUpdate = vi.fn();
      render(StorageBinding, {
        props: { Component, key: "k", value: "initial", onUpdate },
      });
      await tick();

      // Valid JSON that re-serializes differently ('{"a":1}').
      window[area].setItem("k", '{ "a": 1 }');
      fireStorageEvent({
        key: "k",
        newValue: '{ "a": 1 }',
        storageArea: window[area],
      });
      await tick();
      await tick();

      expect(window[area].getItem("k")).toBe('{ "a": 1 }');
      expect(onUpdate).toHaveBeenCalledTimes(1);
    },
  );

  it.each(cases)(
    "$name reads back a stored string that looks like JSON as a string",
    async ({ Component }) => {
      render(StorageBinding, { props: { Component, key: "k", value: "123" } });
      await tick();

      const { component } = render(StorageBinding, {
        props: { Component, key: "k", value: "initial" },
      });
      await tick();

      expect(component.value).toBe("123");
    },
  );

  it.each(
    cases.flatMap((c) => [
      { ...c, method: "clearItem" as const },
      { ...c, method: "clearAll" as const },
    ]),
  )(
    "$name $method resets the bound value",
    async ({ Component, area, method }) => {
      const onUpdate = vi.fn();
      const { component } = render(StorageBinding, {
        props: { Component, key: "k", value: "on", onUpdate },
      });
      await tick();

      component.ref?.[method]();
      await tick();

      expect(component.value).toBeUndefined();
      expect(window[area].getItem("k")).toBeNull();
      expect(onUpdate).toHaveBeenCalledWith({
        prevValue: "on",
        value: undefined,
      });
    },
  );
});
