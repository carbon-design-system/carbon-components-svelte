<script lang="ts">
  import { Tooltip, Link, Button } from "../types";
  import Catalog from "carbon-icons-svelte/lib/Catalog.svelte";

  let open = true;
</script>

<Tooltip bind:open on:open on:close>
  Resources are provisioned based on your account's organization.
</Tooltip>

<Tooltip>
  Resources are provisioned based on your account's organization.
</Tooltip>

<Tooltip triggerText="Top" align="top">Top</Tooltip>

<Tooltip triggerText="Right" align="right">Right</Tooltip>

<Tooltip triggerText="Bottom" align="bottom">Bottom</Tooltip>

<Tooltip triggerText="Left" align="left">Left</Tooltip>

<Tooltip>
  Resources are provisioned based on your account's organization.
  <div class="bx--tooltip__footer">
    <Link href="/">Learn more</Link>
    <Button size="sm">Manage</Button>
  </div>
</Tooltip>

<Link href="/">Learn more</Link>

<Button size="sm">Manage</Button>

<Tooltip icon="{Catalog}">
  Resources are provisioned based on your account's organization.
</Tooltip>

<Tooltip>
  <div
    slot="icon"
    style="width: 1rem; height: 1rem; outline: 1px solid red;"
  ></div>
  Resources are provisioned based on your account's organization.
</Tooltip>
