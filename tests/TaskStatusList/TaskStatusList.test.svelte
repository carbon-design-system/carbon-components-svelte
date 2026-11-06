<script lang="ts">
  import TaskStatusList from "carbon-components-svelte/TaskStatusList/TaskStatusList.svelte";
  import type { ComponentProps } from "svelte";

  export let steps: ComponentProps<TaskStatusList>["steps"] = [];
  export let size: "sm" | "md" = "md";
  export let cancelable = false;
  export let retryable = false;
  export let announce = true;
  export let hideSummary = false;

  let expandedIds: string[] = [];
  let events: unknown[] = [];
</script>

<TaskStatusList
  {steps}
  {size}
  {cancelable}
  {retryable}
  {announce}
  {hideSummary}
  bind:expandedIds
  aria-label="Cluster provisioning"
  on:retry={(event) =>
    (events = [...events, { type: "retry", ...event.detail }])}
  on:cancel={() => (events = [...events, { type: "cancel" }])}
>
  <svelte:fragment slot="step" let:step let:index>
    {index + 1}. {step.label}
  </svelte:fragment>
</TaskStatusList>

<pre data-testid="expanded">{expandedIds.join(",")}</pre>
<pre data-testid="events">{JSON.stringify(events)}</pre>
