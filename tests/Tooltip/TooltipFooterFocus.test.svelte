<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TooltipFooter from "carbon-components-svelte/Tooltip/TooltipFooter.svelte";
</script>

<Tooltip triggerText="Resource list">
  <p>Resources are provisioned based on your account's organization.</p>
  <TooltipFooter>
    <a href="/">Learn more</a>
    <button type="button">Manage</button>
  </TooltipFooter>
</Tooltip>
