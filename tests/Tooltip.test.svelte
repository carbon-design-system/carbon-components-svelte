<script lang="ts">
  import { Tooltip, Link, Button } from "../types";
  import Catalog from "carbon-icons-svelte/lib/Catalog.svelte";

  let open = true;
</script>

<Tooltip bind:open on:open on:close>
  <p>Resources are provisioned based on your account's organization.</p>
</Tooltip>

<Tooltip triggerText="Resource list">
  <p>Resources are provisioned based on your account's organization.</p>
</Tooltip>

<Tooltip triggerText="Top" direction="top">
  <p>Top</p>
</Tooltip>

<Tooltip triggerText="Right" direction="right">
  <p>Right</p>
</Tooltip>

<Tooltip triggerText="Bottom" direction="bottom">
  <p>Bottom</p>
</Tooltip>

<Tooltip triggerText="Left" direction="left">
  <p>Left</p>
</Tooltip>

<Tooltip triggerText="Resource list">
  <p>Resources are provisioned based on your account's organization.</p>
  <div class="bx--tooltip__footer">
    <Link href="/">Learn more</Link>
    <Button size="small">Manage</Button>
  </div>
</Tooltip>

<Link href="/">Learn more</Link>

<Button size="small">Manage</Button>

<Tooltip triggerText="Resource list" icon="{Catalog}">
  <p>Resources are provisioned based on your account's organization.</p>
</Tooltip>

<Tooltip triggerText="Resource list">
  <div
    slot="icon"
    style="width: 1rem; height: 1rem; outline: 1px solid red;"
  ></div>
  <p>Resources are provisioned based on your account's organization.</p>
</Tooltip>
