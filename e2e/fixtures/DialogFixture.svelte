<script lang="ts">
  import { Dialog } from "carbon-components-svelte";

  let modalOpen = false;
  let modalOpenCount = 0;
  let modalCloseCount = 0;
  let modalCloseTrigger: string | null = null;

  let nonModalOpen = false;

  let returnOpen = false;
  let returnTarget: HTMLElement;
</script>

<button
  type="button"
  data-testid="open-modal"
  on:click={() => (modalOpen = true)}
>
  Open modal dialog
</button>
<div data-testid="modal-open-count">{modalOpenCount}</div>
<div data-testid="modal-close-count">{modalCloseCount}</div>
<div data-testid="modal-close-trigger">{modalCloseTrigger ?? ""}</div>

<Dialog
  bind:open={modalOpen}
  modal
  aria-label="Modal dialog"
  data-testid="modal-dialog"
  on:open={() => (modalOpenCount += 1)}
  on:close={(e) => {
    modalCloseCount += 1;
    modalCloseTrigger = e.detail.trigger;
  }}
>
  <p>Modal content</p>
  <button type="button" data-testid="modal-focus-target">Focus target</button>
  <form method="dialog">
    <button type="submit" data-testid="modal-close-button">Close</button>
  </form>
</Dialog>

<button
  type="button"
  data-testid="open-non-modal"
  on:click={() => (nonModalOpen = true)}
>
  Open non-modal dialog
</button>
<button type="button" data-testid="outside-button">Outside button</button>

<Dialog
  bind:open={nonModalOpen}
  aria-label="Non-modal dialog"
  data-testid="non-modal-dialog"
>
  <p>Non-modal content</p>
</Dialog>

<button
  type="button"
  data-testid="open-return"
  on:click={() => (returnOpen = true)}
>
  Open dialog with returnFocusTo
</button>
<h2 bind:this={returnTarget} tabindex="-1" data-testid="return-target">
  Return target
</h2>

<Dialog
  bind:open={returnOpen}
  modal
  aria-label="Dialog with returnFocusTo"
  data-testid="return-dialog"
  returnFocusTo={() => returnTarget}
>
  <form method="dialog">
    <button type="submit" data-testid="return-close-button">Close</button>
  </form>
</Dialog>
