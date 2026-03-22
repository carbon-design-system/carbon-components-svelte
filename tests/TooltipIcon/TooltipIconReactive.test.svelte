<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";

  let open = true;

  export function toggle() {
    open = !open;
  }

  export function getOpen() {
    return open;
  }
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
