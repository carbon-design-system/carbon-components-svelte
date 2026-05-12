<script>
  import { TooltipIcon } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";

  let controlledOpen = false;

  let openEvents = 0;
  let closeEvents = 0;
</script>

<div data-testid="controlled-block">
  <button
    type="button"
    data-testid="toggle-controlled"
    on:click={() => (controlledOpen = !controlledOpen)}
  >
    Toggle controlled
  </button>
  <TooltipIcon
    data-testid="tooltip-controlled"
    bind:open={controlledOpen}
    tooltipText="Controlled tooltip"
    icon={Information}
    portalTooltip={false}
    on:open={() => (openEvents += 1)}
    on:close={() => (closeEvents += 1)}
  />
  <span data-testid="open-event-count">{openEvents}</span>
  <span data-testid="close-event-count">{closeEvents}</span>
</div>

<div data-testid="pair-row">
  <TooltipIcon
    data-testid="tooltip-a"
    tooltipText="Tooltip A text"
    icon={Information}
    portalTooltip={false}
  />
  <TooltipIcon
    data-testid="tooltip-b"
    tooltipText="Tooltip B text"
    icon={Information}
    portalTooltip={false}
  />
</div>
