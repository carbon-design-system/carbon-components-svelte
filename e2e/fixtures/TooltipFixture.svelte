<script>
  import { Tooltip } from "carbon-components-svelte";

  let open = false;
</script>

<button type="button" data-testid="toggle" on:click={() => (open = !open)}>
  Toggle tooltip
</button>
<Tooltip
  data-testid="tooltip-wrapper"
  bind:open
  enterDelayMs={0}
  leaveDelayMs={0}
>
  <span data-testid="tooltip-content">Tooltip content</span>
</Tooltip>
