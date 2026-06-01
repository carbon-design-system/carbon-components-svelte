<svelte:options accessors />

<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  export let open = true;
</script>

<TooltipIcon
  bind:open
  tooltipText="Test tooltip"
  icon={Carbon}
  id="reactive-tooltip"
/>

<button type="button" data-testid="toggle" on:click={() => (open = !open)}>
  {open ? "Close" : "Open"}
</button>
