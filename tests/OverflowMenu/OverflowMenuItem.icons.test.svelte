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
  <OverflowMenuItem iconEnd={Launch} text="End prop" />
  <OverflowMenuItem iconEnd={Launch} iconRight={Edit} text="Both end props" />
  <OverflowMenuItem text="End slot">
    <svg slot="iconEnd" data-testid="slot-icon-end" />
  </OverflowMenuItem>
  <OverflowMenuItem iconEnd={Edit} text="Both end slots">
    <svg slot="iconEnd" data-testid="both-icon-end" />
    <svg slot="iconRight" data-testid="both-icon-right" />
  </OverflowMenuItem>
</OverflowMenu>
