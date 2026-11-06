<svelte:options accessors />

<script lang="ts">
  import Timeline from "carbon-components-svelte/Timeline/Timeline.svelte";
  import TimelineItem from "carbon-components-svelte/Timeline/TimelineItem.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Timeline>["items"] = [];
  export let order: ComponentProps<Timeline>["order"] = "asc";
  export let groupBy: ComponentProps<Timeline>["groupBy"] = "none";
  export let limit = Number.POSITIVE_INFINITY;
  export let expanded = false;
  export let live = false;
  export let withContent = false;
  export let withChildren = false;
  export let now = Date.parse("2026-11-06T15:00:00Z");
</script>

<Timeline
  aria-label="History"
  {items}
  {order}
  {groupBy}
  {limit}
  bind:expanded
  {live}
  {now}
  locale="en-US"
  timeZone="UTC"
>
  <svelte:fragment slot="content" let:item let:index>
    {#if withContent && item.id === "b"}
      <button type="button">Details for {item.id} at {index}</button>
    {/if}
  </svelte:fragment>
  {#if withChildren}
    <TimelineItem title="Composed" status="pending" />
  {/if}
</Timeline>
