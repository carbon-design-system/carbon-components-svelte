<script>
  import { Tooltip, Button } from "carbon-components-svelte";

  let open = true;
</script>

<Tooltip bind:open triggerText="Resource list" align="start">
  <p>Resources are provisioned based on your account's organization.</p>
</Tooltip>

<div style="margin-top: var(--cds-spacing-12);">
  <Button size="small" disabled="{open}" on:click="{() => (open = true)}">
    Open
  </Button>
  <Button
    size="small"
    kind="secondary"
    disabled="{!open}"
    on:click="{() => (open = false)}"
  >
    Close
  </Button>
</div>
