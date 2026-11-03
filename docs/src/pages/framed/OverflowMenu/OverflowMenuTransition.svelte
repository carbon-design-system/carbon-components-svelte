<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
</script>

<OverflowMenu menuTransition>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    target="_blank"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
