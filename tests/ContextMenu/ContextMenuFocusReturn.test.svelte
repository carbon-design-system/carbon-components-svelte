<script lang="ts">
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";

  export let open = false;
  export let x = 0;
  export let y = 0;

  function openProgrammatically() {
    x = 100;
    y = 100;
    open = true;
  }
</script>

<button type="button" id="host">Host</button>

<button type="button" id="after-host">After host</button>

<p id="non-focusable">Non-focusable target</p>

<button type="button" id="icon-host" aria-label="Icon host">
  <svg id="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" /></svg>
</button>

<button type="button" id="programmatic-trigger" on:click={openProgrammatically}>
  Open via code
</button>

<ContextMenu bind:open bind:x bind:y>
  <ContextMenuOption labelText="Option 1" />
  <ContextMenuOption labelText="Option 2" />
</ContextMenu>
