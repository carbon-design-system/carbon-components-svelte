<script lang="ts">
import { ExpandableTile } from "carbon-components-svelte";
import type { ComponentProps } from "svelte";

export let expanded: ComponentProps<ExpandableTile>["expanded"] = false;
export let light: ComponentProps<ExpandableTile>["light"] = false;
export let tileMaxHeight: ComponentProps<ExpandableTile>["tileMaxHeight"] = 0;
export let tilePadding: ComponentProps<ExpandableTile>["tilePadding"] = 0;
export let tileCollapsedIconText: ComponentProps<ExpandableTile>["tileCollapsedIconText"] =
  "Interact to expand Tile";
export let tileExpandedIconText: ComponentProps<ExpandableTile>["tileExpandedIconText"] =
  "Interact to collapse Tile";
export let tileExpandedLabel: ComponentProps<ExpandableTile>["tileExpandedLabel"] =
  "";
export let tileCollapsedLabel: ComponentProps<ExpandableTile>["tileCollapsedLabel"] =
  "";
export let tabindex: ComponentProps<ExpandableTile>["tabindex"] = "0";
export let id: ComponentProps<ExpandableTile>["id"] = "ccs-test";
export let ref: ComponentProps<ExpandableTile>["ref"] = null;
</script>

<ExpandableTile
  bind:expanded
  {light}
  {tileMaxHeight}
  {tilePadding}
  {tileCollapsedIconText}
  {tileExpandedIconText}
  {tileExpandedLabel}
  {tileCollapsedLabel}
  {tabindex}
  {id}
  bind:ref
  on:click
  on:keypress
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div slot="above" data-testid="above-content">
    Above the fold content here
  </div>
  <div slot="below" data-testid="below-content">
    Below the fold content here
  </div>
</ExpandableTile>
