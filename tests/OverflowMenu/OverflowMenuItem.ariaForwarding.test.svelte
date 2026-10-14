<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let href = "";
  export let itemProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<OverflowMenu open>
  <OverflowMenuItem text="Rename" {href} id="item" {...itemProps} />
</OverflowMenu>
