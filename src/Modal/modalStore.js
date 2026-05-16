import { onMount } from "svelte";
import { get, writable } from "svelte/store";

/** A set of stores indicating whether a modal is open. */
const stores = new Set();

/** Store for the number of open modals. */
const modalsOpen = writable(0);

const updateModalsOpen = () =>
  modalsOpen.set([...stores].filter((open) => get(open)).length);

/**
 * Adds a modal's store to the open modal tracking.
 * Has to be called during component initialization.
 * Modal is automatically removed on destroy.
 * @param {import('svelte/store').Readable<boolean>} openStore
 *   Store that indicates whether the modal is opened.
 */
export const trackModal = (openStore) =>
  onMount(() => {
    stores.add(openStore);
    const unsubscribe = openStore.subscribe(updateModalsOpen);

    return () => {
      unsubscribe();
      stores.delete(openStore);

      updateModalsOpen();
    };
  });

// Ref-counted body scroll lock so multiple components (Modal, SideNav mobile
// overlay, etc.) can independently request the `bx--body--with-modal-open`
// class without racing. The class is added on the first acquire and removed
// only when the last holder releases.
let lockCount = 0;

export const acquireBodyScrollLock = () => {
  lockCount += 1;
  if (typeof document !== "undefined" && lockCount === 1) {
    document.body.classList.add("bx--body--with-modal-open");
  }
};

export const releaseBodyScrollLock = () => {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (typeof document !== "undefined" && lockCount === 0) {
    document.body.classList.remove("bx--body--with-modal-open");
  }
};

let modalsHoldLock = false;
modalsOpen.subscribe((openCount) => {
  if (openCount > 0 && !modalsHoldLock) {
    modalsHoldLock = true;
    acquireBodyScrollLock();
  } else if (openCount === 0 && modalsHoldLock) {
    modalsHoldLock = false;
    releaseBodyScrollLock();
  }
});
