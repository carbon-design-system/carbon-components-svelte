<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
</script>

<OverflowMenu
  on:close={(e) => {
    console.log("close", e.detail);
  }}
>
  <OverflowMenuItem
    text="Manage credentials"
    on:click={(e) => {
      console.log("click", "Manage credentials");
      e.preventDefault(); // Prevent menu from closing
    }}
  />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
    on:click={(e) => {
      console.log("click", "API documentation");
    }}
  />
  <OverflowMenuItem
    danger
    text="Delete service"
    on:click={(e) => {
      console.log("click", "Delete service");
    }}
  />
</OverflowMenu>
