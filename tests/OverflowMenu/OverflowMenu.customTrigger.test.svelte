<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu data-testid="custom">
  <span slot="menu">Custom trigger</span>
  <OverflowMenuItem text="Manage credentials" />
</OverflowMenu>
<OverflowMenu data-testid="default">
  <OverflowMenuItem text="Manage credentials" />
</OverflowMenu>
