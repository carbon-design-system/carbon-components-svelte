<script lang="ts">
  import {
    Button,
    PasswordInput,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import Information from "carbon-components-svelte/icons/Information.svelte";

  const text = "Requests in the last 30 days, summed across every region";

  // `?inplace` leaves `portalTooltip` unset, so each tooltip opens in place
  // unless it would run past the window's edge.
  const portalTooltip = new URLSearchParams(location.search).has("inplace")
    ? undefined
    : true;
</script>

<!-- One row per component, with a tooltip at each inline edge of the
     window. A centered tooltip there runs past the edge. -->
{#each ["Button", "TooltipIcon", "TooltipDefinition", "PasswordInput"] as name (name)}
  <div
    style="display: flex; justify-content: space-between; padding: 3rem 0.25rem"
  >
    {#each ["start", "end"] as edge (edge)}
      <!-- A narrow field puts the password toggle near the edge. -->
      <span
        data-testid="{name}-{edge}"
        style:width={name === "PasswordInput" ? "6rem" : undefined}
      >
        {#if name === "Button"}
          <Button
            kind="ghost"
            size="small"
            icon={Edit}
            iconDescription={text}
            {portalTooltip}
          />
        {:else if name === "TooltipIcon"}
          <TooltipIcon icon={Information} tooltipText={text} {portalTooltip} />
        {:else if name === "TooltipDefinition"}
          <TooltipDefinition tooltipText={text} align="center" {portalTooltip}>
            Usage
          </TooltipDefinition>
        {:else}
          <PasswordInput
            labelText="Password"
            showPasswordLabel={text}
            tooltipAlignment="center"
            size="sm"
            {portalTooltip}
          />
        {/if}
      </span>
    {/each}
  </div>
{/each}
