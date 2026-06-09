<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
</script>

<OverflowMenu
  on:close={(e) => {
    console.log("close", e.detail);
  }}
>
  <OverflowMenuItem
    disabled
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
    on:click={() => {
      console.log("click", "API documentation");
    }}
  />
  <OverflowMenuItem
    text="Manage credentials"
    on:click={() => {
      console.log("click", "Manage credentials");
    }}
  />
</OverflowMenu>
