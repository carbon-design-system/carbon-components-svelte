<script lang="ts">
  import OverflowMenu from "../../src/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../../src/OverflowMenu/OverflowMenuItem.svelte";

  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let cancelClose = false;
  export let open = false;
</script>

<OverflowMenu
  bind:open
  on:close={(e) => {
    if (cancelClose) e.preventDefault();
    onClose(e);
  }}
>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
