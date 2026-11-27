<script lang="ts">
  import Dialog from "carbon-components-svelte/Dialog/Dialog.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let modal = false;
  export let preventCloseOnClickOutside = false;
  export let returnFocusTo: ComponentProps<Dialog>["returnFocusTo"] = null;
  export let closedby: ComponentProps<Dialog>["closedby"] = undefined;
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;

  let dialog: Dialog;
  let returnValue = "";
</script>

<button type="button" data-testid="opener" on:click={() => (open = true)}>
  Open
</button>
<h2 data-testid="fallback" tabindex="-1">Fallback heading</h2>
<output data-testid="return-value">{returnValue}</output>

<Dialog
  bind:this={dialog}
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
  <button
    type="button"
    data-testid="close-with-value"
    on:click={() => dialog.close("save")}
  >
    Save
  </button>
</Dialog>
