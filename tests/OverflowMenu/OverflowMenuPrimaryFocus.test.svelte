<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem primaryFocus text="API documentation" />
  <OverflowMenuItem text="Delete service" />
</OverflowMenu>
