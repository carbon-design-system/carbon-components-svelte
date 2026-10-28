<script lang="ts">
  import Gantt from "carbon-components-svelte/Gantt/Gantt.svelte";
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<Gantt>;

  export let tasks: NonNullable<Props["tasks"]> = [
    {
      id: "plan",
      text: "Planning",
      nodes: [
        {
          id: "brief",
          text: "Brief",
          start: "2026-03-02",
          end: "2026-03-06",
          progress: 100,
        },
        {
          id: "design",
          text: "Design",
          start: "2026-03-09",
          end: "2026-03-13",
          progress: 50,
        },
        { id: "go", text: "Go", start: "2026-03-16", milestone: true },
        { id: "locked", text: "Locked", start: "2026-03-17", readonly: true },
      ],
    },
    { id: "later", text: "Later" },
  ];
  export let links: NonNullable<Props["links"]> = [
    { from: "brief", to: "design" },
    { from: "design", to: "go" },
    { from: "go", to: "design" },
  ];
  export let expandedIds: NonNullable<Props["expandedIds"]> = ["plan"];
  export let zoom: NonNullable<Props["zoom"]> = "day";
  export let readonly = false;
  export let today: Props["today"] = "2026-03-10";
  export let dir: "ltr" | "rtl" | undefined = undefined;
  export let cancel = false;
  type Change = {
    id: string;
    start: string | Date;
    end: string | Date;
    previous: { start: string | Date; end: string | Date };
    mode: string;
    source: string;
  };
  export let log: Array<{ name: string; detail: Change }> = [];

  function handleChange(event: CustomEvent<Change>) {
    log.push({ name: "change", detail: event.detail });
    if (cancel) event.preventDefault();
  }
</script>

{#if dir}
  <LayoutDirection {dir}>
    <Gantt
      labelText="Plan"
      {links}
      {readonly}
      {today}
      bind:tasks
      bind:zoom
      bind:expandedIds
      on:change={handleChange}
    />
  </LayoutDirection>
{:else}
  <Gantt
    labelText="Plan"
    {links}
    {readonly}
    {today}
    bind:tasks
    bind:zoom
    bind:expandedIds
    on:change={handleChange}
  />
{/if}
