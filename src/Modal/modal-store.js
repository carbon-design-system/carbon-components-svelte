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

modalsOpen.subscribe((openCount) => {
  if (typeof document !== "undefined")
    document.body.classList.toggle("bx--body--with-modal-open", openCount > 0);
});
