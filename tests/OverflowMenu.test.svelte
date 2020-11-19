<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "../types";
  import Add16 from "carbon-icons-svelte/lib/Add16";
</script>

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu open flipped>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu flipped direction="top">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu size="xl">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu size="sm">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem primaryFocus danger text="Delete service" />
</OverflowMenu>

<OverflowMenu icon="{Add16}">
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>

<OverflowMenu style="width: auto;">
  <div slot="menu" style="padding: 1rem; color: red;">Custom trigger</div>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
