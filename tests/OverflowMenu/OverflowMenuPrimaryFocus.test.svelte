<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let open = false;
</script>

<OverflowMenu {open}>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem primaryFocus text="API documentation" />
  <OverflowMenuItem text="Delete service" />
</OverflowMenu>
