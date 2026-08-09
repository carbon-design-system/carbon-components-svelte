<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<Toggletip>["open"] = false;
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<Toggletip
  bind:open
  iconDescription="Information"
  on:open={onOpen}
  on:close={onClose}
>
  <p>Content</p>
</Toggletip>
