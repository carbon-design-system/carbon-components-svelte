<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu open>
  <OverflowMenuItem text="Edit" {...$$restProps} />
</OverflowMenu>
