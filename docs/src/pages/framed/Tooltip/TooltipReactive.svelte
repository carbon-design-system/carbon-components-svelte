<script>
  import { Tooltip, Button } from "carbon-components-svelte";

  let open = true;
</script>

<Tooltip bind:open align="bottom-left">
  Resources are provisioned based on your account's organization.
</Tooltip>

<div style="margin-top: var(--bx-spacing-12);">
  <Button size="small" on:click="{() => (open = !open)}">
    {open ? "Close tooltip" : "Open tooltip"}
  </Button>
</div>

<div>Open: {open}</div>

<style>
  div {
    margin-top: var(--bx-spacing-05);
  }
</style>
