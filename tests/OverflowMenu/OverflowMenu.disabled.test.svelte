<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu>
  <OverflowMenuItem text="First" />
  <OverflowMenuItem disabled text="Second (disabled)" />
  <OverflowMenuItem text="Third" />
  <OverflowMenuItem disabled text="Fourth (disabled)" />
</OverflowMenu>
