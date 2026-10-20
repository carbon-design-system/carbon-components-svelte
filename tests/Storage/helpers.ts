import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

/** LocalStorage and SessionStorage share one engine; each row runs the shared suite once. */
export const storageCases = [
  {
    name: "LocalStorage",
    Component: LocalStorage,
    area: "localStorage",
    defaultKey: "local-storage-key",
    other: "sessionStorage",
  },
  {
    name: "SessionStorage",
    Component: SessionStorage,
    area: "sessionStorage",
    defaultKey: "session-storage-key",
    other: "localStorage",
  },
] as const;

type StorageArea = (typeof storageCases)[number]["area"];

/** Dispatches a real `storage` event on `window`, as another document writing `storageArea` would. */
export function fireStorageEvent(init: StorageEventInit) {
  window.dispatchEvent(new StorageEvent("storage", init));
}

/** Makes reading `window[area]` throw, as blocked storage does; returns a function that restores it. */
export function blockStorage(area: StorageArea) {
  const original = Object.getOwnPropertyDescriptor(window, area);
  Object.defineProperty(window, area, {
    configurable: true,
    get() {
      throw new Error("storage disabled");
    },
  });
  return () => {
    if (original) {
      Object.defineProperty(window, area, original);
    } else {
      Reflect.deleteProperty(window, area);
    }
  };
}
