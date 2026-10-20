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
});
