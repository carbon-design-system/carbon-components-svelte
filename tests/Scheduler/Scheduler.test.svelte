<script lang="ts">
  import Scheduler from "carbon-components-svelte/Scheduler/Scheduler.svelte";
  import type { ComponentProps } from "svelte";
  import type { Item } from "./scheduler-fixtures";

  export let events: Item[] = [];
  export let view: ComponentProps<Scheduler>["view"] = "week";
  export let date = new Date(Date.UTC(2026, 9, 28, 19));
  export let timeZone: string | undefined = "America/Los_Angeles";
  export let locale = "en-US";
  export let hourFormat: ComponentProps<Scheduler>["hourFormat"] = "auto";
  export let weekStartsOn: ComponentProps<Scheduler>["weekStartsOn"] =
    undefined;
  export let readonly = false;
  export let monthEventLimit = 3;
  export let selection: ComponentProps<Scheduler>["selection"] = null;
  export let cancelCreate = false;
  export let cancelChange = false;
  export let cancelDay = false;
  export let onCreate: (detail: Record<string, unknown>) => void = () => {};
  export let onChange: (detail: Record<string, unknown>) => void = () => {};
  export let onClickEvent: (detail: Record<string, unknown>) => void = () => {};
  export let onClickDay: (detail: Record<string, unknown>) => void = () => {};
</script>

<Scheduler
  bind:events
  bind:view
  bind:date
  bind:selection
  {timeZone}
  {locale}
  {hourFormat}
  {weekStartsOn}
  {readonly}
  {monthEventLimit}
  data-testid="scheduler"
  on:create={(e) => {
    onCreate(e.detail);
    if (cancelCreate) e.preventDefault();
  }}
  on:change={(e) => {
    onChange(e.detail);
    if (cancelChange) e.preventDefault();
  }}
  on:click:event={(e) => onClickEvent(e.detail)}
  on:click:day={(e) => {
    onClickDay(e.detail);
    if (cancelDay) e.preventDefault();
  }}
/>
<div data-testid="view">{view}</div>
<div data-testid="selection">{selection ? "selected" : "none"}</div>
