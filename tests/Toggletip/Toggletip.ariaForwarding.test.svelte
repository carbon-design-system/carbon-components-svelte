<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";

  export let open = false;
  export let toggletipProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<Toggletip {open} id="tip" {...toggletipProps}>Tip content</Toggletip>
