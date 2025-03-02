<script lang="ts">
  import { Tooltip } from "carbon-components-svelte";
</script>

<Tooltip open={true} iconDescription="Information">
  <p data-testid="tooltip-content">Custom tooltip content</p>
</Tooltip>
