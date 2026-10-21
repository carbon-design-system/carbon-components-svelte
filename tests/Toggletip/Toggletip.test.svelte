<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Toggletip from "../../src/Toggletip/Toggletip.svelte";

  export let open: ComponentProps<Toggletip>["open"] = false;
  export let portalTooltip: ComponentProps<Toggletip>["portalTooltip"] =
    undefined;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<Toggletip
  bind:open
  {portalTooltip}
  iconDescription="Information"
  on:open={onOpen}
  on:close={onClose}
>
  <p>Content</p>
  <button type="button" data-testid="inside-button">Inside button</button>
</Toggletip>
<button type="button" data-testid="outside-button">Outside button</button>
