<script lang="ts">
  import Dialog from "carbon-components-svelte/Dialog/Dialog.svelte";

  export let open = false;
  export let modal = false;
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<Dialog
  bind:open
  {modal}
  on:open={(e) => onopen?.(e)}
  on:close={(e) => onclose?.(e)}
>
  <p>Dialog content</p>
</Dialog>
