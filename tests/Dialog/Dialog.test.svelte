<svelte:options accessors />

<script lang="ts">
  import type DialogComponent from "carbon-components-svelte/Dialog/Dialog.svelte";
  import Dialog from "carbon-components-svelte/Dialog/Dialog.svelte";

  export let open = false;
  export let modal = false;
  export let preventCloseOnClickOutside = false;
  export let returnFocusTo: HTMLElement | (() => HTMLElement | null) | null =
    null;
  export let closedby: "any" | "closerequest" | "none" | undefined = undefined;
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;

  export let dialogRef: DialogComponent | undefined = undefined;
  export let returnValue = "";
</script>

<h2 data-testid="fallback" tabindex="-1">Fallback heading</h2>
<button type="button" data-testid="opener" on:click={() => (open = true)}>
  Open
</button>

<Dialog
  bind:this={dialogRef}
  bind:open
  bind:returnValue
  {modal}
  {preventCloseOnClickOutside}
  {returnFocusTo}
  {closedby}
  on:open={(e) => onopen?.(e)}
  on:close={(e) => onclose?.(e)}
>
  <p>Dialog content</p>
  <button
    type="button"
    data-testid="close-button"
    on:click={(e) => {
      const dialog = e.currentTarget.closest("dialog");
      dialog?.close();
    }}
  >
    Close
  </button>
</Dialog>
