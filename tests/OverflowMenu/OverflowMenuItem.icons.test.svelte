<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<OverflowMenu open>
  <OverflowMenuItem icon={Edit} iconRight={Launch} text="Both icons" />
  <OverflowMenuItem text="Slot icon">
    <svg slot="iconRight" data-testid="slot-icon-right" />
  </OverflowMenuItem>
  <OverflowMenuItem text="No icons" />
</OverflowMenu>
