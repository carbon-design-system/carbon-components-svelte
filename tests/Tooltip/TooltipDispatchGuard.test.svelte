<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<Tooltip>["open"] = false;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<Tooltip
  bind:open
  iconDescription="Information"
  on:open={onOpen}
  on:close={onClose}
>
  Content
</Tooltip>
