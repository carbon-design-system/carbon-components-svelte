<script lang="ts">
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";
  import type { ComponentProps } from "svelte";

  export let hasInteractiveContent: ComponentProps<ExpandableTile>["hasInteractiveContent"] =
    undefined;
  export let content:
    | "text"
    | "link"
    | "anchor"
    | "button"
    | "input"
    | "hidden-input"
    | "tabindex"
    | "contenteditable" = "text";
  /** Add a link below the fold after mount. */
  export let lateLink = false;
</script>

<ExpandableTile
  id="detect"
  data-testid="tile"
  {hasInteractiveContent}
  tileCollapsedLabel="View plan"
  tileExpandedLabel="Hide plan"
>
  <div slot="above">
    {#if content === "link"}
      <a href="/plans">Compare plans</a>
    {:else if content === "anchor"}
      <a id="plan-anchor">Plan anchor</a>
    {:else if content === "button"}
      <button type="button">Upgrade</button>
    {:else if content === "input"}
      <input aria-label="Seats" type="number">
    {:else if content === "hidden-input"}
      <input type="hidden" name="plan" value="team">
    {:else if content === "tabindex"}
      <span tabindex="-1">Usage</span>
    {:else if content === "contenteditable"}
      <span contenteditable="true">Notes</span>
    {:else}
      Team plan
    {/if}
  </div>
  <div slot="below">
    {#if lateLink}
      <a href="/billing">Billing</a>
    {/if}
    Billed monthly
  </div>
</ExpandableTile>
