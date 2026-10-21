<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Toggletip from "../../src/Toggletip/Toggletip.svelte";

  export let open: ComponentProps<Toggletip>["open"] = false;
  export let portalTooltip: ComponentProps<Toggletip>["portalTooltip"] =
    undefined;
  export let direction: ComponentProps<Toggletip>["direction"] = "bottom";
  export let align: ComponentProps<Toggletip>["align"] = "center";
  export let iconDescription: ComponentProps<Toggletip>["iconDescription"] =
    "Information";
  export let labelText: ComponentProps<Toggletip>["labelText"] = "";
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<Toggletip
  id="tt"
  bind:open
  {portalTooltip}
  {direction}
  {align}
  {iconDescription}
  {labelText}
  on:open={onOpen}
  on:close={onClose}
>
  <p>Content</p>
  <button type="button" data-testid="inside-button">Inside button</button>
</Toggletip>
<button type="button" data-testid="outside-button">Outside button</button>
