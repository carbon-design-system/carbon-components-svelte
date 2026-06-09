<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let cancelClose = false;

  let open = false;
</script>

<OverflowMenu
  bind:open
  on:close={(e) => {
    console.log("close:open-at-dispatch", open);
    if (cancelClose) {
      e.preventDefault();
    }
  }}
>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
