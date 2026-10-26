<script>
  import {
    Button,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import Information from "carbon-components-svelte/icons/Information.svelte";

  const text = "Requests in the last 30 days, summed across every region";
</script>

<!-- One row per component, with a portalled tooltip at each inline edge of
     the window. A centered tooltip there runs past the edge. -->
{#each ["Button", "TooltipIcon", "TooltipDefinition"] as name (name)}
  <div
    style="display: flex; justify-content: space-between; padding: 3rem 0.25rem"
  >
    {#each ["start", "end"] as edge (edge)}
      <span data-testid="{name}-{edge}">
        {#if name === "Button"}
          <Button
            kind="ghost"
            size="small"
            icon={Edit}
            iconDescription={text}
            portalTooltip
          />
        {:else if name === "TooltipIcon"}
          <TooltipIcon icon={Information} tooltipText={text} portalTooltip />
        {:else}
          <TooltipDefinition tooltipText={text} align="center" portalTooltip>
            Usage
          </TooltipDefinition>
        {/if}
      </span>
    {/each}
  </div>
{/each}
