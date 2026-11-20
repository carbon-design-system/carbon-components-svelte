<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the store whose `guard()` calls this prompt answers.
   * Defaults to the shared `unsavedChanges` store. One prompt answers each
   * store; a second prompt for the same store is ignored.
   * @type {import("./unsaved-changes.js").UnsavedChangesStore}
   */
  export let store = unsavedChanges;

  /** Specify the modal heading */
  export let title = "Discard unsaved changes?";

  /** Specify the discard button text */
  export let confirmText = "Discard";

  /** Specify the keep-editing button text */
  export let cancelText = "Keep editing";

  /**
   * Set the kind of confirmation.
   * @type {"danger" | "warning" | "info"}
   */
  export let kind = "danger";

  import { onMount } from "svelte";
  import ConfirmModal from "../ConfirmModal/ConfirmModal.svelte";
  import { unsavedChanges } from "./unsaved-changes.js";

  let open = false;
  /** Stays true after the first request, so the dialog keeps its DOM. */
  let built = false;
  /** @type {null | import("./unsaved-changes.js").UnsavedChangesRequest} */
  let request = null;

  /** @param {boolean} discard */
  function answer(discard) {
    // Confirm, Escape and the X can each fire once; only the first counts.
    const current = request;
    request = null;
    open = false;
    current?.resolve(discard);
  }

  onMount(() => {
    const unmount = store.mountPrompt();
    if (!unmount) return;
    const unsubscribe = store.prompt.subscribe((next) => {
      request = next;
      if (next) {
        built = true;
        open = true;
      } else {
        open = false;
      }
    });
    return () => {
      unsubscribe();
      unmount();
    };
  });
</script>

{#if built}
  <ConfirmModal
    bind:open
    {kind}
    {title}
    {confirmText}
    {cancelText}
    {...$$restProps}
    on:confirm={() => answer(true)}
    on:cancel={() => answer(false)}
  >
    <slot>Your changes will be lost.</slot>
  </ConfirmModal>
{/if}
