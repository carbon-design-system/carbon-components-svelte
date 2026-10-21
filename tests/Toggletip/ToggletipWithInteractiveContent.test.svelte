<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<Toggletip>["open"] = false;
  export let portalTooltip: ComponentProps<Toggletip>["portalTooltip"] =
    undefined;
  export let onClose: () => void = () => {};
</script>

<Toggletip
  bind:open
  {portalTooltip}
  iconDescription="Information"
  on:close={onClose}
>
  <button type="button" data-testid="inside-button">Inside button</button>
</Toggletip>
<button type="button" data-testid="outside-button">Outside button</button>
